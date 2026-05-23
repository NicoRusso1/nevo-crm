import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as dealsController from '../controllers/deals.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  createDealSchema,
  dealStatsQuerySchema,
  kanbanQuerySchema,
  listDealsQuerySchema,
  updateDealProbabilitySchema,
  updateDealSchema,
  updateDealStageSchema,
} from '../validators/deals.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /deals                       any authenticated user
 *   GET    /deals/kanban                any authenticated user
 *   GET    /deals/stats                 any authenticated user
 *   GET    /deals/:id                   any authenticated user
 *   POST   /deals                       any authenticated user
 *                                       (SALES_REP becomes owner; privileged
 *                                        roles may set any ownerId)
 *   PATCH  /deals/:id                   owner OR ADMIN/MANAGER
 *   PATCH  /deals/:id/stage             owner OR ADMIN/MANAGER (kanban drag)
 *   PATCH  /deals/:id/probability       owner OR ADMIN/MANAGER
 *   DELETE /deals/:id                   owner OR ADMIN/MANAGER
 *
 * Ownership rules live in `deals.service`. Order matters: `/kanban` and
 * `/stats` MUST be declared before `/:id` so they don't get matched as ids.
 */
const router = Router();

router.use(authenticate);

// ── Collection-level GETs (declare BEFORE /:id) ────────────────────────────
router.get('/kanban', validate({ query: kanbanQuerySchema }), dealsController.kanban);
router.get('/stats', validate({ query: dealStatsQuerySchema }), dealsController.stats);
router.get('/', validate({ query: listDealsQuerySchema }), dealsController.list);

// ── Resource GETs ──────────────────────────────────────────────────────────
router.get('/:id', validate({ params: cuidParamSchema }), dealsController.getById);

// ── Mutations ──────────────────────────────────────────────────────────────
router.post('/', validate({ body: createDealSchema }), dealsController.create);

router.patch(
  '/:id',
  validate({ params: cuidParamSchema, body: updateDealSchema }),
  dealsController.update,
);

router.patch(
  '/:id/stage',
  validate({ params: cuidParamSchema, body: updateDealStageSchema }),
  dealsController.updateStage,
);

router.patch(
  '/:id/probability',
  validate({ params: cuidParamSchema, body: updateDealProbabilitySchema }),
  dealsController.updateProbability,
);

router.delete(
  '/:id',
  validate({ params: cuidParamSchema }),
  dealsController.remove,
);

export default router;
