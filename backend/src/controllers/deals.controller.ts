/**
 * Deals HTTP layer.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as dealsService from '../services/deals.service';

function requester(req: Request): dealsService.Requester {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

// ── List + detail ──────────────────────────────────────────────────────────

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await dealsService.list(
    req.query as unknown as Parameters<typeof dealsService.list>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealsService.findById(req.params.id!);
  return ApiResponse.ok(res, { deal });
});

// ── Kanban + stats ─────────────────────────────────────────────────────────

export const kanban = asyncHandler(async (req: Request, res: Response) => {
  const board = await dealsService.getKanban(
    req.query as unknown as Parameters<typeof dealsService.getKanban>[0],
  );
  return ApiResponse.ok(res, board);
});

export const stats = asyncHandler(async (req: Request, res: Response) => {
  const summary = await dealsService.getStats(
    req.query as unknown as Parameters<typeof dealsService.getStats>[0],
  );
  return ApiResponse.ok(res, summary);
});

// ── Mutations ──────────────────────────────────────────────────────────────

export const create = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealsService.create(req.body, requester(req));
  return ApiResponse.created(res, { deal });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealsService.update(req.params.id!, req.body, requester(req));
  return ApiResponse.ok(res, { deal });
});

export const updateStage = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealsService.updateStage(req.params.id!, req.body, requester(req));
  return ApiResponse.ok(res, { deal });
});

export const updateProbability = asyncHandler(async (req: Request, res: Response) => {
  const deal = await dealsService.updateProbability(req.params.id!, req.body, requester(req));
  return ApiResponse.ok(res, { deal });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await dealsService.remove(req.params.id!, requester(req));
  return ApiResponse.noContent(res);
});
