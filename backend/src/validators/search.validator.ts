import { z } from 'zod';

/** Allowed search targets. SALES_REP gets `users` silently dropped. */
export const SEARCH_TYPES = ['users', 'leads', 'clients', 'deals', 'activities'] as const;
export type SearchType = (typeof SEARCH_TYPES)[number];

/**
 * Coerces `?types=leads,deals` (or repeated `?types=leads&types=deals`, or
 * already an array) into a validated `SearchType[]`.
 */
const typesSchema = z.preprocess(
  (val) => {
    if (Array.isArray(val)) return val;
    if (typeof val === 'string') {
      return val.split(',').map((t) => t.trim()).filter(Boolean);
    }
    return undefined;
  },
  z.array(z.enum(SEARCH_TYPES)).min(1).optional(),
);

export const globalSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Query must be at least 2 characters')
    .max(120, 'Query is too long'),
  types: typesSchema,
  /** Per-type cap. The frontend can hit the resource list endpoint for more. */
  limit: z.coerce.number().int().min(1).max(20).default(5),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
