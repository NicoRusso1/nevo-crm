/**
 * Users HTTP layer. Thin — delegates to `users.service`.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { publicAvatarUrl } from '../middlewares/upload';
import * as usersService from '../services/users.service';

// ── Self-service (any authenticated user) ───────────────────────────────────

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await usersService.getProfile(req.user.id);
  return ApiResponse.ok(res, { user });
});

export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  const user = await usersService.updateProfile(req.user.id, req.body);
  return ApiResponse.ok(res, { user });
});

export const changeMyPassword = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await usersService.changePassword(req.user.id, req.body);
  return ApiResponse.ok(res, { message: 'Password updated' });
});

export const uploadMyAvatar = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.file) throw ApiError.badRequest('No file uploaded');

  const avatarUrl = publicAvatarUrl(req.file.filename);
  const user = await usersService.updateAvatar(req.user.id, avatarUrl);
  return ApiResponse.ok(res, { user });
});

// ── Admin / read-only management ────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await usersService.list(
    req.query as unknown as Parameters<typeof usersService.list>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.findById(req.params.id);
  return ApiResponse.ok(res, { user });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.create(req.body);
  return ApiResponse.created(res, { user });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const user = await usersService.update(req.params.id, req.body);
  return ApiResponse.ok(res, { user });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw ApiError.unauthorized();
  await usersService.remove(req.params.id, req.user.id);
  return ApiResponse.noContent(res);
});
