/**
 * Clients service.
 *
 * Includes lightweight aggregate stats on the detail endpoint (deal counts /
 * pipeline value) because a "client details" view almost always needs them.
 * The stats are computed via Prisma `groupBy` rather than fetching the whole
 * deal list — O(stages) rows instead of O(deals).
 */
import { Prisma, type DealStage } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import type { PaginatedResult } from '../types/common';
import type {
  CreateClientInput,
  ListClientActivitiesQuery,
  ListClientDealsQuery,
  ListClientsQuery,
  UpdateClientInput,
} from '../validators/clients.validator';

// ── Selects / includes ──────────────────────────────────────────────────────

const ownerSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

const clientWithDealCount = {
  _count: { select: { deals: true } },
} satisfies Prisma.ClientInclude;

export type ClientWithDealCount = Prisma.ClientGetPayload<{
  include: typeof clientWithDealCount;
}>;

// ── List ────────────────────────────────────────────────────────────────────

export async function list(
  query: ListClientsQuery,
): Promise<PaginatedResult<ClientWithDealCount>> {
  const { page, pageSize, industry, search, sortBy, sortOrder } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ClientWhereInput = {
    ...(industry ? { industry } : {}),
    ...(search
      ? {
          OR: [
            { companyName: { contains: search } },
            { contactName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: clientWithDealCount,
    }),
    prisma.client.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ── Detail (with stats) ─────────────────────────────────────────────────────

export interface ClientStats {
  dealCount: number;
  totalDealValue: string; // Decimal serialized as string
  /** `{ STAGE: { count, totalValue } }` — only stages with at least one deal appear. */
  dealsByStage: Partial<Record<DealStage, { count: number; totalValue: string }>>;
  activityCount: number;
  pendingActivityCount: number;
}

export interface ClientDetail {
  client: ClientWithDealCount;
  stats: ClientStats;
}

export async function findById(id: string): Promise<ClientDetail> {
  const [client, dealAgg, activityAgg] = await Promise.all([
    prisma.client.findUnique({ where: { id }, include: clientWithDealCount }),
    prisma.deal.groupBy({
      by: ['stage'],
      where: { clientId: id },
      _count: { _all: true },
      _sum: { value: true },
    }),
    prisma.activity.groupBy({
      by: ['completed'],
      where: { deal: { clientId: id } },
      _count: { _all: true },
    }),
  ]);

  if (!client) throw ApiError.notFound('Client not found');

  const dealsByStage: ClientStats['dealsByStage'] = {};
  let totalDealValue = new Prisma.Decimal(0);

  for (const group of dealAgg) {
    const sum = group._sum.value ?? new Prisma.Decimal(0);
    dealsByStage[group.stage] = {
      count: group._count._all,
      totalValue: sum.toString(),
    };
    totalDealValue = totalDealValue.plus(sum);
  }

  const activityCount = activityAgg.reduce((acc, g) => acc + g._count._all, 0);
  const pendingActivityCount =
    activityAgg.find((g) => g.completed === false)?._count._all ?? 0;

  return {
    client,
    stats: {
      dealCount: client._count.deals,
      totalDealValue: totalDealValue.toString(),
      dealsByStage,
      activityCount,
      pendingActivityCount,
    },
  };
}

// ── Create / Update / Delete ────────────────────────────────────────────────

export async function create(input: CreateClientInput): Promise<ClientWithDealCount> {
  const existing = await prisma.client.findUnique({
    where: { email: input.email },
    select: { id: true },
  });
  if (existing) throw ApiError.conflict('A client with this email already exists');

  return prisma.client.create({
    data: input,
    include: clientWithDealCount,
  });
}

export async function update(
  id: string,
  input: UpdateClientInput,
): Promise<ClientWithDealCount> {
  const existing = await prisma.client.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw ApiError.notFound('Client not found');

  return prisma.client.update({
    where: { id },
    data: input,
    include: clientWithDealCount,
  });
}

/**
 * Hard delete. Cascades through the schema:
 *   Client → Deals → Activities (also cascades)
 *
 * Restricted at the route layer to ADMIN/MANAGER because the blast radius is
 * large — a SALES_REP shouldn't be able to wipe an account's history with one
 * call.
 */
export async function remove(id: string): Promise<void> {
  const existing = await prisma.client.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!existing) throw ApiError.notFound('Client not found');

  await prisma.client.delete({ where: { id } });
}

// ── Related listings ────────────────────────────────────────────────────────

export async function listDeals(clientId: string, query: ListClientDealsQuery) {
  await assertClientExists(clientId);

  const { page, pageSize, stage, sortBy, sortOrder } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.DealWhereInput = {
    clientId,
    ...(stage ? { stage } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        owner: { select: ownerSelect },
      },
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

export async function listActivities(
  clientId: string,
  query: ListClientActivitiesQuery,
) {
  await assertClientExists(clientId);

  const { page, pageSize, type, completed, sortBy, sortOrder } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ActivityWhereInput = {
    // Activities are tied to deals, not directly to clients — so we filter by
    // the deal's clientId.
    deal: { clientId },
    ...(type ? { type } : {}),
    ...(completed !== undefined ? { completed } : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.activity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        user: { select: ownerSelect },
        deal: { select: { id: true, title: true, stage: true } },
      },
    }),
    prisma.activity.count({ where }),
  ]);

  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

// ── Internals ───────────────────────────────────────────────────────────────

async function assertClientExists(id: string): Promise<void> {
  const exists = await prisma.client.findUnique({ where: { id }, select: { id: true } });
  if (!exists) throw ApiError.notFound('Client not found');
}
