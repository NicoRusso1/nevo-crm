/**
 * Dashboard HTTP layer.
 */
import type { Request, Response } from 'express';

import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import * as dashboardService from '../services/dashboard.service';

function requester(req: Request): dashboardService.Requester {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

export const overview = asyncHandler(async (req: Request, res: Response) => {
  const data = await dashboardService.getOverview(
    req.query as unknown as Parameters<typeof dashboardService.getOverview>[0],
    requester(req),
  );
  return ApiResponse.ok(res, data);
});

export const revenueByMonth = asyncHandler(async (req: Request, res: Response) => {
  const series = await dashboardService.getRevenueByMonth(
    req.query as unknown as Parameters<typeof dashboardService.getRevenueByMonth>[0],
    requester(req),
  );
  return ApiResponse.ok(res, { items: series });
});

export const leadsBySource = asyncHandler(async (req: Request, res: Response) => {
  const items = await dashboardService.getLeadsBySource(
    req.query as unknown as Parameters<typeof dashboardService.getLeadsBySource>[0],
    requester(req),
  );
  return ApiResponse.ok(res, { items });
});

export const pipeline = asyncHandler(async (req: Request, res: Response) => {
  const items = await dashboardService.getPipelineDistribution(
    req.query as unknown as Parameters<typeof dashboardService.getPipelineDistribution>[0],
    requester(req),
  );
  return ApiResponse.ok(res, { items });
});

export const topSalesReps = asyncHandler(async (req: Request, res: Response) => {
  const items = await dashboardService.getTopSalesReps(
    req.query as unknown as Parameters<typeof dashboardService.getTopSalesReps>[0],
    requester(req),
  );
  return ApiResponse.ok(res, { items });
});
