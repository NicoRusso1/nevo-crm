import { z } from 'zod';
import { ActivityType, DealStage } from '@prisma/client';

// ── CRUD ────────────────────────────────────────────────────────────────────

export const createClientSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is too short').max(160),
  contactName: z.string().trim().min(2, 'Contact name is too short').max(120),
  email: z.string().trim().toLowerCase().email().max(191),
  phone: z.string().trim().min(3).max(40).optional(),
  industry: z.string().trim().min(2).max(80).optional(),
});

export const updateClientSchema = createClientSchema
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

// ── List clients ────────────────────────────────────────────────────────────

export const listClientsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  industry: z.string().trim().min(1).max(80).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'companyName', 'contactName', 'industry'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Related: deals of a client ──────────────────────────────────────────────

export const listClientDealsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  stage: z.nativeEnum(DealStage).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'value', 'expectedCloseDate', 'stage'])
    .default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Related: activities tied to a client's deals ────────────────────────────

export const listClientActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.nativeEnum(ActivityType).optional(),
  // `?completed=true` / `?completed=false`. Default = both.
  completed: z
    .union([z.literal('true'), z.literal('false'), z.boolean()])
    .transform((v) => (typeof v === 'boolean' ? v : v === 'true'))
    .optional(),
  sortBy: z.enum(['createdAt', 'dueDate']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// ── Inferred types ──────────────────────────────────────────────────────────

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
export type ListClientsQuery = z.infer<typeof listClientsQuerySchema>;
export type ListClientDealsQuery = z.infer<typeof listClientDealsQuerySchema>;
export type ListClientActivitiesQuery = z.infer<typeof listClientActivitiesQuerySchema>;
