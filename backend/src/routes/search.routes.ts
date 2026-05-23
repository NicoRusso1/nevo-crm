import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import * as searchController from '../controllers/search.controller';
import { globalSearchQuerySchema } from '../validators/search.validator';

/**
 * Permission map
 * ──────────────
 *   GET /search   any authenticated user
 *
 * The service silently drops the `users` section for SALES_REP and scopes
 * leads/deals/activities to ownership — no route-level role check needed.
 */
const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate({ query: globalSearchQuerySchema }),
  searchController.globalSearch,
);

export default router;
