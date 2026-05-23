import { z } from 'zod';

/**
 * Reusable Zod schemas. Domain-specific validators (user, contact, deal, ...)
 * will live in their own files (e.g. `user.validator.ts`).
 */

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'id is required'),
});

export const cuidParamSchema = z.object({
  id: z.string().cuid('id must be a valid CUID'),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
export type IdParam = z.infer<typeof idParamSchema>;
