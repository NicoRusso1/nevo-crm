import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import * as clientsController from '../controllers/clients.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  createClientSchema,
  listClientActivitiesQuerySchema,
  listClientDealsQuerySchema,
  listClientsQuerySchema,
  updateClientSchema,
} from '../validators/clients.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /clients                       any authenticated user
 *   GET    /clients/:id                   any authenticated user
 *   GET    /clients/:id/deals             any authenticated user
 *   GET    /clients/:id/activities        any authenticated user
 *   POST   /clients                       any authenticated user
 *   PATCH  /clients/:id                   any authenticated user
 *   DELETE /clients/:id                   ADMIN, MANAGER
 *
 * Delete is restricted because Client → Deals → Activities cascades; a single
 * delete can wipe an account's entire commercial history.
 */
const router = Router();

router.use(authenticate);

// ── Read ───────────────────────────────────────────────────────────────────
router.get('/', validate({ query: listClientsQuerySchema }), clientsController.list);

router.get(
  '/:id',
  validate({ params: cuidParamSchema }),
  clientsController.getById,
);

router.get(
  '/:id/deals',
  validate({ params: cuidParamSchema, query: listClientDealsQuerySchema }),
  clientsController.listDeals,
);

router.get(
  '/:id/activities',
  validate({ params: cuidParamSchema, query: listClientActivitiesQuerySchema }),
  clientsController.listActivities,
);

// ── Write ──────────────────────────────────────────────────────────────────
router.post('/', validate({ body: createClientSchema }), clientsController.create);

router.patch(
  '/:id',
  validate({ params: cuidParamSchema, body: updateClientSchema }),
  clientsController.update,
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate({ params: cuidParamSchema }),
  clientsController.remove,
);

export default router;
