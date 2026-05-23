import { z } from 'zod';
import { DealStage, LeadStatus } from '@prisma/client';

/**
 * Coerces incoming JSON numbers (or numeric strings) into a non-negative float.
 * Prisma will turn this into a Decimal at write time.
 */
const moneySchema = z.coerce
  .number({ invalid_type_error: 'value must be a number' })
  .nonnegative('value cannot be negative')
  .finite('value must be finite');

// ── CRUD ────────────────────────────────────────────────────────────────────

export const createLeadSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(120),
  company: z.string().trim().min(1).max(160).optional(),
  email: z.string().trim().toLowerCase().email().max(191),
  phone: z.string().trim().min(3).max(40).optional(),
  source: z.string().trim().min(2).max(80).optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  value: moneySchema.optional(),
  notes: z.string().trim().max(5000).optional(),
  assignedToId: z.string().cuid('assignedToId must be a valid CUID').nullable().optional(),
});

export const updateLeadSchema = createLeadSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ── List / search ───────────────────────────────────────────────────────────

export const listLeadsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z.nativeEnum(LeadStatus).optional(),
  source: z.string().trim().min(1).max(80).optional(),
  assignedToId: z.string().cuid().optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'value', 'name', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Assign ──────────────────────────────────────────────────────────────────

/**
 * `userId: null` explicitly unassigns. Required field — to detect intent vs
 * "forgot to send it". Use `.nullable()` instead of `.optional()`.
 */
export const assignLeadSchema = z.object({
  userId: z.string().cuid('userId must be a valid CUID').nullable(),
});

// ── Convert lead → client (+ optional deal) ─────────────────────────────────

const dealOnConvertSchema = z.object({
  title: z.string().trim().min(2).max(160),
  value: moneySchema,
  probability: z.coerce.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
  stage: z.nativeEnum(DealStage).optional(),
});

export const convertLeadSchema = z
  .object({
    // Override the values used to build the Client. If absent, we fall back to
    // the lead's own fields (lead.company → companyName, lead.name → contactName).
    companyName: z.string().trim().min(1).max(160).optional(),
    contactName: z.string().trim().min(1).max(120).optional(),
    industry: z.string().trim().min(1).max(80).optional(),

    createDeal: z.boolean().default(false),
    deal: dealOnConvertSchema.optional(),
  })
  .refine((data) => !data.createDeal || data.deal !== undefined, {
    message: 'deal payload is required when createDeal=true',
    path: ['deal'],
  });

// ── Inferred types ──────────────────────────────────────────────────────────

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
export type ListLeadsQuery = z.infer<typeof listLeadsQuerySchema>;
export type AssignLeadInput = z.infer<typeof assignLeadSchema>;
export type ConvertLeadInput = z.infer<typeof convertLeadSchema>;
