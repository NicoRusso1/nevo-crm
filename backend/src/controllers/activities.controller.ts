/**
 * Activities HTTP layer.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as activitiesService from '../services/activities.service';

function requester(req: Request): activitiesService.Requester {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

// ── Collection-level GETs ──────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await activitiesService.list(
    req.query as unknown as Parameters<typeof activitiesService.list>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const upcoming = asyncHandler(async (req: Request, res: Response) => {
  const result = await activitiesService.upcoming(
    req.query as unknown as Parameters<typeof activitiesService.upcoming>[0],
    requester(req),
  );
  return ApiResponse.ok(res, result);
});

export const timeline = asyncHandler(async (req: Request, res: Response) => {
  const result = await activitiesService.timeline(
    req.query as unknown as Parameters<typeof activitiesService.timeline>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const myFeed = asyncHandler(async (req: Request, res: Response) => {
  const result = await activitiesService.myFeed(
    req.query as unknown as Parameters<typeof activitiesService.myFeed>[0],
    requester(req),
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

// ── Resource handlers ──────────────────────────────────────────────────────

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const activity = await activitiesService.findById(req.params.id!);
  return ApiResponse.ok(res, { activity });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const activity = await activitiesService.create(req.body, requester(req));
  return ApiResponse.created(res, { activity });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const activity = await activitiesService.update(
    req.params.id!,
    req.body,
    requester(req),
  );
  return ApiResponse.ok(res, { activity });
});

export const markCompleted = asyncHandler(async (req: Request, res: Response) => {
  const activity = await activitiesService.markCompleted(
    req.params.id!,
    req.body,
    requester(req),
  );
  return ApiResponse.ok(res, { activity });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await activitiesService.remove(req.params.id!, requester(req));
  return ApiResponse.noContent(res);
});
