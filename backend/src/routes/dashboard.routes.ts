import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as dashboardController from '../controllers/dashboard.controller';
import {
  leadsBySourceQuerySchema,
  overviewQuerySchema,
  pipelineQuerySchema,
  revenueByMonthQuerySchema,
  topSalesRepsQuerySchema,
} from '../validators/dashboard.validator';

/**
 * Permission map
 * ──────────────
 *   GET /dashboard/overview          any authenticated user
 *   GET /dashboard/revenue/by-month  any authenticated user
 *   GET /dashboard/leads/by-source   any authenticated user
 *   GET /dashboard/pipeline          any authenticated user
 *   GET /dashboard/top-reps          any authenticated user
 *
 * Scoping rules (enforced in `dashboard.service.ts`):
 *   - SALES_REP: metrics auto-scoped to themselves. `?ownerId=` is ignored.
 *   - ADMIN / MANAGER: company-wide by default. `?ownerId=` drills into a rep.
 *   - Top-reps leaderboard is always company-wide.
 */
const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  validate({ query: overviewQuerySchema }),
  dashboardController.overview,
);

router.get(
  '/revenue/by-month',
  validate({ query: revenueByMonthQuerySchema }),
  dashboardController.revenueByMonth,
);

router.get(
  '/leads/by-source',
  validate({ query: leadsBySourceQuerySchema }),
  dashboardController.leadsBySource,
);

router.get(
  '/pipeline',
  validate({ query: pipelineQuerySchema }),
  dashboardController.pipeline,
);

router.get(
  '/top-reps',
  validate({ query: topSalesRepsQuerySchema }),
  dashboardController.topSalesReps,
);

export default router;
