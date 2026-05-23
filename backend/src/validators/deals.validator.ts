import { z } from 'zod';
import { DealStage } from '@prisma/client';

const moneySchema = z.coerce
  .number({ invalid_type_error: 'value must be a number' })
  .nonnegative('value cannot be negative')
  .finite('value must be finite');

const probabilitySchema = z.coerce
  .number({ invalid_type_error: 'probability must be a number' })
  .int('probability must be an integer')
  .min(0)
  .max(100);

// ── CRUD ────────────────────────────────────────────────────────────────────

export const createDealSchema = z.object({
  title: z.string().trim().min(2, 'Title is too short').max(160),
  value: moneySchema,
  probability: probabilitySchema.optional(),
  expectedCloseDate: z.coerce.date().optional(),
  stage: z.nativeEnum(DealStage).optional(),
  clientId: z.string().cuid('clientId must be a valid CUID'),
  ownerId: z.string().cuid('ownerId must be a valid CUID').optional(),
});

/**
 * Update accepts `expectedCloseDate: null` to explicitly clear the field.
 * The other nullable behaviours are not allowed here because the underlying
 * columns are non-nullable.
 */
export const updateDealSchema = z
  .object({
    title: z.string().trim().min(2).max(160).optional(),
    value: moneySchema.optional(),
    probability: probabilitySchema.optional(),
    expectedCloseDate: z.coerce.date().nullable().optional(),
    stage: z.nativeEnum(DealStage).optional(),
    clientId: z.string().cuid().optional(),
    ownerId: z.string().cuid().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ── Atomic kanban operations ────────────────────────────────────────────────

/** PATCH /deals/:id/stage — kanban drag-and-drop. */
export const updateDealStageSchema = z.object({
  stage: z.nativeEnum(DealStage),
});

/** PATCH /deals/:id/probability — slider in the deal card. */
export const updateDealProbabilitySchema = z.object({
  probability: probabilitySchema,
});

// ── List / search / filter ──────────────────────────────────────────────────

export const listDealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  stage: z.nativeEnum(DealStage).optional(),
  clientId: z.string().cuid().optional(),
  ownerId: z.string().cuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  minValue: moneySchema.optional(),
  maxValue: moneySchema.optional(),
  closingFrom: z.coerce.date().optional(),
  closingTo: z.coerce.date().optional(),
  sortBy: z
    .enum([
      'createdAt',
      'updatedAt',
      'value',
      'expectedCloseDate',
      'probability',
      'stage',
      'title',
    ])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Kanban ──────────────────────────────────────────────────────────────────

export const kanbanQuerySchema = z.object({
  ownerId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  limitPerColumn: z.coerce.number().int().min(1).max(200).default(50),
});

// ── Stats / revenue ─────────────────────────────────────────────────────────

export const dealStatsQuerySchema = z.object({
  ownerId: z.string().cuid().optional(),
  clientId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
export type UpdateDealStageInput = z.infer<typeof updateDealStageSchema>;
export type UpdateDealProbabilityInput = z.infer<typeof updateDealProbabilitySchema>;
export type ListDealsQuery = z.infer<typeof listDealsQuerySchema>;
export type KanbanQuery = z.infer<typeof kanbanQuerySchema>;
export type DealStatsQuery = z.infer<typeof dealStatsQuerySchema>;
