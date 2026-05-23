import rateLimit, { type Options } from 'express-rate-limit';
import { env } from './env';
import { ERROR_CODES, HTTP_STATUS } from './constants';

/**
 * Global rate limiter. Per-route limiters (e.g. stricter login) can be defined
 * locally in their respective route files using `rateLimit({ ... })`.
 */
export const globalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many requests — please try again later.',
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
} satisfies Partial<Options>);
