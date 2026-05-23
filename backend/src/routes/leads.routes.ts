import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import * as leadsController from '../controllers/leads.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  assignLeadSchema,
  convertLeadSchema,
  createLeadSchema,
  listLeadsQuerySchema,
  updateLeadSchema,
} from '../validators/leads.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /leads                  any authenticated user
 *   GET    /leads/:id              any authenticated user
 *   POST   /leads                  any authenticated user
 *                                  (SALES_REP self-assigns; privileged roles
 *                                   may assign to anyone)
 *   PATCH  /leads/:id              ADMIN / MANAGER, or the lead's assignee
 *   DELETE /leads/:id              ADMIN / MANAGER, or the lead's assignee
 *   PATCH  /leads/:id/assign       ADMIN / MANAGER only
 *   POST   /leads/:id/convert      ADMIN / MANAGER, or the lead's assignee
 *
 * Ownership checks live in `leads.service.ts` — the route layer only enforces
 * role-based gates that the service can't infer.
 */
const router = Router();

router.use(authenticate);

// ── Read ───────────────────────────────────────────────────────────────────
router.get('/', validate({ query: listLeadsQuerySchema }), leadsController.list);
router.get('/:id', validate({ params: cuidParamSchema }), leadsController.getById);

// ── Write ──────────────────────────────────────────────────────────────────
router.post('/', validate({ body: createLeadSchema }), leadsController.create);

router.patch(
  '/:id',
  validate({ params: cuidParamSchema, body: updateLeadSchema }),
  leadsController.update,
);

router.delete(
  '/:id',
  validate({ params: cuidParamSchema }),
  leadsController.remove,
);

// ── Assignment (privileged) ────────────────────────────────────────────────
router.patch(
  '/:id/assign',
  authorize('ADMIN', 'MANAGER'),
  validate({ params: cuidParamSchema, body: assignLeadSchema }),
  leadsController.assign,
);

// ── Conversion (assignee OR privileged — enforced in service) ──────────────
router.post(
  '/:id/convert',
  validate({ params: cuidParamSchema, body: convertLeadSchema }),
  leadsController.convert,
);

export default router;
