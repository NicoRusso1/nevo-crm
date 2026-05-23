/**
 * Users service.
 *
 * Two audiences:
 *   - Self-service for the authenticated user (profile, password, avatar)
 *   - Admin CRUD over all users
 *
 * The service is intentionally permissions-agnostic — that's the route layer's
 * job via `authorize(...)`. Service-level guards exist only when a check
 * depends on identity (e.g. "an admin can't delete themselves").
 */
import { Prisma, type User } from '@prisma/client';
import path from 'node:path';
import { promises as fs } from 'node:fs';

import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/bcrypt';
import { ApiError } from '../utils/ApiError';
import { paginate } from '../utils/pagination';
import type { PaginatedResult } from '../types/common';
import type {
  ChangePasswordInput,
  CreateUserInput,
  ListUsersQuery,
  UpdateProfileInput,
  UpdateUserInput,
} from '../validators/users.validator';

export type PublicUser = Omit<User, 'password'>;

/** Columns selected when returning users — never includes the password hash. */
const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

// ── Self-service ────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: publicUserSelect,
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function updateProfile(
  userId: string,
  input: UpdateProfileInput,
): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id: userId },
    data: input,
    select: publicUserSelect,
  });
  return user;
}

export async function changePassword(
  userId: string,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');

  const ok = await verifyPassword(input.currentPassword, user.password);
  if (!ok) throw ApiError.unauthorized('Current password is incorrect');

  const hashed = await hashPassword(input.newPassword);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed },
  });
}

/**
 * Replace the user's avatar with a freshly-uploaded file. Best-effort deletes
 * the previous avatar file from disk so old uploads don't pile up.
 */
export async function updateAvatar(
  userId: string,
  avatarUrl: string,
): Promise<PublicUser> {
  const previous = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatar: true },
  });

  const user = await prisma.user.update({
    where: { id: userId },
    data: { avatar: avatarUrl },
    select: publicUserSelect,
  });

  if (previous?.avatar && previous.avatar !== avatarUrl) {
    await safeDeleteLocalUpload(previous.avatar);
  }

  return user;
}

// ── Admin CRUD ──────────────────────────────────────────────────────────────

export async function list(query: ListUsersQuery): Promise<PaginatedResult<PublicUser>> {
  const { page, pageSize, role, search } = query;

  const where: Prisma.UserWhereInput = {
    ...(role ? { role } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {}),
  };

  return paginate({
    page,
    pageSize,
    findMany: (skip, take) =>
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: publicUserSelect,
      }),
    count: () => prisma.user.count({ where }),
  });
}

export async function findById(id: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: publicUserSelect,
  });
  if (!user) throw ApiError.notFound('User not found');
  return user;
}

export async function create(input: CreateUserInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict('Email is already registered');

  const hashed = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: hashed,
      role: input.role,
    },
    select: publicUserSelect,
  });
  return user;
}

export async function update(id: string, input: UpdateUserInput): Promise<PublicUser> {
  // Pre-check so we return a clean 404 (Prisma would throw P2025 otherwise,
  // which the error handler maps too — but this is clearer).
  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) throw ApiError.notFound('User not found');

  const user = await prisma.user.update({
    where: { id },
    data: input,
    select: publicUserSelect,
  });
  return user;
}

/**
 * Hard-deletes a user.
 *
 * Guards:
 *   - Admins cannot delete their own account.
 *   - Users that own deals are blocked at the DB level (Deal.ownerId is
 *     ON DELETE RESTRICT). We translate the FK error to a friendly 409.
 *
 * Side effects via schema cascade:
 *   - Lead.assignedTo → SetNull (leads remain, just unassigned)
 *   - Activity, Notification → Cascade
 */
export async function remove(id: string, requesterId: string): Promise<void> {
  if (id === requesterId) {
    throw ApiError.badRequest('You cannot delete your own account');
  }

  const existing = await prisma.user.findUnique({
    where: { id },
    select: { id: true, avatar: true },
  });
  if (!existing) throw ApiError.notFound('User not found');

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === 'P2003'
    ) {
      throw ApiError.conflict(
        'Cannot delete user: they own one or more deals. Reassign deals first.',
      );
    }
    throw err;
  }

  if (existing.avatar) {
    await safeDeleteLocalUpload(existing.avatar);
  }
}

// ── internals ───────────────────────────────────────────────────────────────

/**
 * Delete a file referenced by a previously-stored avatar URL. No-op if the
 * URL is external (e.g. an S3/Cloudinary link from a future integration) or
 * the file is already gone.
 */
async function safeDeleteLocalUpload(avatarUrl: string): Promise<void> {
  if (!avatarUrl.startsWith('/uploads/')) return;

  const relative = avatarUrl.replace(/^\/+/, '');
  const absolute = path.join(process.cwd(), relative);
  try {
    await fs.unlink(absolute);
  } catch {
    // File missing or already removed — fine.
  }
}
