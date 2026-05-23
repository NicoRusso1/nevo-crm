import { z } from 'zod';
import { Role } from '@prisma/client';

/** `?read=true|false` coerced into a boolean. */
const readQuery = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

// ── My notifications ────────────────────────────────────────────────────────

export const listMyNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  read: readQuery.optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Admin: send to specific user(s) ─────────────────────────────────────────

const titleSchema = z.string().trim().min(2).max(200);
const messageSchema = z.string().trim().min(1).max(5000);

/**
 * Direct notification to one user — invoked from the admin UI or, more
 * commonly, from other services (deal moves stage, activity due tomorrow, ...).
 */
export const createNotificationSchema = z.object({
  userId: z.string().cuid('userId must be a valid CUID'),
  title: titleSchema,
  message: messageSchema,
});

// ── Admin: broadcast ────────────────────────────────────────────────────────

/**
 * Either an explicit list of `userIds` OR a `role` filter — exactly one.
 *
 * Using a `refine` instead of a discriminated union keeps the JSON shape
 * minimal: `{ userIds, title, message }` or `{ role, title, message }`.
 */
export const broadcastNotificationSchema = z
  .object({
    userIds: z.array(z.string().cuid()).min(1).max(500).optional(),
    role: z.nativeEnum(Role).optional(),
    title: titleSchema,
    message: messageSchema,
  })
  .refine(
    (data) => (data.userIds === undefined) !== (data.role === undefined),
    {
      message: 'Provide exactly one of: userIds[] or role',
      path: ['userIds'],
    },
  );

// ── Inferred types ──────────────────────────────────────────────────────────

export type ListMyNotificationsQuery = z.infer<typeof listMyNotificationsQuerySchema>;
export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
