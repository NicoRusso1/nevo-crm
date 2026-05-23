/**
 * Notifications HTTP layer.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as notificationsService from '../services/notifications.service';

function userId(req: Request): string {
  if (!req.user) throw ApiError.unauthorized();
  return req.user.id;
}

// ── Self-service ───────────────────────────────────────────────────────────

export const listMine = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.listMine(
    userId(req),
    req.query as unknown as Parameters<typeof notificationsService.listMine>[1],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
    unreadCount: result.unreadCount,
  });
});

export const unreadCount = asyncHandler(async (req: Request, res: Response) => {
  const count = await notificationsService.unreadCount(userId(req));
  return ApiResponse.ok(res, { unreadCount: count });
});

export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markAsRead(
    req.params.id!,
    userId(req),
  );
  return ApiResponse.ok(res, { notification });
});

export const markAsUnread = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.markAsUnread(
    req.params.id!,
    userId(req),
  );
  return ApiResponse.ok(res, { notification });
});

export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.markAllAsRead(userId(req));
  return ApiResponse.ok(res, result);
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await notificationsService.remove(req.params.id!, userId(req));
  return ApiResponse.noContent(res);
});

export const deleteAllRead = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.deleteAllRead(userId(req));
  return ApiResponse.ok(res, result);
});

// ── Admin ──────────────────────────────────────────────────────────────────

export const create = asyncHandler(async (req: Request, res: Response) => {
  const notification = await notificationsService.create(req.body);
  return ApiResponse.created(res, { notification });
});

export const broadcast = asyncHandler(async (req: Request, res: Response) => {
  const result = await notificationsService.broadcast(req.body);
  return ApiResponse.created(res, result);
});
