/**
 * JWT signing & verification helpers.
 *
 * Two distinct token types, each with its own secret:
 *   - access  → short-lived, sent on every request as `Authorization: Bearer`
 *   - refresh → long-lived, only sent to /auth/refresh
 *
 * Using separate secrets means a leaked refresh token can't be used as an
 * access token and vice versa. The `type` claim is a second line of defence.
 *
 * Note on revocation: this implementation is stateless. To support immediate
 * revocation (logout, password reset, "log me out everywhere"), persist
 * refresh tokens in a dedicated table and check on each refresh. Drop-in spot
 * is `refresh()` in `auth.service.ts`.
 */
import jwt, {
  type JwtPayload,
  type Secret,
  type SignOptions,
  TokenExpiredError,
  JsonWebTokenError,
} from 'jsonwebtoken';
import type { Role } from '@prisma/client';

import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

const ISSUER = 'nevo-api';
const AUDIENCE = 'nevo-client';

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  role: Role;
  type: 'access';
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;
  type: 'refresh';
}

interface AccessTokenInput {
  id: string;
  email: string;
  role: Role;
}

export function signAccessToken(user: AccessTokenInput): string {
  const payload = {
    email: user.email,
    role: user.role,
    type: 'access' as const,
  };
  const options: SignOptions = {
    subject: user.id,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign(payload, env.JWT_SECRET as Secret, options);
}

export function signRefreshToken(userId: string): string {
  const options: SignOptions = {
    subject: userId,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
    issuer: ISSUER,
    audience: AUDIENCE,
  };
  return jwt.sign({ type: 'refresh' as const }, env.JWT_REFRESH_SECRET as Secret, options);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET as Secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string' || decoded.type !== 'access' || !decoded.sub) {
      throw ApiError.unauthorized('Invalid token');
    }
    return decoded as AccessTokenPayload;
  } catch (err) {
    rethrowAsApiError(err, 'Invalid token');
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET as Secret, {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (typeof decoded === 'string' || decoded.type !== 'refresh' || !decoded.sub) {
      throw ApiError.unauthorized('Invalid refresh token');
    }
    return decoded as RefreshTokenPayload;
  } catch (err) {
    rethrowAsApiError(err, 'Invalid refresh token');
  }
}

function rethrowAsApiError(err: unknown, fallback: string): never {
  if (err instanceof ApiError) throw err;
  if (err instanceof TokenExpiredError) throw ApiError.unauthorized('Token expired');
  if (err instanceof JsonWebTokenError) throw ApiError.unauthorized(fallback);
  throw err;
}
