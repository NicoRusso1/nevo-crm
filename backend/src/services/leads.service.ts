/**
 * Leads service — business logic for the top-of-funnel pipeline.
 *
 * Responsibilities:
 *   - CRUD with ownership-aware authorization
 *   - Listing with filters, search, sorting and pagination
 *   - Assigning leads to users
 *   - Converting a lead into a Client (optionally creating a Deal in the same
 *     transaction)
 *
 * Routes decide WHO can call each method (via `authorize`); the service
 * decides WHAT additional rules apply once the request reaches the domain
 * layer (e.g. "a SALES_REP can only edit leads assigned to themselves").
 */
import { Prisma, type Client, type Deal, type Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import { ApiError } from '../utils/ApiError';
import { paginate } from '../utils/pagination';
import { notifyUser } from './notifications.service';
import type { PaginatedResult } from '../types/common';
import type {
  AssignLeadInput,
  ConvertLeadInput,
  CreateLeadInput,
  ListLeadsQuery,
  UpdateLeadInput,
} from '../validators/leads.validator';

/** Caller identity passed from the controller for ownership-aware checks. */
export interface Requester {
  id: string;
  role: Role;
}

/** Subset of fields returned for the lead's assignee — never includes password. */
const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} satisfies Prisma.UserSelect;

/** Standard `include` used everywhere we return a lead. */
const leadInclude = {
  assignedTo: { select: assigneeSelect },
} satisfies Prisma.LeadInclude;

export type LeadWithAssignee = Prisma.LeadGetPayload<{ include: typeof leadInclude }>;

export interface ConvertLeadResult {
  lead: LeadWithAssignee;
  client: Client;
  deal: Deal | null;
}

// ── CRUD ────────────────────────────────────────────────────────────────────

export async function create(
  input: CreateLeadInput,
  requester: Requester,
): Promise<LeadWithAssignee> {
  // SALES_REP can only create leads assigned to themselves. Privileged roles
  // may either omit `assignedToId` or assign to any user.
  let assignedToId: string | null | undefined = input.assignedToId;

  if (!isPrivileged(requester.role)) {
    if (assignedToId && assignedToId !== requester.id) {
      throw ApiError.forbidden('You can only create leads assigned to yourself');
    }
    assignedToId = requester.id;
  }

  if (assignedToId) {
    await assertUserExists(assignedToId);
  }

  const lead = await prisma.lead.create({
    data: {
      name: input.name,
      company: input.company,
      email: input.email,
      phone: input.phone,
      source: input.source,
      status: input.status,
      value: input.value,
      notes: input.notes,
      assignedToId: assignedToId ?? null,
    },
    include: leadInclude,
  });

  // Notify the assignee if it's someone other than the requester.
  if (lead.assignedToId && lead.assignedToId !== requester.id) {
    await notifyUser(lead.assignedToId, {
      title: 'New lead assigned',
      message: `You've been assigned the lead "${lead.name}"${lead.company ? ` from ${lead.company}` : ''}.`,
    });
  }

  return lead;
}

export async function update(
  id: string,
  input: UpdateLeadInput,
  requester: Requester,
): Promise<LeadWithAssignee> {
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Lead not found');

  assertCanMutate(existing.assignedToId, requester);

  // Re-validate any new assignee. SALES_REP can never reassign through update
  // — assign() is the dedicated, privileged endpoint.
  if (input.assignedToId !== undefined) {
    if (!isPrivileged(requester.role)) {
      throw ApiError.forbidden('Only managers or admins can reassign leads');
    }
    if (input.assignedToId !== null) {
      await assertUserExists(input.assignedToId);
    }
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: input,
    include: leadInclude,
  });

  // Reassignment notification: fire when assignedToId actually changed to a
  // new, non-self user.
  if (
    input.assignedToId !== undefined &&
    input.assignedToId !== existing.assignedToId &&
    input.assignedToId !== null &&
    input.assignedToId !== requester.id
  ) {
    await notifyUser(input.assignedToId, {
      title: 'Lead reassigned to you',
      message: `The lead "${updated.name}" has been reassigned to you.`,
    });
  }

  return updated;
}

export async function remove(id: string, requester: Requester): Promise<void> {
  const existing = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, assignedToId: true },
  });
  if (!existing) throw ApiError.notFound('Lead not found');

  assertCanMutate(existing.assignedToId, requester);

  await prisma.lead.delete({ where: { id } });
}

export async function findById(id: string): Promise<LeadWithAssignee> {
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: leadInclude,
  });
  if (!lead) throw ApiError.notFound('Lead not found');
  return lead;
}

// ── List / search / filter / paginate ───────────────────────────────────────

export async function list(
  query: ListLeadsQuery,
): Promise<PaginatedResult<LeadWithAssignee>> {
  const { page, pageSize, status, source, assignedToId, search, sortBy, sortOrder } = query;

  const where: Prisma.LeadWhereInput = {
    ...(status ? { status } : {}),
    ...(source ? { source } : {}),
    ...(assignedToId ? { assignedToId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search } },
            { email: { contains: search } },
            { company: { contains: search } },
            { phone: { contains: search } },
          ],
        }
      : {}),
  };

  return paginate({
    page,
    pageSize,
    findMany: (skip, take) =>
      prisma.lead.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: leadInclude,
      }),
    count: () => prisma.lead.count({ where }),
  });
}

// ── Assignment (privileged only — also gated at the route) ──────────────────

export async function assign(
  id: string,
  input: AssignLeadInput,
  requester?: Requester,
): Promise<LeadWithAssignee> {
  const existing = await prisma.lead.findUnique({
    where: { id },
    select: { id: true, assignedToId: true },
  });
  if (!existing) throw ApiError.notFound('Lead not found');

  if (input.userId !== null) {
    await assertUserExists(input.userId);
  }

  const updated = await prisma.lead.update({
    where: { id },
    data: { assignedToId: input.userId },
    include: leadInclude,
  });

  // Notify the new assignee on an actual change to someone other than the
  // requester. `requester` is optional so existing call sites don't break.
  if (
    input.userId &&
    input.userId !== existing.assignedToId &&
    input.userId !== requester?.id
  ) {
    await notifyUser(input.userId, {
      title: 'Lead assigned to you',
      message: `You've been assigned the lead "${updated.name}".`,
    });
  }

  return updated;
}

// ── Convert lead → Client (+ optional Deal) ─────────────────────────────────

/**
 * Atomically converts a lead into a Client. Lead status becomes WON. If
 * `createDeal` is set, a Deal is created in the same transaction owned by
 * the lead's assignee (or, if none, the requester).
 *
 * Fails when:
 *   - The lead does not exist (404)
 *   - The lead is already WON or LOST (409 — already converted / discarded)
 *   - The requester is a SALES_REP and isn't the lead's assignee (403)
 *   - No companyName can be derived (lead.company empty AND not overridden)
 *   - A Client with the same email already exists (409)
 */
export async function convertToClient(
  id: string,
  input: ConvertLeadInput,
  requester: Requester,
): Promise<ConvertLeadResult> {
  const result = await prisma.$transaction(async (tx) => {
    const lead = await tx.lead.findUnique({ where: { id } });
    if (!lead) throw ApiError.notFound('Lead not found');

    assertCanMutate(lead.assignedToId, requester);

    if (lead.status === 'WON') {
      throw ApiError.conflict('Lead has already been converted');
    }
    if (lead.status === 'LOST') {
      throw ApiError.conflict('Cannot convert a lost lead');
    }

    const companyName = input.companyName ?? lead.company;
    if (!companyName) {
      throw ApiError.badRequest(
        'companyName is required when the lead has no company on file',
      );
    }

    const dupClient = await tx.client.findUnique({
      where: { email: lead.email },
      select: { id: true },
    });
    if (dupClient) {
      throw ApiError.conflict('A client with this email already exists');
    }

    const client = await tx.client.create({
      data: {
        companyName,
        contactName: input.contactName ?? lead.name,
        email: lead.email,
        phone: lead.phone,
        industry: input.industry,
      },
    });

    let deal: Deal | null = null;
    if (input.createDeal && input.deal) {
      // Deal ownership: keep the lead's assignee if present, otherwise fall
      // back to the requester (admins/managers acting on unassigned leads).
      const ownerId = lead.assignedToId ?? requester.id;

      deal = await tx.deal.create({
        data: {
          title: input.deal.title,
          value: input.deal.value,
          probability: input.deal.probability ?? 0,
          expectedCloseDate: input.deal.expectedCloseDate,
          stage: input.deal.stage ?? 'LEAD',
          clientId: client.id,
          ownerId,
        },
      });
    }

    const updatedLead = await tx.lead.update({
      where: { id },
      data: { status: 'WON' },
      include: leadInclude,
    });

    return { lead: updatedLead, client, deal };
  });

  // Side-effect AFTER the transaction commits — so a notification failure
  // never rolls back the conversion. Conversion is celebratory: notify the
  // lead's assignee even if it's the requester.
  if (result.lead.assignedToId) {
    await notifyUser(result.lead.assignedToId, {
      title: 'Lead converted to client 🎉',
      message: `"${result.lead.name}" was converted into the client "${result.client.companyName}".`,
    });
  }

  return result;
}

// ── Internals ───────────────────────────────────────────────────────────────

function isPrivileged(role: Role): boolean {
  return role === 'ADMIN' || role === 'MANAGER';
}

/**
 * SALES_REP may only mutate leads assigned to themselves. ADMIN/MANAGER pass
 * through. Unassigned leads are off-limits to SALES_REP.
 */
function assertCanMutate(assignedToId: string | null, requester: Requester): void {
  if (isPrivileged(requester.role)) return;
  if (assignedToId !== requester.id) {
    throw ApiError.forbidden('You can only act on leads assigned to you');
  }
}

async function assertUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw ApiError.badRequest('Assigned user does not exist');
}
