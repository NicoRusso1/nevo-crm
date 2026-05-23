import { z } from 'zod';

/**
 * Shared optional filters for all dashboard endpoints.
 *   - ownerId: scope metrics to a single user. Honoured only for ADMIN/MANAGER —
 *     SALES_REP is force-scoped to themselves in the service.
 *   - from / to: explicit time window (overrides default month window where used)
 */
const baseFilter = {
  ownerId: z.string().cuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
};

export const overviewQuerySchema = z.object({
  ...baseFilter,
  /** Months back for the revenue chart embedded in the overview. */
  months: z.coerce.number().int().min(1).max(36).default(12),
  /** Days window for the "upcoming activities" widget. */
  upcomingDays: z.coerce.number().int().min(1).max(90).default(7),
  /** Top-N rank for the sales reps widget. */
  topRepsLimit: z.coerce.number().int().min(1).max(20).default(5),
});

export const revenueByMonthQuerySchema = z.object({
  ...baseFilter,
  months: z.coerce.number().int().min(1).max(36).default(12),
});

export const topSalesRepsQuerySchema = z.object({
  ...baseFilter,
  limit: z.coerce.number().int().min(1).max(50).default(5),
});

export const leadsBySourceQuerySchema = z.object({
  ...baseFilter,
});

export const pipelineQuerySchema = z.object({
  ownerId: z.string().cuid().optional(),
});

export type OverviewQuery = z.infer<typeof overviewQuerySchema>;
export type RevenueByMonthQuery = z.infer<typeof revenueByMonthQuerySchema>;
export type TopSalesRepsQuery = z.infer<typeof topSalesRepsQuerySchema>;
export type LeadsBySourceQuery = z.infer<typeof leadsBySourceQuerySchema>;
export type PipelineQuery = z.infer<typeof pipelineQuerySchema>;
