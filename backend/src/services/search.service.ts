/**
 * Global search service.
 *
 * Powers the header/spotlight searchbar: takes a free-text query and runs
 * focused searches across the main resources in parallel. Each section
 * returns a small slice + the total count (so the UI can say "showing 5 of
 * 23") and a payload narrow enough for autocomplete-style rendering.
 *
 * Scoping (mirrors the rest of the app):
 *   - SALES_REP: leads → only assigned to self; deals → only owned; activities
 *     → only owned. The `users` section is silently dropped.
 *   - ADMIN / MANAGER: company-wide.
 */
import { Prisma, type Role } from '@prisma/client';

import { prisma } from '../lib/prisma';
import type { GlobalSearchQuery, SearchType } from '../validators/search.validator';

export interface Requester {
  id: string;
  role: Role;
}

interface Section<T> {
  count: number;
  items: T[];
}

// ── Item shapes (lean by design — only what an autocomplete row needs) ─────

interface UserHit {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: Role;
}

interface LeadHit {
  id: string;
  name: string;
  company: string | null;
  email: string;
  status: string;
}

interface ClientHit {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  industry: string | null;
}

interface DealHit {
  id: string;
  title: string;
  value: string;
  stage: string;
  client: { id: string; companyName: string };
}

interface ActivityHit {
  id: string;
  type: string;
  description: string;
  completed: boolean;
  dueDate: Date | null;
}

export interface GlobalSearchResult {
  query: string;
  total: number;
  results: Partial<{
    users: Section<UserHit>;
    leads: Section<LeadHit>;
    clients: Section<ClientHit>;
    deals: Section<DealHit>;
    activities: Section<ActivityHit>;
  }>;
}

// ── Entrypoint ──────────────────────────────────────────────────────────────

const DEFAULT_TYPES: readonly SearchType[] = ['leads', 'clients', 'deals', 'activities', 'users'];

export async function globalSearch(
  query: GlobalSearchQuery,
  requester: Requester,
): Promise<GlobalSearchResult> {
  const requested = query.types ?? DEFAULT_TYPES;
  const types = applyRoleFilter(requested, requester.role);

  // Fire each section's queries in parallel. Each returns `{ count, items }`.
  const tasks = types.map((type) => runSection(type, query.q, query.limit, requester));
  const settled = await Promise.all(tasks);

  const results: GlobalSearchResult['results'] = {};
  let total = 0;
  for (let i = 0; i < types.length; i++) {
    const type = types[i]!;
    const section = settled[i]!;
    // Typed assignment — TS narrows per type via the `type` key.
    (results as Record<SearchType, unknown>)[type] = section;
    total += section.count;
  }

  return { query: query.q, total, results };
}

// ── Per-type queries ────────────────────────────────────────────────────────

function runSection(
  type: SearchType,
  q: string,
  limit: number,
  requester: Requester,
): Promise<Section<unknown>> {
  switch (type) {
    case 'users':
      return searchUsers(q, limit);
    case 'leads':
      return searchLeads(q, limit, requester);
    case 'clients':
      return searchClients(q, limit);
    case 'deals':
      return searchDeals(q, limit, requester);
    case 'activities':
      return searchActivities(q, limit, requester);
  }
}

async function searchUsers(q: string, limit: number): Promise<Section<UserHit>> {
  const where: Prisma.UserWhereInput = {
    OR: [{ name: { contains: q } }, { email: { contains: q } }],
  };
  const [items, count] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      take: limit,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, email: true, avatar: true, role: true },
    }),
    prisma.user.count({ where }),
  ]);
  return { count, items };
}

async function searchLeads(
  q: string,
  limit: number,
  requester: Requester,
): Promise<Section<LeadHit>> {
  const where: Prisma.LeadWhereInput = {
    ...(requester.role === 'SALES_REP' ? { assignedToId: requester.id } : {}),
    OR: [
      { name: { contains: q } },
      { email: { contains: q } },
      { company: { contains: q } },
      { phone: { contains: q } },
    ],
  };
  const [items, count] = await prisma.$transaction([
    prisma.lead.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        company: true,
        email: true,
        status: true,
      },
    }),
    prisma.lead.count({ where }),
  ]);
  return { count, items };
}

async function searchClients(q: string, limit: number): Promise<Section<ClientHit>> {
  const where: Prisma.ClientWhereInput = {
    OR: [
      { companyName: { contains: q } },
      { contactName: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ],
  };
  const [items, count] = await prisma.$transaction([
    prisma.client.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        companyName: true,
        contactName: true,
        email: true,
        industry: true,
      },
    }),
    prisma.client.count({ where }),
  ]);
  return { count, items };
}

async function searchDeals(
  q: string,
  limit: number,
  requester: Requester,
): Promise<Section<DealHit>> {
  const where: Prisma.DealWhereInput = {
    ...(requester.role === 'SALES_REP' ? { ownerId: requester.id } : {}),
    OR: [
      { title: { contains: q } },
      { client: { companyName: { contains: q } } },
      { client: { contactName: { contains: q } } },
    ],
  };
  const [rows, count] = await prisma.$transaction([
    prisma.deal.findMany({
      where,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        value: true,
        stage: true,
        client: { select: { id: true, companyName: true } },
      },
    }),
    prisma.deal.count({ where }),
  ]);

  const items: DealHit[] = rows.map((d) => ({
    id: d.id,
    title: d.title,
    value: d.value.toString(),
    stage: d.stage,
    client: d.client,
  }));

  return { count, items };
}

async function searchActivities(
  q: string,
  limit: number,
  requester: Requester,
): Promise<Section<ActivityHit>> {
  const where: Prisma.ActivityWhereInput = {
    ...(requester.role === 'SALES_REP' ? { userId: requester.id } : {}),
    description: { contains: q },
  };
  const [items, count] = await prisma.$transaction([
    prisma.activity.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        type: true,
        description: true,
        completed: true,
        dueDate: true,
      },
    }),
    prisma.activity.count({ where }),
  ]);
  return { count, items };
}

// ── Role gating ─────────────────────────────────────────────────────────────

/**
 * Drop `users` for SALES_REP — they can't browse the directory anywhere else
 * in the app, so leaking matches via search would be inconsistent.
 */
function applyRoleFilter(requested: readonly SearchType[], role: Role): SearchType[] {
  if (role === 'SALES_REP') {
    return requested.filter((t) => t !== 'users');
  }
  return [...requested];
}
