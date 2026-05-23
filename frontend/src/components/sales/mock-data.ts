import { Phone, Mail, Calendar, FileText, type LucideIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type DealStage =
  | 'lead'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';

export type Priority = 'high' | 'medium' | 'low';

/** Sales rep who owns a deal. */
export interface Owner {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

export interface Deal {
  id: string;
  contactName: string;
  company: string;
  value: number;
  stage: DealStage;
  priority: Priority;
  /** 0–100; controls win-weighted pipeline. */
  probability: number;
  ownerId: string;
  contactEmail?: string;
  avatar?: string | null;
}

export interface PipelineStage {
  key: DealStage;
  label: string;
}

export const STAGES: readonly PipelineStage[] = [
  { key: 'lead', label: 'Lead' },
  { key: 'contacted', label: 'Contacted' },
  { key: 'qualified', label: 'Qualified' },
  { key: 'proposal', label: 'Proposal' },
  { key: 'won', label: 'Won' },
  { key: 'lost', label: 'Lost' },
];

// ── Owners (sales reps) ────────────────────────────────────────────────────

export const OWNERS: readonly Owner[] = [
  { id: 'u1', name: 'Maria Lopez',     email: 'maria@nevo.dev' },
  { id: 'u2', name: 'Diego Fernandez', email: 'diego@nevo.dev' },
  { id: 'u3', name: 'Sofia Castro',    email: 'sofia@nevo.dev' },
  { id: 'u4', name: 'Tomas Vargas',    email: 'tomas@nevo.dev' },
];

export function findOwner(id: string): Owner | undefined {
  return OWNERS.find((o) => o.id === id);
}

// ── Default probability per stage (sane fallback) ──────────────────────────

export function defaultProbabilityFor(stage: DealStage): number {
  switch (stage) {
    case 'lead': return 10;
    case 'contacted': return 25;
    case 'qualified': return 45;
    case 'proposal': return 65;
    case 'won': return 100;
    case 'lost': return 0;
  }
}

// ── Deals (intentionally realistic distribution across stages) ─────────────

export const INITIAL_DEALS: readonly Deal[] = [
  // Lead
  { id: 'd01', contactName: 'Camila Diaz',     company: 'Nimbus Group',       value: 18_400,  stage: 'lead',      priority: 'medium', probability: 12, ownerId: 'u1', contactEmail: 'camila@nimbus.com' },
  { id: 'd02', contactName: 'Juan Perez',      company: 'Acme Corp',          value: 45_200,  stage: 'lead',      priority: 'high',   probability: 15, ownerId: 'u2', contactEmail: 'juan@acme.com' },
  { id: 'd03', contactName: 'Sofia Castro',    company: 'Vertex Inc',         value: 9_800,   stage: 'lead',      priority: 'low',    probability: 8,  ownerId: 'u3', contactEmail: 'sofia@vertex.com' },
  { id: 'd04', contactName: 'Mateo Aguirre',   company: 'Boreal Labs',        value: 32_100,  stage: 'lead',      priority: 'medium', probability: 18, ownerId: 'u1', contactEmail: 'mateo@boreal.com' },
  { id: 'd05', contactName: 'Renata Vega',     company: 'Quantum Networks',   value: 67_500,  stage: 'lead',      priority: 'high',   probability: 22, ownerId: 'u2', contactEmail: 'renata@quantum.com' },
  { id: 'd06', contactName: 'Bruno Acosta',    company: 'Polar Studios',      value: 12_000,  stage: 'lead',      priority: 'low',    probability: 10, ownerId: 'u4', contactEmail: 'bruno@polar.com' },

  // Contacted
  { id: 'd07', contactName: 'Lucia Romero',    company: 'Helios Systems',     value: 54_300,  stage: 'contacted', priority: 'high',   probability: 30, ownerId: 'u3', contactEmail: 'lucia@helios.com' },
  { id: 'd08', contactName: 'Diego Fernandez', company: 'Pioneer Partners',   value: 28_900,  stage: 'contacted', priority: 'medium', probability: 28, ownerId: 'u1', contactEmail: 'diego@pioneer.com' },
  { id: 'd09', contactName: 'Olivia Suarez',   company: 'Cobalt Ventures',    value: 41_750,  stage: 'contacted', priority: 'medium', probability: 25, ownerId: 'u4', contactEmail: 'olivia@cobalt.com' },
  { id: 'd10', contactName: 'Tomas Vargas',    company: 'Apex Solutions',     value: 96_200,  stage: 'contacted', priority: 'high',   probability: 32, ownerId: 'u2', contactEmail: 'tomas@apex.com' },
  { id: 'd11', contactName: 'Valentina Lopez', company: 'Stellar Group',      value: 22_400,  stage: 'contacted', priority: 'low',    probability: 22, ownerId: 'u3', contactEmail: 'valentina@stellar.com' },

  // Qualified
  { id: 'd12', contactName: 'Pablo Diaz',      company: 'Sentinel Capital',   value: 134_000, stage: 'qualified', priority: 'high',   probability: 55, ownerId: 'u1', contactEmail: 'pablo@sentinel.com' },
  { id: 'd13', contactName: 'Florencia Gomez', company: 'Aurora Dynamics',    value: 58_700,  stage: 'qualified', priority: 'medium', probability: 48, ownerId: 'u4', contactEmail: 'florencia@aurora.com' },
  { id: 'd14', contactName: 'Sebastian Ruiz',  company: 'Zenith Holdings',    value: 76_400,  stage: 'qualified', priority: 'high',   probability: 52, ownerId: 'u2', contactEmail: 'sebastian@zenith.com' },
  { id: 'd15', contactName: 'Antonella Silva', company: 'Lumen Networks',     value: 31_900,  stage: 'qualified', priority: 'medium', probability: 42, ownerId: 'u3', contactEmail: 'antonella@lumen.com' },

  // Proposal
  { id: 'd16', contactName: 'Ignacio Cabrera', company: 'Vanguard Ventures',  value: 215_000, stage: 'proposal',  priority: 'high',   probability: 75, ownerId: 'u1', contactEmail: 'ignacio@vanguard.com' },
  { id: 'd17', contactName: 'Paula Mendez',    company: 'Catalyst Inc',       value: 89_400,  stage: 'proposal',  priority: 'high',   probability: 70, ownerId: 'u2', contactEmail: 'paula@catalyst.com' },
  { id: 'd18', contactName: 'Cristian Reyes',  company: 'Equinox Labs',       value: 67_800,  stage: 'proposal',  priority: 'medium', probability: 60, ownerId: 'u4', contactEmail: 'cristian@equinox.com' },
  { id: 'd19', contactName: 'Belen Ortega',    company: 'Beacon Solutions',   value: 48_500,  stage: 'proposal',  priority: 'medium', probability: 65, ownerId: 'u3', contactEmail: 'belen@beacon.com' },

  // Won
  { id: 'd20', contactName: 'Santiago Cruz',   company: 'Atlas International',value: 320_000, stage: 'won',       priority: 'high',   probability: 100, ownerId: 'u1', contactEmail: 'santiago@atlas.com' },
  { id: 'd21', contactName: 'Victoria Molina', company: 'Forge Industries',   value: 145_200, stage: 'won',       priority: 'medium', probability: 100, ownerId: 'u2', contactEmail: 'victoria@forge.com' },
  { id: 'd22', contactName: 'Ramiro Castro',   company: 'Halcyon Group',      value: 88_900,  stage: 'won',       priority: 'medium', probability: 100, ownerId: 'u4', contactEmail: 'ramiro@halcyon.com' },
  { id: 'd23', contactName: 'Daniela Navarro', company: 'Crescent Studios',   value: 42_300,  stage: 'won',       priority: 'low',    probability: 100, ownerId: 'u3', contactEmail: 'daniela@crescent.com' },

  // Lost
  { id: 'd24', contactName: 'Esteban Hernandez', company: 'Ember Capital',    value: 56_000,  stage: 'lost',      priority: 'medium', probability: 0,   ownerId: 'u2', contactEmail: 'esteban@ember.com' },
  { id: 'd25', contactName: 'Carolina Torres',   company: 'Tundra Tech',      value: 24_500,  stage: 'lost',      priority: 'low',    probability: 0,   ownerId: 'u4', contactEmail: 'carolina@tundra.com' },
];

// ── Activities ─────────────────────────────────────────────────────────────

/**
 * Activity kinds. The first three are also used by the side ActionPanel.
 * `note` is exclusive to per-deal timelines.
 */
export type ActivityKind = 'call' | 'email' | 'meeting' | 'note';

export const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
};

export const ACTIVITY_LABEL: Record<ActivityKind, string> = {
  call: 'Call logged',
  email: 'Email sent',
  meeting: 'Meeting scheduled',
  note: 'Note added',
};

/** Event in a deal's timeline. Created via quick actions. */
export interface DealActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  body?: string;
  author: string;
  at: Date;
}

// Helpers for seed timestamps.
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000);

/**
 * Hand-crafted activity timelines for the first few deals (so demos look
 * lived-in). Other deals start with a single "Deal created" entry generated
 * lazily by the store.
 */
export const SEEDED_ACTIVITIES: Record<string, readonly DealActivity[]> = {
  d02: [
    { id: 'a-d02-1', kind: 'note',    title: 'Note added',        body: 'Champion is the VP Eng. Looking to roll out company-wide.', author: 'Maria Lopez',     at: hoursAgo(2) },
    { id: 'a-d02-2', kind: 'call',    title: 'Call logged',       body: 'Discovery call · 28 min. Strong fit, needs SSO.',           author: 'Maria Lopez',     at: hoursAgo(26) },
    { id: 'a-d02-3', kind: 'email',   title: 'Email sent',        body: 'Sent the welcome kit and pricing one-pager.',               author: 'Maria Lopez',     at: daysAgo(3) },
  ],
  d12: [
    { id: 'a-d12-1', kind: 'meeting', title: 'Meeting scheduled', body: 'Solution architecture review on Thursday at 10am.',         author: 'Diego Fernandez', at: hoursAgo(5) },
    { id: 'a-d12-2', kind: 'call',    title: 'Call logged',       body: 'Demo went well. Asked for ROI calculator.',                 author: 'Diego Fernandez', at: daysAgo(2) },
    { id: 'a-d12-3', kind: 'note',    title: 'Note added',        body: 'Procurement needs SOC 2 report. Sent via security@.',       author: 'Diego Fernandez', at: daysAgo(4) },
  ],
  d16: [
    { id: 'a-d16-1', kind: 'email',   title: 'Email sent',        body: 'Proposal v3 sent. Reduced first-year by 8%.',               author: 'Maria Lopez',     at: hoursAgo(8) },
    { id: 'a-d16-2', kind: 'meeting', title: 'Meeting scheduled', body: 'Contract walkthrough with legal · Friday.',                 author: 'Maria Lopez',     at: daysAgo(1) },
  ],
};

// ── Action panel data ──────────────────────────────────────────────────────

const minutesAhead = (m: number) => new Date(Date.now() + m * 60_000);

export interface ScheduledActivity {
  id: string;
  kind: 'call' | 'email' | 'meeting';
  title: string;
  subtitle: string;
  time: Date;
}

export interface DueCall {
  id: string;
  contactName: string;
  company: string;
  time: Date;
}

export interface FollowUp {
  id: string;
  contactName: string;
  company: string;
  due: Date;
}

export const NEXT_ACTIVITIES: readonly ScheduledActivity[] = [
  { id: 'n1', kind: 'call',    title: 'Discovery call',    subtitle: 'Juan Perez · Acme Corp',         time: minutesAhead(30) },
  { id: 'n2', kind: 'meeting', title: 'Product demo',      subtitle: 'Sentinel Capital · 4 attendees', time: minutesAhead(95) },
  { id: 'n3', kind: 'email',   title: 'Send proposal',     subtitle: 'Vanguard Ventures',              time: minutesAhead(180) },
  { id: 'n4', kind: 'call',    title: 'Follow-up call',    subtitle: 'Lucia Romero · Helios Systems',  time: minutesAhead(280) },
  { id: 'n5', kind: 'meeting', title: 'Contract review',   subtitle: 'Atlas International',            time: minutesAhead(420) },
];

export const TODAYS_CALLS: readonly DueCall[] = [
  { id: 'c1', contactName: 'Juan Perez',     company: 'Acme Corp',       time: minutesAhead(30)  },
  { id: 'c2', contactName: 'Lucia Romero',   company: 'Helios Systems',  time: minutesAhead(280) },
  { id: 'c3', contactName: 'Sebastian Ruiz', company: 'Zenith Holdings', time: minutesAhead(360) },
  { id: 'c4', contactName: 'Olivia Suarez',  company: 'Cobalt Ventures', time: minutesAhead(500) },
];

export const FOLLOW_UPS: readonly FollowUp[] = [
  { id: 'f1', contactName: 'Camila Diaz',     company: 'Nimbus Group',      due: hoursAgo(28) },
  { id: 'f2', contactName: 'Tomas Vargas',    company: 'Apex Solutions',    due: hoursAgo(50) },
  { id: 'f3', contactName: 'Mateo Aguirre',   company: 'Boreal Labs',       due: hoursAgo(1)  },
  { id: 'f4', contactName: 'Florencia Gomez', company: 'Aurora Dynamics',   due: hoursAgo(10) },
  { id: 'f5', contactName: 'Ignacio Cabrera', company: 'Vanguard Ventures', due: hoursAgo(72) },
];
