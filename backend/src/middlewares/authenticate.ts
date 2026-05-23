/**
 * Authentication middleware.
 *
 * Extracts the bearer token from the `Authorization` header, verifies it, and
 * populates `req.user` so downstream handlers can rely on it. The actual JWT
 * mechanics live in `lib/jwt.ts` — this layer is pure HTTP glue.
 */
import type { RequestHandler } from 'express';

import { verifyAccessToken } from '../lib/jwt';
import { ApiError } from '../utils/ApiError';

const BEARER_PREFIX = 'Bearer ';

export const authenticate: RequestHandler = (req, _res, next): void => {
  const header = req.header('authorization');

  if (!header || !header.startsWith(BEARER_PREFIX)) {
    next(ApiError.unauthorized('Missing or invalid Authorization header'));
    return;
  }

  const token = header.slice(BEARER_PREFIX.length).trim();
  if (!token) {
    next(ApiError.unauthorized('Missing access token'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    next();
  } catch (err) {
    next(err);
  }
};
