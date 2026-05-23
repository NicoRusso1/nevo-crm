/**
 * Activities service.
 *
 * Activities are personal records (calls, emails, meetings, tasks) optionally
 * attached to a Lead and/or a Deal. The schema does not require either FK to
 * be set, so the service treats them as fully independent attachments.
 *
 * Ownership model mirrors Leads/Deals:
 *   - SALES_REP can mutate only activities they own (`userId === self`)
 *   - ADMIN / MANAGER can act on any activity
 *
 * `userId` is the activity OWNER (the person who logs / has the task), not
 * the requester — these can diverge when a manager logs an activity on a
 * sales rep's behalf.
 */
import { Prisma, type Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import type { PaginatedResult } from '../types/common';
import type {
  CreateActivityInput,
  ListActivitiesQuery,
  MarkCompletedInput,
  MyActivitiesQuery,
  TimelineQuery,
  UpcomingActivitiesQuery,
  UpdateActivityInput,
} from '../validators/activities.validator';

export interface Requester {
  id: string;
  role: Role;
}

// ── Selects / includes ──────────────────────────────────────────────────────

const userSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

const leadSelect = {
  id: true,
  name: true,
  company: true,
  email: true,
  status: true,
} satisfies Prisma.LeadSelect;

const dealSelect = {
  id: true,
  title: true,
  stage: true,
  value: true,
  clientId: true,
} satisfies Prisma.DealSelect;

const activityInclude = {
  user: { select: userSelect },
  lead: { select: leadSelect },
  deal: { select: dealSelect },
} satisfies Prisma.ActivityInclude;

export type ActivityWithRelations = Prisma.ActivityGetPayload<{
  include: typeof activityInclude;
}>;

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function create(
  input: CreateActivityInput,
  requester: Requester,
): Promise<ActivityWithRelations> {
  // Owner defaults to requester. SALES_REP can't log activities for others.
  const userId = input.userId ?? requester.id;
  if (!isPrivileged(requester.role) && userId !== requester.id) {
    throw ApiError.forbidden('You can only log activities under your own name');
  }
  if (input.userId) {
    await assertUserExists(userId);
  }

  if (input.leadId) await assertLeadExists(input.leadId);
  if (input.dealId) await assertDealExists(input.dealId);

  return prisma.activity.create({
    data: {
      type: input.type,
      description: input.description,
      dueDate: input.dueDate,
      completed: input.completed ?? false,
      userId,
      leadId: input.leadId ?? null,
      dealId: input.dealId ?? null,
    },
    include: activityInclude,
  });
}

export async function update(
  id: string,
  input: UpdateActivityInput,
  requester: Requester,
): Promise<ActivityWithRelations> {
  const existing = await prisma.activity.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Activity not found');

  assertCanMutate(existing.userId, requester);

  // Reassigning the owner is privileged.
  if (input.userId !== undefined && input.userId !== existing.userId) {
    if (!isPrivileged(requester.role)) {
      throw ApiError.forbidden('Only managers or admins can reassign activities');
    }
    await assertUserExists(input.userId);
  }

  // Validate any new lead/deal links. `null` means "detach" — no existence check.
  if (input.leadId) await assertLeadExists(input.leadId);
  if (input.dealId) await assertDealExists(input.dealId);

  return prisma.activity.update({
    where: { id },
    data: input,
    include: activityInclude,
  });
}

/**
 * Atomic completion toggle. Separate endpoint from `update` so checkbox UIs
 * can fire-and-forget without a full PATCH payload.
 */
export async function markCompleted(
  id: string,
  input: MarkCompletedInput,
  requester: Requester,
): Promise<ActivityWithRelations> {
  const existing = await prisma.activity.findUnique({
    where: { id },
    select: { id: true, userId: true, completed: true },
  });
  if (!existing) throw ApiError.notFound('Activity not found');

  assertCanMutate(existing.userId, requester);

  if (existing.completed === input.completed) {
    // No-op: spare the write but still echo back the row for client refresh.
    return prisma.activity.findUniqueOrThrow({
      where: { id },
      include: activityInclude,
    });
  }

  return prisma.activity.update({
    where: { id },
    data: { completed: input.completed },
    include: activityInclude,
  });
}

export async function remove(id: string, requester: Requester): Promise<void> {
  const existing = await prisma.activity.findUnique({
    where: { id },
    select: { id: true, userId: true },
  });
  if (!existing) throw ApiError.notFound('Activity not found');

  assertCanMutate(existing.userId, requester);
  await prisma.activity.delete({ where: { id } });
}

export async function findById(id: string): Promise<ActivityWithRelations> {
  const activity = await prisma.activity.findUnique({
    where: { id },
    include: activityInclude,
  });
  if (!activity) throw ApiError.notFound('Activity not found');
  return activity;
}

// ── List ────────────────────────────────────────────────────────────────────

export async function list(
  query: ListActivitiesQuery,
): Promise<PaginatedResult<ActivityWithRelations>> {
  const { page, pageSize, sortBy, sortOrder } = query;
  const skip = (page - 1) * pageSize;
  const where = buildListWhere(query);

  const [items, total] = await prisma.$transaction([
    prisma.activity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: activityInclude,
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

// ── Upcoming (due-soon + not-completed) ─────────────────────────────────────

export interface UpcomingResult {
  windowDays: number;
  from: string;
  to: string;
  items: ActivityWithRelations[];
}

export async function upcoming(
  query: UpcomingActivitiesQuery,
  requester: Requester,
): Promise<UpcomingResult> {
  // Default to the requester unless an explicit user was provided (admin
  // dashboards may want to peek at someone else's schedule).
  const userId = query.userId ?? requester.id;

  const from = new Date();
  const to = new Date(Date.now() + query.days * 24 * 60 * 60 * 1000);

  const items = await prisma.activity.findMany({
    where: {
      userId,
      completed: false,
      dueDate: { gte: from, lte: to },
      ...(query.type ? { type: query.type } : {}),
    },
    orderBy: { dueDate: 'asc' },
    include: activityInclude,
  });

  return {
    windowDays: query.days,
    from: from.toISOString(),
    to: to.toISOString(),
    items,
  };
}

// ── Timeline ────────────────────────────────────────────────────────────────

export async function timeline(
  query: TimelineQuery,
): Promise<PaginatedResult<ActivityWithRelations>> {
  const { page, pageSize } = query;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ActivityWhereInput = {
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.dealId ? { dealId: query.dealId } : {}),
    ...(query.clientId ? { deal: { clientId: query.clientId } } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...(query.from || query.to
      ? {
          createdAt: {
            ...(query.from ? { gte: query.from } : {}),
            ...(query.to ? { lte: query.to } : {}),
          },
        }
      : {}),
  };

  const [items, total] = await prisma.$transaction([
    prisma.activity.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      include: activityInclude,
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

// ── My feed (current user) ──────────────────────────────────────────────────

export async function myFeed(
  query: MyActivitiesQuery,
  requester: Requester,
): Promise<PaginatedResult<ActivityWithRelations>> {
  return list({
    ...query,
    userId: requester.id,
  });
}

// ── Where builder ───────────────────────────────────────────────────────────

function buildListWhere(query: ListActivitiesQuery): Prisma.ActivityWhereInput {
  return {
    ...(query.type ? { type: query.type } : {}),
    ...(query.completed !== undefined ? { completed: query.completed } : {}),
    ...(query.userId ? { userId: query.userId } : {}),
    ...(query.leadId ? { leadId: query.leadId } : {}),
    ...(query.dealId ? { dealId: query.dealId } : {}),
    ...(query.clientId ? { deal: { clientId: query.clientId } } : {}),
    ...(query.search ? { description: { contains: query.search } } : {}),
    ...(query.dueFrom || query.dueTo
      ? {
          dueDate: {
            ...(query.dueFrom ? { gte: query.dueFrom } : {}),
            ...(query.dueTo ? { lte: query.dueTo } : {}),
          },
        }
      : {}),
  };
}

// ── Guards ──────────────────────────────────────────────────────────────────

function isPrivileged(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

function assertCanMutate(ownerId: string, requester: Requester): void {
  if (isPrivileged(requester.role)) return;
  if (ownerId !== requester.id) {
    throw ApiError.forbidden('You can only act on activities you own');
  }
}

async function assertUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw ApiError.badRequest('User does not exist');
}

async function assertLeadExists(leadId: string): Promise<void> {
  const lead = await prisma.lead.findUnique({ where: { id: leadId }, select: { id: true } });
  if (!lead) throw ApiError.badRequest('Lead does not exist');
}

async function assertDealExists(dealId: string): Promise<void> {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
  if (!deal) throw ApiError.badRequest('Deal does not exist');
}
