/**
 * Authentication service.
 *
 * Holds all auth business logic so controllers stay thin and so the same
 * primitives can be reused by tests, seeders, or admin tooling.
 */
import type { User } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from '../lib/bcrypt';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { ApiError } from '../utils/ApiError';
import type { LoginInput, RegisterInput } from '../validators/auth.validator';

/** User shape safe to return over the wire — strips the password hash. */
export type PublicUser = Omit<User, 'password'>;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResult {
  user: PublicUser;
  tokens: AuthTokens;
}

/** Register a new SALES_REP. */
export async function register(input: RegisterInput): Promise<PublicUser> {
  const existing = await prisma.user.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) {
    throw ApiError.conflict('Email is already registered');
  }

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      password: passwordHash,
      role: 'SALES_REP', // hard-coded — privilege escalation is not self-service
    },
  });

  return sanitize(user);
}

/** Validate credentials, issue access + refresh tokens. */
export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  // Use the SAME generic message for "no user" and "wrong password" so we
  // don't leak which emails are registered (user-enumeration prevention).
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  const passwordOk = await verifyPassword(input.password, user.password);
  if (!passwordOk) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  return { user: sanitize(user), tokens: issueTokens(user) };
}

/**
 * Exchange a refresh token for a fresh access + refresh pair (rotation).
 *
 * Rotating the refresh token on every use raises the cost of a stolen token —
 * the attacker only has it until the legitimate user refreshes next.
 */
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const payload = verifyRefreshToken(refreshToken);

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    // Treat as unauthorized rather than 404 — the token is no longer valid.
    throw ApiError.unauthorized('Invalid refresh token');
  }

  return issueTokens(user);
}

/** Look up the user behind a verified access token. */
export async function getCurrentUser(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw ApiError.unauthorized('User no longer exists');
  }
  return sanitize(user);
}

// ── internals ────────────────────────────────────────────────────────────────

function issueTokens(user: User): AuthTokens {
  return {
    accessToken: signAccessToken({ id: user.id, email: user.email, role: user.role }),
    refreshToken: signRefreshToken(user.id),
  };
}

function sanitize(user: User): PublicUser {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...rest } = user;
  return rest;
}
