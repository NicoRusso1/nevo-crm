/**
 * Role-based authorization middleware.
 *
 * Usage:
 *   router.get('/admin/users', authenticate, authorize('ADMIN'), handler);
 *   router.post('/leads',       authenticate, authorize('MANAGER', 'SALES_REP'), handler);
 *
 * Always mount AFTER `authenticate` — this middleware assumes `req.user` is
 * populated and only checks role membership.
 */
import type { RequestHandler } from 'express';
import type { Role } from '@prisma/client';

import { ApiError } from '../utils/ApiError';

export function authorize(...allowedRoles: Role[]): RequestHandler {
  if (allowedRoles.length === 0) {
    throw new Error('authorize() requires at least one role');
  }

  return (req, _res, next): void => {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!allowedRoles.includes(req.user.role)) {
      next(ApiError.forbidden('You do not have permission to access this resource'));
      return;
    }
    next();
  };
}
