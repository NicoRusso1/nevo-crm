/**
 * Auth HTTP layer. Thin — every handler delegates to `auth.service`.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as authService from '../services/auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.register(req.body);
  return ApiResponse.created(res, { user });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.login(req.body);
  return ApiResponse.ok(res, { user, ...tokens });
});

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokens = await authService.refresh(req.body.refreshToken);
  return ApiResponse.ok(res, tokens);
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  // `authenticate` middleware guarantees this — defensive check for type-safety.
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.getCurrentUser(req.user.id);
  return ApiResponse.ok(res, { user });
});
