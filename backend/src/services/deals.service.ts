/**
 * Deals service.
 *
 * Highlights:
 *   - Ownership-aware mutations (same pattern as leads.service)
 *   - Dedicated atomic endpoints for kanban drag (stage) and slider
 *     (probability) so the frontend can patch the minimum amount of state
 *   - Auto-adjusted probability on terminal stages: WON → 100, LOST → 0
 *   - Sensible default probability per stage on creation
 *   - Kanban endpoint returns deals grouped by stage with column-level
 *     aggregates so the board can render header totals in one round-trip
 *   - Stats endpoint computes a weighted pipeline (Σ value × probability/100)
 *     using a single raw aggregate query for accuracy
 */
import { Prisma, type DealStage, type Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { notifyUser } from './notifications.service';
import type { PaginatedResult } from '../types/common';
import type {
  CreateDealInput,
  DealStatsQuery,
  KanbanQuery,
  ListDealsQuery,
  UpdateDealInput,
  UpdateDealProbabilityInput,
  UpdateDealStageInput,
} from '../validators/deals.validator';

export interface Requester {
  id: string;
  role: Role;
}

// ── Selects / includes ──────────────────────────────────────────────────────

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

const clientSelect = {
  id: true,
  companyName: true,
  contactName: true,
  email: true,
  industry: true,
} satisfies Prisma.ClientSelect;

const dealInclude = {
  owner: { select: ownerSelect },
  client: { select: clientSelect },
} satisfies Prisma.DealInclude;

const dealDetailInclude = {
  ...dealInclude,
  _count: { select: { activities: true } },
} satisfies Prisma.DealInclude;

export type DealWithRelations = Prisma.DealGetPayload<{ include: typeof dealInclude }>;
export type DealDetail = Prisma.DealGetPayload<{ include: typeof dealDetailInclude }>;

// Stages in their natural pipeline order — used to materialize empty columns.
const STAGES: readonly DealStage[] = [
  'LEAD',
  'QUALIFIED',
  'PROPOSAL',
  'NEGOTIATION',
  'WON',
  'LOST',
] as const;

// ── Probability defaults ────────────────────────────────────────────────────

/**
 * Used when a deal is created (or moves stage) without an explicit probability.
 * Tunable to the team's actual conversion rates — these are reasonable seeds.
 */
function defaultProbabilityFor(stage: DealStage): number {
  switch (stage) {
    case 'LEAD':
      return 10;
    case 'QUALIFIED':
      return 25;
    case 'PROPOSAL':
      return 50;
    case 'NEGOTIATION':
      return 75;
    case 'WON':
      return 100;
    case 'LOST':
      return 0;
  }
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function create(
  input: CreateDealInput,
  requester: Requester,
): Promise<DealWithRelations> {
  await assertClientExists(input.clientId);

  // Owner defaults to requester. SALES_REP cannot create deals owned by anyone
  // else; ADMIN/MANAGER may set any owner explicitly.
  let ownerId = input.ownerId ?? requester.id;
  if (!isPrivileged(requester.role) && ownerId !== requester.id) {
    throw ApiError.forbidden('You can only create deals you own');
  }
  if (input.ownerId) {
    await assertUserExists(ownerId);
  }

  const stage = input.stage ?? 'LEAD';
  const probability = input.probability ?? defaultProbabilityFor(stage);

  const deal = await prisma.deal.create({
    data: {
      title: input.title,
      value: input.value,
      probability,
      expectedCloseDate: input.expectedCloseDate,
      stage,
      clientId: input.clientId,
      ownerId,
    },
    include: dealInclude,
  });

  // Notify the new owner only when it's someone other than the creator.
  if (deal.ownerId !== requester.id) {
    await notifyUser(deal.ownerId, {
      title: 'New deal assigned',
      message: `You're now the owner of "${deal.title}".`,
    });
  }

  return deal;
}

export async function update(
  id: string,
  input: UpdateDealInput,
  requester: Requester,
): Promise<DealWithRelations> {
  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Deal not found');

  assertCanMutate(existing.ownerId, requester);

  // Reassigning ownership is privileged. Reassigning client requires the new
  // client to exist.
  if (input.ownerId !== undefined && input.ownerId !== existing.ownerId) {
    if (!isPrivileged(requester.role)) {
      throw ApiError.forbidden('Only managers or admins can reassign deals');
    }
    await assertUserExists(input.ownerId);
  }
  if (input.clientId !== undefined && input.clientId !== existing.clientId) {
    await assertClientExists(input.clientId);
  }

  // Auto-adjust probability when transitioning into a terminal stage and the
  // caller didn't pin a value of their own.
  const data: Prisma.DealUpdateInput = { ...input } as Prisma.DealUpdateInput;
  if (input.stage && input.probability === undefined) {
    if (input.stage === 'WON') data.probability = 100;
    if (input.stage === 'LOST') data.probability = 0;
  }

  const updated = await prisma.deal.update({
    where: { id },
    data,
    include: dealInclude,
  });

  // Reassignment → notify new owner (if not self).
  if (
    input.ownerId &&
    input.ownerId !== existing.ownerId &&
    input.ownerId !== requester.id
  ) {
    await notifyUser(input.ownerId, {
      title: 'Deal reassigned to you',
      message: `The deal "${updated.title}" has been reassigned to you.`,
    });
  }

  // Terminal stage transitions via the generic PATCH endpoint also fire
  // notifications (mirrors what updateStage does).
  if (input.stage && input.stage !== existing.stage) {
    await notifyOnStageTransition(updated, existing.stage, input.stage, requester);
  }

  return updated;
}

export async function remove(id: string, requester: Requester): Promise<void> {
  const existing = await prisma.deal.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  if (!existing) throw ApiError.notFound('Deal not found');

  assertCanMutate(existing.ownerId, requester);
  await prisma.deal.delete({ where: { id } });
}

export async function findById(id: string): Promise<DealDetail> {
  const deal = await prisma.deal.findUnique({
    where: { id },
    include: dealDetailInclude,
  });
  if (!deal) throw ApiError.notFound('Deal not found');
  return deal;
}

// ── Atomic kanban operations ────────────────────────────────────────────────

/**
 * Drag-and-drop stage change.
 *
 * Idempotent: dropping a card on its current column is a no-op.
 * Terminal stages auto-adjust probability (WON → 100, LOST → 0). For non-
 * terminal moves we leave the probability untouched so the user's manual
 * pinning is respected.
 */
export async function updateStage(
  id: string,
  input: UpdateDealStageInput,
  requester: Requester,
): Promise<DealWithRelations> {
  const existing = await prisma.deal.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Deal not found');

  assertCanMutate(existing.ownerId, requester);

  if (existing.stage === input.stage) {
    // Return current state without writing — drag onto same column.
    return prisma.deal.findUniqueOrThrow({
      where: { id },
      include: dealInclude,
    });
  }

  const data: Prisma.DealUpdateInput = { stage: input.stage };
  if (input.stage === 'WON') data.probability = 100;
  if (input.stage === 'LOST') data.probability = 0;

  const updated = await prisma.deal.update({
    where: { id },
    data,
    include: dealInclude,
  });

  await notifyOnStageTransition(updated, existing.stage, input.stage, requester);

  return updated;
}

export async function updateProbability(
  id: string,
  input: UpdateDealProbabilityInput,
  requester: Requester,
): Promise<DealWithRelations> {
  const existing = await prisma.deal.findUnique({
    where: { id },
    select: { id: true, ownerId: true },
  });
  if (!existing) throw ApiError.notFound('Deal not found');

  assertCanMutate(existing.ownerId, requester);

  return prisma.deal.update({
    where: { id },
    data: { probability: input.probability },
    include: dealInclude,
  });
}

// ── List ────────────────────────────────────────────────────────────────────

export async function list(query: ListDealsQuery): Promise<PaginatedResult<DealWithRelations>> {
  const { page, pageSize, sortBy, sortOrder } = query;
  const skip = (page - 1) * pageSize;
  const where = buildListWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: dealInclude,
    }),
    prisma.deal.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ── Kanban view ─────────────────────────────────────────────────────────────

export interface KanbanColumn {
  stage: DealStage;
  count: number;
  totalValue: string;
  deals: DealWithRelations[];
}

export interface KanbanBoard {
  columns: KanbanColumn[];
}

/**
 * Board view optimised for the kanban UI.
 *
 * Layout:
 *   - One column per DealStage (always all six, even empty ones)
 *   - Each column holds at most `limitPerColumn` deals, newest first
 *   - Each column carries `count` and `totalValue` aggregates for the header
 *
 * Implementation: 6 parallel findMany (bounded by limit) + one groupBy for
 * the totals. Cheaper than fetching everything client-side.
 */
export async function getKanban(query: KanbanQuery): Promise<KanbanBoard> {
  const { limitPerColumn } = query;
  const where = buildKanbanWhere(query);

  const [perStageDeals, aggregates] = await Promise.all([
    Promise.all(
      STAGES.map((stage) =>
        prisma.deal.findMany({
          where: { ...where, stage },
          orderBy: { updatedAt: 'desc' },
          take: limitPerColumn,
          include: dealInclude,
        }),
      ),
    ),
    prisma.deal.groupBy({
      by: ['stage'],
      where,
      _count: { _all: true },
      _sum: { value: true },
    }),
  ]);

  const aggByStage = new Map(aggregates.map((a) => [a.stage, a]));

  const columns: KanbanColumn[] = STAGES.map((stage, idx) => {
    const agg = aggByStage.get(stage);
    return {
      stage,
      count: agg?._count._all ?? 0,
      totalValue: (agg?._sum.value ?? new Prisma.Decimal(0)).toString(),
      deals: perStageDeals[idx] ?? [],
    };
  });

  return { columns };
}

// ── Stats / revenue ─────────────────────────────────────────────────────────

export interface DealStats {
  dealCount: number;
  totalValue: string;
  weightedValue: string; // Σ value × probability/100 — forecast pipeline
  avgValue: string | null;
  avgProbability: number | null;
  byStage: Array<{
    stage: DealStage;
    count: number;
    totalValue: string;
    weightedValue: string;
  }>;
}

export async function getStats(query: DealStatsQuery): Promise<DealStats> {
  const where = buildStatsWhere(query);
  const sqlWhere = buildStatsSqlWhere(query);

  const [aggregate, byStageGroups, weightedRows, weightedByStageRows] = await Promise.all([
    prisma.deal.aggregate({
      where,
      _count: { _all: true },
      _sum: { value: true },
      _avg: { value: true, probability: true },
    }),
    prisma.deal.groupBy({
      by: ['stage'],
      where,
      _count: { _all: true },
      _sum: { value: true },
    }),
    // Raw aggregate — Prisma's groupBy can't express SUM(value * probability).
    // Parameterised via Prisma.sql to avoid injection.
    prisma.$queryRaw<{ weighted: Prisma.Decimal | null }[]>`
      SELECT COALESCE(SUM(value * probability / 100), 0) AS weighted
      FROM \`Deal\`
      WHERE ${sqlWhere}
    `,
    prisma.$queryRaw<{ stage: DealStage; weighted: Prisma.Decimal | null }[]>`
      SELECT stage, COALESCE(SUM(value * probability / 100), 0) AS weighted
      FROM \`Deal\`
      WHERE ${sqlWhere}
      GROUP BY stage
    `,
  ]);

  const weightedTotal = weightedRows[0]?.weighted?.toString() ?? '0';
  const weightedByStage = new Map(
    weightedByStageRows.map((r) => [r.stage, r.weighted?.toString() ?? '0']),
  );

  const byStage = byStageGroups.map((g) => ({
    stage: g.stage,
    count: g._count._all,
    totalValue: (g._sum.value ?? new Prisma.Decimal(0)).toString(),
    weightedValue: weightedByStage.get(g.stage) ?? '0',
  }));

  return {
    dealCount: aggregate._count._all,
    totalValue: (aggregate._sum.value ?? new Prisma.Decimal(0)).toString(),
    weightedValue: weightedTotal,
    avgValue: aggregate._avg.value?.toString() ?? null,
    avgProbability: aggregate._avg.probability ?? null,
    byStage,
  };
}

// ── where builders ──────────────────────────────────────────────────────────

function buildListWhere(query: ListDealsQuery): Prisma.DealWhereInput {
  const { stage, clientId, ownerId, search, minValue, maxValue, closingFrom, closingTo } = query;

  return {
    ...(stage ? { stage } : {}),
    ...(clientId ? { clientId } : {}),
    ...(ownerId ? { ownerId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { client: { companyName: { contains: search } } },
            { client: { contactName: { contains: search } } },
          ],
        }
      : {}),
    ...(minValue !== undefined || maxValue !== undefined
      ? {
          value: {
            ...(minValue !== undefined ? { gte: minValue } : {}),
            ...(maxValue !== undefined ? { lte: maxValue } : {}),
          },
        }
      : {}),
    ...(closingFrom || closingTo
      ? {
          expectedCloseDate: {
            ...(closingFrom ? { gte: closingFrom } : {}),
            ...(closingTo ? { lte: closingTo } : {}),
          },
        }
      : {}),
  };
}

function buildKanbanWhere(query: KanbanQuery): Prisma.DealWhereInput {
  const { ownerId, clientId, search } = query;
  return {
    ...(ownerId ? { ownerId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search } },
            { client: { companyName: { contains: search } } },
          ],
        }
      : {}),
  };
}

function buildStatsWhere(query: DealStatsQuery): Prisma.DealWhereInput {
  const { ownerId, clientId, from, to } = query;
  return {
    ...(ownerId ? { ownerId } : {}),
    ...(clientId ? { clientId } : {}),
    ...(from || to
      ? {
          createdAt: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
  };
}

/**
 * Build a parameterised SQL WHERE for the raw aggregations. Using `Prisma.sql`
 * + `Prisma.join` keeps the values fully parameterised — no string concat.
 */
function buildStatsSqlWhere(query: DealStatsQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`1=1`];
  if (query.ownerId) conditions.push(Prisma.sql`ownerId = ${query.ownerId}`);
  if (query.clientId) conditions.push(Prisma.sql`clientId = ${query.clientId}`);
  if (query.from) conditions.push(Prisma.sql`createdAt >= ${query.from}`);
  if (query.to) conditions.push(Prisma.sql`createdAt <= ${query.to}`);
  return Prisma.join(conditions, ' AND ');
}

// ── Notifications ──────────────────────────────────────────────────────────

/**
 * Fire celebratory / warning notifications on terminal stage transitions.
 *   - WON  → always notify the owner (the win deserves visibility even when
 *            they closed it themselves).
 *   - LOST → notify only when someone other than the owner moved it (don't
 *            rub salt in your own wound).
 *
 * Non-terminal moves don't trigger anything — too noisy.
 */
async function notifyOnStageTransition(
  deal: DealWithRelations,
  fromStage: DealStage,
  toStage: DealStage,
  requester: Requester,
): Promise<void> {
  if (fromStage === toStage) return;

  if (toStage === 'WON') {
    const formatted = Number(deal.value.toString()).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    await notifyUser(deal.ownerId, {
      title: 'Deal closed-won 🎉',
      message: `Congrats! "${deal.title}" closed for $${formatted}.`,
    });
    return;
  }

  if (toStage === 'LOST' && requester.id !== deal.ownerId) {
    await notifyUser(deal.ownerId, {
      title: 'Deal marked as lost',
      message: `"${deal.title}" was moved to LOST.`,
    });
  }
}

// ── Guards ──────────────────────────────────────────────────────────────────

function isPrivileged(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

function assertCanMutate(ownerId: string, requester: Requester): void {
  if (isPrivileged(requester.role)) return;
  if (ownerId !== requester.id) {
    throw ApiError.forbidden('You can only act on deals you own');
  }
}

async function assertUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw ApiError.badRequest('Owner user does not exist');
}

async function assertClientExists(clientId: string): Promise<void> {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true },
  });
  if (!client) throw ApiError.badRequest('Client does not exist');
}
