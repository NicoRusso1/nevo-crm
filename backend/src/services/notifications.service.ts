/**
 * Notifications service.
 *
 * Two surfaces:
 *
 *   1. HTTP-facing methods (`listMine`, `markAsRead`, `remove`, ...) used by
 *      the controller. Every one of these scopes to the requester so users
 *      can only touch their own rows.
 *
 *   2. Internal primitives (`notifyUser`, `notifyMany`) — exported so other
 *      services can fire notifications without going through HTTP. Example:
 *
 *         // in deals.service.ts, after stage = WON:
 *         await notifyUser(deal.ownerId, {
 *           title: 'Deal closed-won 🎉',
 *           message: `"${deal.title}" closed for $${deal.value}.`,
 *         });
 *
 *      Failures inside `notifyUser` should never break the calling flow —
 *      callers can decide whether to await or fire-and-forget.
 */
import type { Notification, Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { logger } from '../lib/logger';
import type { PaginatedResult } from '../types/common';
import type {
  BroadcastNotificationInput,
  CreateNotificationInput,
  ListMyNotificationsQuery,
} from '../validators/notifications.validator';

// ── HTTP-facing methods ─────────────────────────────────────────────────────

export async function listMine(
  userId: string,
  query: ListMyNotificationsQuery,
): Promise<PaginatedResult<Notification> & { unreadCount: number }> {
  const { page, pageSize, read, sortOrder } = query;
  const skip = (page - 1) * pageSize;

  const where = {
    userId,
    ...(read !== undefined ? { read } : {}),
  };

  // Fetch page, total, AND unread count in the same round-trip. The UI almost
  // always renders the unread badge next to the list.
  const [items, total, unreadCount] = await prisma.$transaction([
    prisma.notification.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: sortOrder },
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    unreadCount,
  };
}

export async function unreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, read: false } });
}

export async function markAsRead(id: string, userId: string): Promise<Notification> {
  await assertOwned(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { read: true },
  });
}

export async function markAsUnread(id: string, userId: string): Promise<Notification> {
  await assertOwned(id, userId);
  return prisma.notification.update({
    where: { id },
    data: { read: false },
  });
}

/** Bulk-mark every unread notification of `userId` as read. */
export async function markAllAsRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
  return { count: result.count };
}

export async function remove(id: string, userId: string): Promise<void> {
  await assertOwned(id, userId);
  await prisma.notification.delete({ where: { id } });
}

/** Bulk-delete every already-read notification of `userId`. */
export async function deleteAllRead(userId: string): Promise<{ count: number }> {
  const result = await prisma.notification.deleteMany({
    where: { userId, read: true },
  });
  return { count: result.count };
}

// ── Admin: send / broadcast ─────────────────────────────────────────────────

export async function create(input: CreateNotificationInput): Promise<Notification> {
  const user = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!user) throw ApiError.badRequest('Recipient user does not exist');

  return prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
    },
  });
}

/**
 * Broadcast a notification either to an explicit list of userIds or to every
 * user with a given role. The schema enforces "exactly one of".
 *
 * Returns `{ count }` of inserted rows. Uses `createMany` for efficiency.
 */
export async function broadcast(
  input: BroadcastNotificationInput,
): Promise<{ count: number }> {
  const recipients = await resolveRecipients(input);
  if (recipients.length === 0) {
    return { count: 0 };
  }

  const result = await prisma.notification.createMany({
    data: recipients.map((userId) => ({
      userId,
      title: input.title,
      message: input.message,
    })),
  });
  return { count: result.count };
}

// ── Internal primitives (callable from other services) ──────────────────────

export interface NotificationPayload {
  title: string;
  message: string;
}

/**
 * Best-effort: log and swallow failures so a missing notification never breaks
 * the business operation that triggered it. Caller can `await` for tests.
 */
export async function notifyUser(
  userId: string,
  payload: NotificationPayload,
): Promise<Notification | null> {
  try {
    return await prisma.notification.create({
      data: { userId, title: payload.title, message: payload.message },
    });
  } catch (err) {
    logger.error('Failed to create notification', {
      userId,
      title: payload.title,
      message: err instanceof Error ? err.message : String(err),
    });
    return null;
  }
}

/** Same as `notifyUser` but for many recipients in a single insert. */
export async function notifyMany(
  userIds: string[],
  payload: NotificationPayload,
): Promise<{ count: number }> {
  if (userIds.length === 0) return { count: 0 };
  try {
    const result = await prisma.notification.createMany({
      data: userIds.map((userId) => ({
        userId,
        title: payload.title,
        message: payload.message,
      })),
    });
    return { count: result.count };
  } catch (err) {
    logger.error('Failed to broadcast notifications', {
      recipientCount: userIds.length,
      title: payload.title,
      message: err instanceof Error ? err.message : String(err),
    });
    return { count: 0 };
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Throws 404 if the notification doesn't exist, 403 if it isn't owned by the
 * requester. Pre-checking before update/delete gives clean errors instead of
 * Prisma's P2025 ricochet.
 */
async function assertOwned(id: string, userId: string): Promise<void> {
  const found = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!found) throw ApiError.notFound('Notification not found');
  if (found.userId !== userId) {
    throw ApiError.forbidden('You can only act on your own notifications');
  }
}

async function resolveRecipients(
  input: BroadcastNotificationInput,
): Promise<string[]> {
  if (input.userIds && input.userIds.length > 0) {
    // Filter out any ids that don't exist so createMany doesn't FK-fail.
    const found = await prisma.user.findMany({
      where: { id: { in: input.userIds } },
      select: { id: true },
    });
    return found.map((u) => u.id);
  }

  if (input.role) {
    const found = await prisma.user.findMany({
      where: { role: input.role as Role },
      select: { id: true },
    });
    return found.map((u) => u.id);
  }

  return [];
}
