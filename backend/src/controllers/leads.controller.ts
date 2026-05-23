/**
 * Leads HTTP layer. Pulls `requester` from `req.user` (populated by
 * `authenticate`) and forwards everything else to `leads.service`.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as leadsService from '../services/leads.service';

function requester(req: Request): leadsService.Requester {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await leadsService.list(
    req.query as unknown as Parameters<typeof leadsService.list>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadsService.findById(req.params.id!);
  return ApiResponse.ok(res, { lead });
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadsService.create(req.body, requester(req));
  return ApiResponse.created(res, { lead });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadsService.update(req.params.id!, req.body, requester(req));
  return ApiResponse.ok(res, { lead });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await leadsService.remove(req.params.id!, requester(req));
  return ApiResponse.noContent(res);
});

export const assign = asyncHandler(async (req: Request, res: Response) => {
  const lead = await leadsService.assign(req.params.id!, req.body);
  return ApiResponse.ok(res, { lead });
});

export const convert = asyncHandler(async (req: Request, res: Response) => {
  const result = await leadsService.convertToClient(
    req.params.id!,
    req.body,
    requester(req),
  );
  return ApiResponse.created(res, result);
});
