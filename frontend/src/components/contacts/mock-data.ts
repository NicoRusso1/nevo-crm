import type { DealStage } from '@/components/sales/mock-data';

// ── Types ──────────────────────────────────────────────────────────────────

export type ContactStatus = 'lead' | 'active' | 'customer';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company: string;
  position?: string;
  status: ContactStatus;
  /** Sales rep name + email (the deal owner from the rep's perspective). */
  owner: { name: string; email: string };
  createdAt: Date;
  avatar?: string | null;
}

export type ContactDealStatus = 'open' | 'won' | 'lost';

export interface ContactDeal {
  id: string;
  title: string;
  value: number;
  status: ContactDealStatus;
  stage: DealStage;
  /** Win probability 0-100. */
  probability: number;
  createdAt: Date;
}

export type ContactActivityKind = 'call' | 'email' | 'meeting' | 'note';

export interface ContactActivity {
  id: string;
  kind: ContactActivityKind;
  title: string;
  body?: string;
  author: string;
  at: Date;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);
const monthsAgo = (m: number) => new Date(Date.now() - m * 30 * 86_400_000);

// ── Contacts ───────────────────────────────────────────────────────────────

export const CONTACTS: readonly Contact[] = [
  {
    id: 'c-001',
    firstName: 'Pablo',
    lastName: 'Diaz',
    email: 'pablo.diaz@sentinel.com',
    phone: '+54 9 11 4521-8377',
    company: 'Sentinel Capital',
    position: 'VP of Procurement',
    status: 'active',
    owner: { name: 'Maria Lopez', email: 'maria@nevo.dev' },
    createdAt: monthsAgo(7),
  },
  {
    id: 'c-002',
    firstName: 'Florencia',
    lastName: 'Gomez',
    email: 'florencia.gomez@aurora.com',
    phone: '+54 9 11 6388-2210',
    company: 'Aurora Dynamics',
    position: 'Head of Operations',
    status: 'lead',
    owner: { name: 'Diego Fernandez', email: 'diego@nevo.dev' },
    createdAt: monthsAgo(2),
  },
  {
    id: 'c-003',
    firstName: 'Santiago',
    lastName: 'Cruz',
    email: 'santiago@atlas.com',
    phone: '+54 9 11 5044-7188',
    company: 'Atlas International',
    position: 'CFO',
    status: 'customer',
    owner: { name: 'Maria Lopez', email: 'maria@nevo.dev' },
    createdAt: monthsAgo(14),
  },
];

export function findContact(id: string): Contact | undefined {
  return CONTACTS.find((c) => c.id === id);
}

// ── Per-contact deals & timelines ──────────────────────────────────────────

export const CONTACT_DEALS: Record<string, readonly ContactDeal[]> = {
  'c-001': [
    {
      id: 'cd-001',
      title: 'Sentinel Q4 Renewal',
      value: 134_000,
      status: 'open',
      stage: 'proposal',
      probability: 70,
      createdAt: daysAgo(18),
    },
    {
      id: 'cd-002',
      title: 'Sentinel Pilot Program',
      value: 28_000,
      status: 'won',
      stage: 'won',
      probability: 100,
      createdAt: monthsAgo(5),
    },
    {
      id: 'cd-003',
      title: 'Sentinel Add-on Modules',
      value: 45_000,
      status: 'open',
      stage: 'qualified',
      probability: 50,
      createdAt: daysAgo(45),
    },
    {
      id: 'cd-004',
      title: 'Sentinel Q1 Expansion (FY24)',
      value: 25_000,
      status: 'lost',
      stage: 'lost',
      probability: 0,
      createdAt: monthsAgo(6),
    },
  ],
  'c-002': [
    {
      id: 'cd-201',
      title: 'Aurora Discovery Engagement',
      value: 58_700,
      status: 'open',
      stage: 'qualified',
      probability: 45,
      createdAt: daysAgo(12),
    },
  ],
  'c-003': [
    {
      id: 'cd-301',
      title: 'Atlas Annual License',
      value: 320_000,
      status: 'won',
      stage: 'won',
      probability: 100,
      createdAt: monthsAgo(13),
    },
    {
      id: 'cd-302',
      title: 'Atlas Renewal (FY25)',
      value: 348_000,
      status: 'open',
      stage: 'negotiation' as DealStage,
      probability: 80,
      createdAt: daysAgo(8),
    },
  ],
};

export const CONTACT_ACTIVITIES: Record<string, readonly ContactActivity[]> = {
  'c-001': [
    { id: 'a1',  kind: 'note',    title: 'Note added',        body: 'Procurement needs SOC 2 docs before signing. Forwarded to security@.',                              author: 'Maria Lopez',     at: hoursAgo(3) },
    { id: 'a2',  kind: 'email',   title: 'Email sent',        body: 'Sent SOC 2 Type II report and DPA.',                                                                author: 'Maria Lopez',     at: hoursAgo(5) },
    { id: 'a3',  kind: 'call',    title: 'Call logged',       body: 'Discovery call with Pablo and IT lead. 32 min. Strong intent.',                                     author: 'Maria Lopez',     at: daysAgo(1) },
    { id: 'a4',  kind: 'meeting', title: 'Meeting scheduled', body: 'Solution architecture review with engineering · Thursday 10am.',                                    author: 'Maria Lopez',     at: daysAgo(2) },
    { id: 'a5',  kind: 'email',   title: 'Email sent',        body: 'Sent proposal v3 with renegotiated multi-year discount.',                                           author: 'Maria Lopez',     at: daysAgo(4) },
    { id: 'a6',  kind: 'note',    title: 'Note added',        body: 'Verbal commitment from VP. Pending CFO sign-off, expected by end of month.',                        author: 'Maria Lopez',     at: daysAgo(6) },
    { id: 'a7',  kind: 'meeting', title: 'Meeting scheduled', body: 'Pricing walkthrough with CFO.',                                                                     author: 'Maria Lopez',     at: daysAgo(7) },
    { id: 'a8',  kind: 'call',    title: 'Call logged',       body: 'Quick check-in. Confirmed Q4 budget is locked.',                                                    author: 'Diego Fernandez', at: daysAgo(11) },
    { id: 'a9',  kind: 'note',    title: 'Note added',        body: 'Champion = VP. Tech lead is supportive. CFO is gatekeeper.',                                        author: 'Maria Lopez',     at: daysAgo(15) },
    { id: 'a10', kind: 'email',   title: 'Email sent',        body: 'Sent intro deck and ROI calculator.',                                                               author: 'Maria Lopez',     at: daysAgo(22) },
  ],
  'c-002': [
    { id: 'a-c002-1', kind: 'note',  title: 'Note added',  body: 'New inbound lead via the webinar funnel.', author: 'Diego Fernandez', at: daysAgo(2) },
    { id: 'a-c002-2', kind: 'email', title: 'Email sent', body: 'Sent welcome email + scheduling link.',     author: 'Diego Fernandez', at: daysAgo(2) },
  ],
  'c-003': [
    { id: 'a-c003-1', kind: 'meeting', title: 'Meeting scheduled', body: 'QBR for Q3.',                                       author: 'Maria Lopez', at: daysAgo(4) },
    { id: 'a-c003-2', kind: 'note',    title: 'Note added',        body: 'Renewal looks healthy. Pricing leverage on multi-year.', author: 'Maria Lopez', at: daysAgo(9) },
    { id: 'a-c003-3', kind: 'call',    title: 'Call logged',       body: 'Renewal kick-off call. 22 min.',                    author: 'Maria Lopez', at: daysAgo(20) },
  ],
};
