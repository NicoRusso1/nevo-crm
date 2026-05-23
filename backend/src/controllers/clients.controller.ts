/**
 * Clients HTTP layer. Thin — delegates to `clients.service`.
 */
import type { Request, Response } from 'express';

import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as clientsService from '../services/clients.service';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await clientsService.list(
    req.query as unknown as Parameters<typeof clientsService.list>[0],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const detail = await clientsService.findById(req.params.id!);
  return ApiResponse.ok(res, detail);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.create(req.body);
  return ApiResponse.created(res, { client });
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const client = await clientsService.update(req.params.id!, req.body);
  return ApiResponse.ok(res, { client });
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  await clientsService.remove(req.params.id!);
  return ApiResponse.noContent(res);
});

export const listDeals = asyncHandler(async (req: Request, res: Response) => {
  const result = await clientsService.listDeals(
    req.params.id!,
    req.query as unknown as Parameters<typeof clientsService.listDeals>[1],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});

export const listActivities = asyncHandler(async (req: Request, res: Response) => {
  const result = await clientsService.listActivities(
    req.params.id!,
    req.query as unknown as Parameters<typeof clientsService.listActivities>[1],
  );
  return ApiResponse.paginated(res, result.items, {
    page: result.page,
    pageSize: result.pageSize,
    total: result.total,
    totalPages: result.totalPages,
  });
});
