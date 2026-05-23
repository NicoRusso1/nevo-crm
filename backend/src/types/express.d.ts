/**
 * Augmentations to Express's built-in types.
 *
 * - `req.id`   → unique request id attached by the requestId middleware
 * - `req.user` → populated by the (future) auth middleware once it lands
 */
import 'express';

declare global {
  namespace Express {
    interface UserPayload {
      id: string;
      email: string;
      role?: string;
    }

    interface Request {
      id: string;
      user?: UserPayload;
    }
  }
}

export {};
