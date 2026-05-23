import { Phone, Mail, Calendar, type LucideIcon } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────

export type DealStage =
  | 'lead'
  | 'contacted'
  | 'qualified'
  | 'proposal'
  | 'won'
  | 'lost';

export type Priority = 'high' | 'medium' | 'low';

export interface Deal {
  id: string;
  contactName: string;
  company: string;
  value: number;
  stage: DealStage;
  priority: Priority;
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

// ── Deals (intentionally realistic distribution across stages) ──────────────

export const DEALS: readonly Deal[] = [
  // Lead (top of funnel — most cards here)
  { id: 'd01', contactName: 'Camila Diaz',     company: 'Nimbus Group',       value: 18_400,  stage: 'lead',       priority: 'medium' },
  { id: 'd02', contactName: 'Juan Perez',      company: 'Acme Corp',          value: 45_200,  stage: 'lead',       priority: 'high'   },
  { id: 'd03', contactName: 'Sofia Castro',    company: 'Vertex Inc',         value: 9_800,   stage: 'lead',       priority: 'low'    },
  { id: 'd04', contactName: 'Mateo Aguirre',   company: 'Boreal Labs',        value: 32_100,  stage: 'lead',       priority: 'medium' },
  { id: 'd05', contactName: 'Renata Vega',     company: 'Quantum Networks',   value: 67_500,  stage: 'lead',       priority: 'high'   },
  { id: 'd06', contactName: 'Bruno Acosta',    company: 'Polar Studios',      value: 12_000,  stage: 'lead',       priority: 'low'    },

  // Contacted
  { id: 'd07', contactName: 'Lucia Romero',    company: 'Helios Systems',     value: 54_300,  stage: 'contacted',  priority: 'high'   },
  { id: 'd08', contactName: 'Diego Fernandez', company: 'Pioneer Partners',   value: 28_900,  stage: 'contacted',  priority: 'medium' },
  { id: 'd09', contactName: 'Olivia Suarez',   company: 'Cobalt Ventures',    value: 41_750,  stage: 'contacted',  priority: 'medium' },
  { id: 'd10', contactName: 'Tomas Vargas',    company: 'Apex Solutions',     value: 96_200,  stage: 'contacted',  priority: 'high'   },
  { id: 'd11', contactName: 'Valentina Lopez', company: 'Stellar Group',      value: 22_400,  stage: 'contacted',  priority: 'low'    },

  // Qualified
  { id: 'd12', contactName: 'Pablo Diaz',      company: 'Sentinel Capital',   value: 134_000, stage: 'qualified',  priority: 'high'   },
  { id: 'd13', contactName: 'Florencia Gomez', company: 'Aurora Dynamics',    value: 58_700,  stage: 'qualified',  priority: 'medium' },
  { id: 'd14', contactName: 'Sebastian Ruiz',  company: 'Zenith Holdings',    value: 76_400,  stage: 'qualified',  priority: 'high'   },
  { id: 'd15', contactName: 'Antonella Silva', company: 'Lumen Networks',     value: 31_900,  stage: 'qualified',  priority: 'medium' },

  // Proposal
  { id: 'd16', contactName: 'Ignacio Cabrera', company: 'Vanguard Ventures',  value: 215_000, stage: 'proposal',   priority: 'high'   },
  { id: 'd17', contactName: 'Paula Mendez',    company: 'Catalyst Inc',       value: 89_400,  stage: 'proposal',   priority: 'high'   },
  { id: 'd18', contactName: 'Cristian Reyes',  company: 'Equinox Labs',       value: 67_800,  stage: 'proposal',   priority: 'medium' },
  { id: 'd19', contactName: 'Belen Ortega',    company: 'Beacon Solutions',   value: 48_500,  stage: 'proposal',   priority: 'medium' },

  // Won
  { id: 'd20', contactName: 'Santiago Cruz',   company: 'Atlas International',value: 320_000, stage: 'won',        priority: 'high'   },
  { id: 'd21', contactName: 'Victoria Molina', company: 'Forge Industries',   value: 145_200, stage: 'won',        priority: 'medium' },
  { id: 'd22', contactName: 'Ramiro Castro',   company: 'Halcyon Group',      value: 88_900,  stage: 'won',        priority: 'medium' },
  { id: 'd23', contactName: 'Daniela Navarro', company: 'Crescent Studios',   value: 42_300,  stage: 'won',        priority: 'low'    },

  // Lost
  { id: 'd24', contactName: 'Esteban Hernandez', company: 'Ember Capital',    value: 56_000,  stage: 'lost',       priority: 'medium' },
  { id: 'd25', contactName: 'Carolina Torres',   company: 'Tundra Tech',      value: 24_500,  stage: 'lost',       priority: 'low'    },
];

// ── Action panel data ──────────────────────────────────────────────────────

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000);
const minutesAhead = (m: number) => new Date(Date.now() + m * 60_000);
const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000);

export type ActivityKind = 'call' | 'email' | 'meeting';

export interface ScheduledActivity {
  id: string;
  kind: ActivityKind;
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

export const ACTIVITY_ICONS: Record<ActivityKind, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
};

export const NEXT_ACTIVITIES: readonly ScheduledActivity[] = [
  { id: 'n1', kind: 'call',    title: 'Discovery call',    subtitle: 'Juan Perez · Acme Corp',         time: minutesAhead(30) },
  { id: 'n2', kind: 'meeting', title: 'Product demo',      subtitle: 'Sentinel Capital · 4 attendees', time: minutesAhead(95) },
  { id: 'n3', kind: 'email',   title: 'Send proposal',     subtitle: 'Vanguard Ventures',              time: minutesAhead(180) },
  { id: 'n4', kind: 'call',    title: 'Follow-up call',    subtitle: 'Lucia Romero · Helios Systems',  time: minutesAhead(280) },
  { id: 'n5', kind: 'meeting', title: 'Contract review',   subtitle: 'Atlas International',            time: minutesAhead(420) },
];

export const TODAYS_CALLS: readonly DueCall[] = [
  { id: 'c1', contactName: 'Juan Perez',      company: 'Acme Corp',        time: minutesAhead(30)  },
  { id: 'c2', contactName: 'Lucia Romero',    company: 'Helios Systems',   time: minutesAhead(280) },
  { id: 'c3', contactName: 'Sebastian Ruiz',  company: 'Zenith Holdings',  time: minutesAhead(360) },
  { id: 'c4', contactName: 'Olivia Suarez',   company: 'Cobalt Ventures',  time: minutesAhead(500) },
];

export const FOLLOW_UPS: readonly FollowUp[] = [
  { id: 'f1', contactName: 'Camila Diaz',     company: 'Nimbus Group',      due: hoursAgo(28) },
  { id: 'f2', contactName: 'Tomas Vargas',    company: 'Apex Solutions',    due: hoursAgo(50) },
  { id: 'f3', contactName: 'Mateo Aguirre',   company: 'Boreal Labs',       due: minutesAgo(75) },
  { id: 'f4', contactName: 'Florencia Gomez', company: 'Aurora Dynamics',   due: hoursAgo(10) },
  { id: 'f5', contactName: 'Ignacio Cabrera', company: 'Vanguard Ventures', due: hoursAgo(72) },
];
