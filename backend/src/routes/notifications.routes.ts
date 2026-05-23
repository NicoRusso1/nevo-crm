import { Router } from 'express';

import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import * as notificationsController from '../controllers/notifications.controller';
import { cuidParamSchema } from '../validators/common.validator';
import {
  broadcastNotificationSchema,
  createNotificationSchema,
  listMyNotificationsQuerySchema,
} from '../validators/notifications.validator';

/**
 * Permission map
 * ──────────────
 *   GET    /notifications                    self
 *   GET    /notifications/unread-count       self
 *   PATCH  /notifications/:id/read           self (only own)
 *   PATCH  /notifications/:id/unread         self (only own)
 *   POST   /notifications/mark-all-read      self
 *   DELETE /notifications/:id                self (only own)
 *   DELETE /notifications/read               self (bulk own)
 *
 *   POST   /notifications                    ADMIN — send to one user
 *   POST   /notifications/broadcast          ADMIN — send to many users or role
 *
 * Order matters: `/unread-count`, `/mark-all-read`, and `/read` (DELETE)
 * are declared BEFORE `/:id` so they don't get matched as ids.
 */
const router = Router();

router.use(authenticate);

// ── Self-service (collection-level routes BEFORE /:id) ─────────────────────
router.get(
  '/unread-count',
  notificationsController.unreadCount,
);
router.post(
  '/mark-all-read',
  notificationsController.markAllAsRead,
);
router.delete(
  '/read',
  notificationsController.deleteAllRead,
);
router.get(
  '/',
  validate({ query: listMyNotificationsQuerySchema }),
  notificationsController.listMine,
);

// ── Self-service (resource-level) ──────────────────────────────────────────
router.patch(
  '/:id/read',
  validate({ params: cuidParamSchema }),
  notificationsController.markAsRead,
);
router.patch(
  '/:id/unread',
  validate({ params: cuidParamSchema }),
  notificationsController.markAsUnread,
);
router.delete(
  '/:id',
  validate({ params: cuidParamSchema }),
  notificationsController.remove,
);

// ── Admin ──────────────────────────────────────────────────────────────────
router.post(
  '/',
  authorize('ADMIN'),
  validate({ body: createNotificationSchema }),
  notificationsController.create,
);
router.post(
  '/broadcast',
  authorize('ADMIN'),
  validate({ body: broadcastNotificationSchema }),
  notificationsController.broadcast,
);

export default router;
