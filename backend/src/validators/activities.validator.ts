import { z } from 'zod';
import { ActivityType } from '@prisma/client';

/** `?completed=true|false` coerced into a real boolean for filters. */
const completedQuery = z
  .union([z.literal('true'), z.literal('false'), z.boolean()])
  .transform((v) => (typeof v === 'boolean' ? v : v === 'true'));

// ── CRUD ────────────────────────────────────────────────────────────────────

export const createActivitySchema = z.object({
  type: z.nativeEnum(ActivityType),
  description: z.string().trim().min(1, 'description is required').max(5000),
  dueDate: z.coerce.date().optional(),
  completed: z.boolean().optional(),
  userId: z.string().cuid('userId must be a valid CUID').optional(),
  leadId: z.string().cuid().nullable().optional(),
  dealId: z.string().cuid().nullable().optional(),
});

/**
 * Update accepts explicit `null` on optional FKs to clear the link (detach
 * from lead/deal). `undefined` means "leave as-is".
 */
export const updateActivitySchema = z
  .object({
    type: z.nativeEnum(ActivityType).optional(),
    description: z.string().trim().min(1).max(5000).optional(),
    dueDate: z.coerce.date().nullable().optional(),
    completed: z.boolean().optional(),
    userId: z.string().cuid().optional(),
    leadId: z.string().cuid().nullable().optional(),
    dealId: z.string().cuid().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

/**
 * Toggle endpoint — accepts a body to support both "complete" and "reopen".
 * Defaulting to `true` lets clients call POST without a body to mark done.
 */
export const markCompletedSchema = z.object({
  completed: z.boolean().default(true),
});

// ── List / filters ──────────────────────────────────────────────────────────

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(ActivityType).optional(),
  completed: completedQuery.optional(),
  userId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(), // via deal.clientId
  search: z.string().trim().min(1).max(120).optional(), // matches description
  dueFrom: z.coerce.date().optional(),
  dueTo: z.coerce.date().optional(),
  sortBy: z.enum(['createdAt', 'dueDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Upcoming ────────────────────────────────────────────────────────────────

export const upcomingActivitiesQuerySchema = z.object({
  /** Window size from now, in days. */
  days: z.coerce.number().int().min(1).max(90).default(7),
  /** If omitted, the controller defaults this to the current user. */
  userId: z.string().cuid().optional(),
  type: z.nativeEnum(ActivityType).optional(),
});

// ── Timeline ────────────────────────────────────────────────────────────────

/**
 * Chronological feed. Same filter surface as list but always sorted by
 * `createdAt desc` — exposed as a separate endpoint so the intent is explicit
 * and the response shape can evolve independently (e.g. grouped by day later).
 */
export const timelineQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  userId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  dealId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  type: z.nativeEnum(ActivityType).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ── My feed (current user) ──────────────────────────────────────────────────

export const myActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(ActivityType).optional(),
  completed: completedQuery.optional(),
  sortBy: z.enum(['createdAt', 'dueDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type MarkCompletedInput = z.infer<typeof markCompletedSchema>;
export type ListActivitiesQuery = z.infer<typeof listActivitiesQuerySchema>;
export type UpcomingActivitiesQuery = z.infer<typeof upcomingActivitiesQuerySchema>;
export type TimelineQuery = z.infer<typeof timelineQuerySchema>;
export type MyActivitiesQuery = z.infer<typeof myActivitiesQuerySchema>;
