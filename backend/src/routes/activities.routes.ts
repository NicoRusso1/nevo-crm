import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as activitiesController from '../controllers/activities.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  createActivitySchema,
  listActivitiesQuerySchema,
  markCompletedSchema,
  myActivitiesQuerySchema,
  timelineQuerySchema,
  upcomingActivitiesQuerySchema,
  updateActivitySchema,
} from '../validators/activities.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /activities                       any authenticated user
 *   GET    /activities/upcoming              any authenticated user (defaults to self)
 *   GET    /activities/timeline              any authenticated user
 *   GET    /activities/me                    any authenticated user
 *   GET    /activities/:id                   any authenticated user
 *   POST   /activities                       any authenticated user
 *                                            (SALES_REP forced to own; ADMIN/
 *                                             MANAGER may assign anyone)
 *   PATCH  /activities/:id                   owner OR ADMIN/MANAGER
 *   PATCH  /activities/:id/complete          owner OR ADMIN/MANAGER
 *   DELETE /activities/:id                   owner OR ADMIN/MANAGER
 *
 * Ownership is enforced in the service layer. Order matters: collection-level
 * GETs (`upcoming`, `timeline`, `me`) are declared BEFORE `/:id`.
 */
const router = Router();

router.use(authenticate);

// ── Collection-level GETs (BEFORE /:id) ────────────────────────────────────
router.get(
  '/upcoming',
  validate({ query: upcomingActivitiesQuerySchema }),
  activitiesController.upcoming,
);
router.get(
  '/timeline',
  validate({ query: timelineQuerySchema }),
  activitiesController.timeline,
);
router.get(
  '/me',
  validate({ query: myActivitiesQuerySchema }),
  activitiesController.myFeed,
);
router.get(
  '/',
  validate({ query: listActivitiesQuerySchema }),
  activitiesController.list,
);

// ── Resource handlers ──────────────────────────────────────────────────────
router.get(
  '/:id',
  validate({ params: cuidParamSchema }),
  activitiesController.getById,
);

router.post(
  '/',
  validate({ body: createActivitySchema }),
  activitiesController.create,
);

router.patch(
  '/:id',
  validate({ params: cuidParamSchema, body: updateActivitySchema }),
  activitiesController.update,
);

router.patch(
  '/:id/complete',
  validate({ params: cuidParamSchema, body: markCompletedSchema }),
  activitiesController.markCompleted,
);

router.delete(
  '/:id',
  validate({ params: cuidParamSchema }),
  activitiesController.remove,
);

export default router;
