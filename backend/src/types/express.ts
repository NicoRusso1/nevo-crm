/**
 * Augmentations to Express's built-in types.
 *
 * - `req.id`   → unique request id attached by the `requestId` middleware
 * - `req.user` → populated by the `authenticate` middleware
 */
import 'express';
import type { Role } from '@prisma/client';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role: Role;
    }

    interface Request {
      id: string;
      user?: UserPayload;
    }
  }
}

export {};
