import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { uploadAvatar } from '../middlewares/upload';
import * as usersController from '../controllers/users.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  changePasswordSchema,
  createUserSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  updateUserSchema,
} from '../validators/users.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /users/me              any authenticated user
 *   PATCH  /users/me              any authenticated user
 *   PATCH  /users/me/password     any authenticated user
 *   POST   /users/me/avatar       any authenticated user
 *
 *   GET    /users                 ADMIN, MANAGER
 *   GET    /users/:id             ADMIN, MANAGER
 *   POST   /users                 ADMIN
 *   PATCH  /users/:id             ADMIN
 *   DELETE /users/:id             ADMIN
 *
 * IMPORTANT: the `/me/*` routes are declared BEFORE `/:id` so Express's
 * matcher doesn't treat "me" as an id.
 */
const router = Router();

// Everything under /users requires authentication.
router.use(authenticate);

// ── Self-service ───────────────────────────────────────────────────────────
router.get('/me', usersController.getMe);
router.patch('/me', validate({ body: updateProfileSchema }), usersController.updateMe);
router.patch(
  '/me/password',
  validate({ body: changePasswordSchema }),
  usersController.changeMyPassword,
);
router.post('/me/avatar', uploadAvatar, usersController.uploadMyAvatar);

// ── Read (ADMIN + MANAGER) ─────────────────────────────────────────────────
router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate({ query: listUsersQuerySchema }),
  usersController.list,
);
router.get(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate({ params: cuidParamSchema }),
  usersController.getById,
);

// ── Write (ADMIN only) ─────────────────────────────────────────────────────
router.post('/', authorize('ADMIN'), validate({ body: createUserSchema }), usersController.create);
router.patch(
  '/:id',
  authorize('ADMIN'),
  validate({ params: cuidParamSchema, body: updateUserSchema }),
  usersController.update,
);
router.delete(
  '/:id',
  authorize('ADMIN'),
  validate({ params: cuidParamSchema }),
  usersController.remove,
);

export default router;
