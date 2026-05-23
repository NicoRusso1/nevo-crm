import type { Request, Response } from 'express';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getHealthStatus } from '../services/health.service';

/**
 * GET /health  → liveness + DB readiness probe.
 */
export const healthCheck = asyncHandler(async (_req: Request, res: Response) => {
  const status = await getHealthStatus();
  return ApiResponse.ok(res, status);
});

/**
 * GET /  → root welcome endpoint.
 */
export const root = (_req: Request, res: Response): void => {
  ApiResponse.ok(res, {
    name: 'neVo API',
    message: 'Welcome to neVo — CRM SaaS backend.',
    docs: '/api/v1/health',
  });
};
