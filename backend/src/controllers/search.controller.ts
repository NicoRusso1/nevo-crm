/**
 * Global search HTTP layer.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as searchService from '../services/search.service';

function requester(req: Request): searchService.Requester {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
  const result = await searchService.globalSearch(
    req.query as unknown as Parameters<typeof searchService.globalSearch>[0],
    requester(req),
  );
  return ApiResponse.ok(res, result);
});
