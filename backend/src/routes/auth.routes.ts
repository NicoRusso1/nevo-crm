import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as authController from '../controllers/auth.controller';
import {
  loginSchema,
  refreshSchema,
  registerSchema,
} from '../validators/auth.validator';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';

/**
 * Dedicated, stricter rate limiter on login & refresh.
 *
 * Login is the prime target for credential-stuffing bots; the global limiter
 * (100/15min) is too generous. 5 attempts per 15 minutes per IP balances UX
 * (typo tolerance) against brute-force resistance.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  // Don't count successful logins against the budget — only failed attempts.
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
      message: 'Too many attempts. Please try again later.',
    },
  },
  statusCode: HTTP_STATUS.TOO_MANY_REQUESTS,
});

const router = Router();

router.post('/register', validate({ body: registerSchema }), authController.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), authController.login);
router.post('/refresh', authLimiter, validate({ body: refreshSchema }), authController.refresh);
router.get('/me', authenticate, authController.me);

export default router;
