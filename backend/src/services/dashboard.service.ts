/**
 * Dashboard analytics service.
 *
 * Design principles:
 *   - All metrics that load together on the same screen are computed in
 *     parallel (`Promise.all`) so the dashboard returns in one DB round-trip.
 *   - Money is always serialized as a string ("123456.78") — never as a JS
 *     number — to preserve Decimal precision.
 *   - Time series fill missing buckets with zero so the frontend can render
 *     charts without gaps.
 *   - SALES_REP is automatically scoped to themselves. ADMIN/MANAGER see
 *     company-wide data and may pass `ownerId` to drill into a rep.
 */
import { Prisma, type DealStage, type LeadStatus, type Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type {
  LeadsBySourceQuery,
  OverviewQuery,
  PipelineQuery,
  RevenueByMonthQuery,
  TopSalesRepsQuery,
} from '../validators/dashboard.validator';

export interface Requester {
  id: string;
  role: Role;
}

// ── Public response shapes (frontend-friendly) ──────────────────────────────

export interface DashboardKpis {
  totalRevenue: string;
  monthlyRevenue: string;
  /** Percent change vs previous month. `null` if previous month had zero revenue. */
  monthlyRevenueChange: number | null;
  wonDeals: number;
  lostDeals: number;
  /** WON / (WON + LOST) × 100. `null` if there were no closed deals. */
  winRate: number | null;
  /** Lead → customer conversion: leads with status WON / total leads × 100. */
  leadConversionRate: number | null;
  activeLeads: number;
  newLeadsThisMonth: number;
}

export interface RevenueByMonthPoint {
  /** ISO-ish month bucket: "2026-03". Stable, sortable, locale-independent. */
  month: string;
  revenue: string;
  dealCount: number;
}

export interface LeadsBySourceItem {
  source: string;
  count: number;
}

export interface PipelineColumn {
  stage: DealStage;
  count: number;
  totalValue: string;
  weightedValue: string;
}

export interface TopSalesRep {
  user: {
    id: string;
    name: string;
    email: string;
    avatar: string | null;
    role: Role;
  };
  totalRevenue: string;
  dealCount: number;
}

export interface UpcomingActivityItem {
  id: string;
  type: string;
  description: string;
  dueDate: Date | null;
  lead: { id: string; name: string; company: string | null } | null;
  deal: { id: string; title: string; stage: DealStage } | null;
}

export interface DashboardOverview {
  scope: { ownerId: string | null };
  kpis: DashboardKpis;
  revenueByMonth: RevenueByMonthPoint[];
  leadsBySource: LeadsBySourceItem[];
  pipelineDistribution: PipelineColumn[];
  topSalesReps: TopSalesRep[];
  upcomingActivities: UpcomingActivityItem[];
}

// ── Stages (pipeline order) ─────────────────────────────────────────────────

const STAGES: readonly DealStage[] = [
  'LEAD',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;

// ── Overview ────────────────────────────────────────────────────────────────

export async function getOverview(
  query: OverviewQuery,
  requester: Requester,
): Promise<DashboardOverview> {
  const ownerId = effectiveOwnerScope(requester, query.ownerId);
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const lastMonthStart = startOfMonth(addMonths(now, -1));

  const dealFilter = (extra: Prisma.DealWhereInput = {}): Prisma.DealWhereInput => ({
    ...extra,
    ...(ownerId ? { ownerId } : {}),
  });

  const leadFilter = (extra: Prisma.LeadWhereInput = {}): Prisma.LeadWhereInput => ({
    ...extra,
    ...(ownerId ? { assignedToId: ownerId } : {}),
  });

  // Fire everything in parallel — these queries don't depend on each other.
  const [
    totalRevenueAgg,
    monthlyRevenueAgg,
    prevMonthlyRevenueAgg,
    closedDealsByStage,
    activeLeadsCount,
    newLeadsThisMonthCount,
    leadStatusGroups,
    revenueByMonth,
    leadsBySource,
    pipelineDistribution,
    topSalesReps,
    upcomingActivities,
  ] = await Promise.all([
    prisma.deal.aggregate({
      where: dealFilter({ stage: 'WON' }),
      _sum: { value: true },
    }),
    prisma.deal.aggregate({
      where: dealFilter({ stage: 'WON', updatedAt: { gte: thisMonthStart } }),
      _sum: { value: true },
    }),
    prisma.deal.aggregate({
      where: dealFilter({
        stage: 'WON',
        updatedAt: { gte: lastMonthStart, lt: thisMonthStart },
      }),
      _sum: { value: true },
    }),
    prisma.deal.groupBy({
      by: ['stage'],
      where: dealFilter({ stage: { in: ['WON', 'LOST'] } }),
      _count: { _all: true },
    }),
    prisma.lead.count({
      where: leadFilter({ status: { notIn: ['WON', 'LOST'] } }),
    }),
    prisma.lead.count({
      where: leadFilter({ createdAt: { gte: thisMonthStart } }),
    }),
    prisma.lead.groupBy({
      by: ['status'],
      where: leadFilter(),
      _count: { _all: true },
    }),
    computeRevenueByMonth(ownerId, query.months),
    computeLeadsBySource(ownerId),
    computePipelineDistribution(ownerId),
    computeTopSalesReps(query.topRepsLimit),
    computeUpcomingActivities(requester.id, query.upcomingDays, 10),
  ]);

  const wonCount = countForStage(closedDealsByStage, 'WON');
  const lostCount = countForStage(closedDealsByStage, 'LOST');
  const closedTotal = wonCount + lostCount;

  // Lead conversion: status WON / total leads
  const wonLeadCount = leadStatusGroups.find((g) => g.status === 'WON')?._count._all ?? 0;
  const totalLeads = leadStatusGroups.reduce((acc, g) => acc + g._count._all, 0);

  const kpis: DashboardKpis = {
    totalRevenue: decimalToString(totalRevenueAgg._sum.value),
    monthlyRevenue: decimalToString(monthlyRevenueAgg._sum.value),
    monthlyRevenueChange: percentChange(
      monthlyRevenueAgg._sum.value,
      prevMonthlyRevenueAgg._sum.value,
    ),
    wonDeals: wonCount,
    lostDeals: lostCount,
    winRate: closedTotal > 0 ? round1((wonCount / closedTotal) * 100) : null,
    leadConversionRate: totalLeads > 0 ? round1((wonLeadCount / totalLeads) * 100) : null,
    activeLeads: activeLeadsCount,
    newLeadsThisMonth: newLeadsThisMonthCount,
  };

  return {
    scope: { ownerId: ownerId ?? null },
    kpis,
    revenueByMonth,
    leadsBySource,
    pipelineDistribution,
    topSalesReps,
    upcomingActivities,
  };
}

// ── Granular endpoints (each chart can refresh independently) ───────────────

export async function getRevenueByMonth(
  query: RevenueByMonthQuery,
  requester: Requester,
): Promise<RevenueByMonthPoint[]> {
  const ownerId = effectiveOwnerScope(requester, query.ownerId);
  return computeRevenueByMonth(ownerId, query.months);
}

export async function getLeadsBySource(
  query: LeadsBySourceQuery,
  requester: Requester,
): Promise<LeadsBySourceItem[]> {
  const ownerId = effectiveOwnerScope(requester, query.ownerId);
  return computeLeadsBySource(ownerId);
}

export async function getPipelineDistribution(
  query: PipelineQuery,
  requester: Requester,
): Promise<PipelineColumn[]> {
  const ownerId = effectiveOwnerScope(requester, query.ownerId);
  return computePipelineDistribution(ownerId);
}

export async function getTopSalesReps(
  query: TopSalesRepsQuery,
  _requester: Requester,
): Promise<TopSalesRep[]> {
  // Leaderboards are always company-wide — never scoped by role.
  return computeTopSalesReps(query.limit);
}

// ── Implementations ────────────────────────────────────────────────────────

/**
 * Revenue grouped by month for the last `months` months, including months
 * with no WON deals (filled with zero) so the time series is contiguous.
 *
 * Uses raw SQL because Prisma's groupBy can't bucket by `DATE_FORMAT(...)`.
 * Filters are parameterised with `Prisma.sql` — no string concat.
 */
async function computeRevenueByMonth(
  ownerId: string | undefined,
  months: number,
): Promise<RevenueByMonthPoint[]> {
  const now = new Date();
  const start = startOfMonth(addMonths(now, -(months - 1)));

  const conditions: Prisma.Sql[] = [Prisma.sql`stage = 'WON'`, Prisma.sql`updatedAt >= ${start}`];
  if (ownerId) conditions.push(Prisma.sql`ownerId = ${ownerId}`);
  const whereSql = Prisma.join(conditions, ' AND ');

  const rows = await prisma.$queryRaw<
    Array<{ month: string; revenue: Prisma.Decimal | null; dealCount: bigint }>
  >`
    SELECT DATE_FORMAT(updatedAt, '%Y-%m') AS month,
           SUM(value) AS revenue,
           COUNT(*) AS dealCount
    FROM \`Deal\`
    WHERE ${whereSql}
    GROUP BY month
    ORDER BY month ASC
  `;

  const byMonth = new Map(rows.map((r) => [r.month, r]));

  // Materialize every month in the window, even empty ones.
  const series: RevenueByMonthPoint[] = [];
  for (let i = 0; i < months; i++) {
    const d = addMonths(start, i);
    const key = monthKey(d);
    const row = byMonth.get(key);
    series.push({
      month: key,
      revenue: row?.revenue ? row.revenue.toString() : '0',
      dealCount: row ? Number(row.dealCount) : 0,
    });
  }
  return series;
}

async function computeLeadsBySource(
  ownerId: string | undefined,
): Promise<LeadsBySourceItem[]> {
  const groups = await prisma.lead.groupBy({
    by: ['source'],
    where: ownerId ? { assignedToId: ownerId } : {},
    _count: { _all: true },
  });

  return groups
    .map((g) => ({
      source: g.source ?? 'Unknown',
      count: g._count._all,
    }))
    .sort((a, b) => b.count - a.count);
}

async function computePipelineDistribution(
  ownerId: string | undefined,
): Promise<PipelineColumn[]> {
  const where: Prisma.DealWhereInput = ownerId ? { ownerId } : {};

  // groupBy for counts + sums; raw query for weighted (value × probability/100).
  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (ownerId) conditions.push(Prisma.sql`ownerId = ${ownerId}`);
  const whereSql = Prisma.join(conditions, ' AND ');

  const [groups, weightedRows] = await Promise.all([
    prisma.deal.groupBy({
      by: ['stage'],
      where,
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.$queryRaw<Array<{ stage: DealStage; weighted: Prisma.Decimal | null }>>`
      SELECT stage, COALESCE(SUM(value * probability / 100), 0) AS weighted
      FROM \`Deal\`
      WHERE ${whereSql}
      GROUP BY stage
    `,
  ]);

  const byStageAgg = new Map(groups.map((g) => [g.stage, g]));
  const byStageWeighted = new Map(
    weightedRows.map((r) => [r.stage, r.weighted ? r.weighted.toString() : '0']),
  );

  return STAGES.map((stage) => {
    const g = byStageAgg.get(stage);
    return {
      stage,
      count: g?._count._all ?? 0,
      totalValue: decimalToString(g?._sum.value),
      weightedValue: byStageWeighted.get(stage) ?? '0',
    };
  });
}

/**
 * Leaderboard joined with User so the response is ready to render — no
 * second round-trip from the frontend to fetch names/avatars.
 */
async function computeTopSalesReps(limit: number): Promise<TopSalesRep[]> {
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      name: string;
      email: string;
      avatar: string | null;
      role: Role;
      totalRevenue: Prisma.Decimal | null;
      dealCount: bigint;
    }>
  >`
    SELECT u.id, u.name, u.email, u.avatar, u.role,
           SUM(d.value) AS totalRevenue,
           COUNT(d.id) AS dealCount
    FROM \`Deal\` d
    INNER JOIN \`User\` u ON u.id = d.ownerId
    WHERE d.stage = 'WON'
    GROUP BY u.id, u.name, u.email, u.avatar, u.role
    ORDER BY totalRevenue DESC
    LIMIT ${limit}
  `;

  return rows.map((r) => ({
    user: {
      id: r.id,
      name: r.name,
      email: r.email,
      avatar: r.avatar,
      role: r.role,
    },
    totalRevenue: r.totalRevenue ? r.totalRevenue.toString() : '0',
    dealCount: Number(r.dealCount),
  }));
}

async function computeUpcomingActivities(
  userId: string,
  days: number,
  limit: number,
): Promise<UpcomingActivityItem[]> {
  const now = new Date();
  const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

  const items = await prisma.activity.findMany({
    where: {
      userId,
      completed: false,
      dueDate: { gte: now, lte: until },
    },
    orderBy: { dueDate: 'asc' },
    take: limit,
    select: {
      id: true,
      type: true,
      description: true,
      dueDate: true,
      lead: { select: { id: true, name: true, company: true } },
      deal: { select: { id: true, title: true, stage: true } },
    },
  });

  return items.map((a) => ({
    id: a.id,
    type: a.type,
    description: a.description,
    dueDate: a.dueDate,
    lead: a.lead,
    deal: a.deal,
  }));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Resolve the effective `ownerId` filter:
 *   - SALES_REP: forced to self, regardless of what was requested.
 *   - ADMIN / MANAGER: optional filter from the query.
 */
function effectiveOwnerScope(
  requester: Requester,
  requested: string | undefined,
): string | undefined {
  if (requester.role === 'SALES_REP') return requester.id;
  return requested;
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1, 0, 0, 0, 0);
}

function monthKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function countForStage(
  groups: Array<{ stage: DealStage; _count: { _all: number } }>,
  stage: DealStage,
): number {
  return groups.find((g) => g.stage === stage)?._count._all ?? 0;
}

function decimalToString(value: Prisma.Decimal | null | undefined): string {
  return (value ?? new Prisma.Decimal(0)).toString();
}

function percentChange(
  current: Prisma.Decimal | null | undefined,
  previous: Prisma.Decimal | null | undefined,
): number | null {
  if (!previous || previous.isZero()) return null;
  const cur = current ?? new Prisma.Decimal(0);
  const change = cur.minus(previous).div(previous).times(100);
  return round1(change.toNumber());
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// Silence unused-import warnings if a future refactor drops a usage.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _LeadStatus = LeadStatus;
