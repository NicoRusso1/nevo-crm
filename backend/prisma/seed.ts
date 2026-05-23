/**
 * neVo CRM — deterministic demo seed.
 *
 * Re-runs produce identical logical fixtures: same counts, same names, same
 * relationships, same status/stage distributions. Only timestamps slide
 * forward relative to `now` so "upcoming activities" stays in the future and
 * "recent deals" stays recent.
 *
 * Counts:
 *   - 15 users (1 ADMIN, 3 MANAGER, 11 SALES_REP)
 *   - 120 clients
 *   - 300 leads
 *   - 200 deals
 *   - 400 activities
 *   - ~5–10 notifications per user (~75–150 total)
 *
 * All passwords are `Password1` — login as `admin@nevo.dev` to get started.
 */
import {
  ActivityType,
  DealStage,
  LeadStatus,
  PrismaClient,
  Role,
} from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Config
// ─────────────────────────────────────────────────────────────────────────────

const SEED = 0x4e65566f; // 'neVo'

const NUM_USERS = 15;
const NUM_CLIENTS = 120;
const NUM_LEADS = 300;
const NUM_DEALS = 200;
const NUM_ACTIVITIES = 400;

const PASSWORD_PLAINTEXT = 'Password1';
const BCRYPT_ROUNDS = 10; // lower than prod (12) — keeps the seed fast

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic PRNG (mulberry32) + helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = makeRng(SEED);

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

interface Weighted<T> {
  value: T;
  weight: number;
}

function pickWeighted<T>(items: readonly Weighted<T>[]): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rng() * total;
  for (const item of items) {
    r -= item.weight;
    if (r <= 0) return item.value;
  }
  return items[items.length - 1]!.value;
}

function int(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function decimal(min: number, max: number): number {
  return Math.round((rng() * (max - min) + min) * 100) / 100;
}

function chance(p: number): boolean {
  return rng() < p;
}

const NOW = new Date();
const DAY = 24 * 60 * 60 * 1000;

/** Date `min`..`max` days in the past, relative to NOW. */
function daysAgo(min: number, max: number): Date {
  const days = int(min, max);
  return new Date(NOW.getTime() - days * DAY);
}

/** Date `min`..`max` days in the future. */
function daysFromNow(min: number, max: number): Date {
  const days = int(min, max);
  return new Date(NOW.getTime() + days * DAY);
}

/** Fixed-length base36 token from the rng — deterministic across runs. */
function uniqueSuffix(): string {
  return Math.floor(rng() * 1296).toString(36).padStart(2, '0');
}

// ─────────────────────────────────────────────────────────────────────────────
// Lookup data
// ─────────────────────────────────────────────────────────────────────────────

const FIRST_NAMES = [
  'Nicolas', 'Maria', 'Juan', 'Sofia', 'Diego', 'Lucia', 'Martin', 'Valentina',
  'Pablo', 'Camila', 'Sebastian', 'Florencia', 'Mateo', 'Renata', 'Tomas',
  'Isabella', 'Lucas', 'Emilia', 'Joaquin', 'Mia', 'Bruno', 'Olivia', 'Felipe',
  'Antonella', 'Gonzalo', 'Catalina', 'Agustin', 'Julieta', 'Ignacio', 'Paula',
  'Santiago', 'Victoria', 'Federico', 'Carolina', 'Esteban', 'Daniela',
  'Ramiro', 'Macarena', 'Cristian', 'Belen',
] as const;

const LAST_NAMES = [
  'Russo', 'Gomez', 'Fernandez', 'Lopez', 'Martinez', 'Rodriguez', 'Perez',
  'Sanchez', 'Romero', 'Diaz', 'Torres', 'Ruiz', 'Hernandez', 'Castro',
  'Vargas', 'Silva', 'Acosta', 'Medina', 'Suarez', 'Aguirre', 'Molina',
  'Navarro', 'Vega', 'Reyes', 'Ortega', 'Cruz', 'Delgado', 'Mendez',
  'Gutierrez', 'Cabrera',
] as const;

const COMPANY_PREFIXES = [
  'Acme', 'Globex', 'Initech', 'Umbrella', 'Vandelay', 'Pied Piper', 'Hooli',
  'Wonka', 'Stark', 'Wayne', 'Soylent', 'Aperture', 'Cyberdyne', 'Tyrell',
  'Apex', 'Vertex', 'Helios', 'Aurora', 'Nimbus', 'Zenith', 'Quantum',
  'Stellar', 'Pinnacle', 'Summit', 'Atlas', 'Phoenix', 'Titan', 'Nexus',
  'Vortex', 'Catalyst', 'Lumen', 'Forge', 'Beacon', 'Sable', 'Onyx',
  'Crimson', 'Polar', 'Granite', 'Cobalt', 'Ember', 'Drift', 'Tundra',
  'Equinox', 'Solstice', 'Mirage', 'Cascade', 'Boreal', 'Orbital',
  'Citadel', 'Bastion', 'Sentinel', 'Vanguard', 'Pioneer', 'Compass',
  'Anchor', 'Halcyon', 'Crescent', 'Meridian', 'Horizon', 'Avenir',
] as const;

const COMPANY_SUFFIXES = [
  'Inc', 'Corp', 'Solutions', 'Technologies', 'Group', 'Industries', 'Labs',
  'Systems', 'Partners', 'Capital', 'Ventures', 'Holdings', 'Global',
  'International', 'Studios', 'Networks', 'Dynamics', 'Analytics', 'Software',
  'Robotics',
] as const;

const INDUSTRIES = [
  'SaaS', 'Manufacturing', 'Healthcare', 'Finance', 'Retail', 'E-commerce',
  'Education', 'Real Estate', 'Construction', 'Logistics', 'Hospitality',
  'Energy', 'Media', 'Consulting', 'Telecom', 'Automotive', 'Pharmaceutical',
  'Agriculture', 'Insurance', 'Legal',
] as const;

const LEAD_SOURCES = [
  'Website', 'Referral', 'Cold Call', 'Trade Show', 'LinkedIn', 'Google Ads',
  'Email Campaign', 'Webinar', 'Partner', 'Inbound', 'Outbound',
] as const;

const DEAL_TITLE_TEMPLATES = [
  '{company} – Annual Subscription',
  '{company} – Enterprise License',
  '{company} – Q{q} Renewal',
  '{company} – Q{q} Expansion',
  '{company} – Pilot Program',
  '{company} – Implementation Services',
  '{company} – Premium Support Package',
  '{company} – Custom Integration',
  '{company} – Multi-year Contract',
  '{company} – Onboarding & Training',
  '{company} – Add-on Module',
  '{company} – Platform Upgrade',
  '{company} – Consulting Engagement',
  '{company} – Strategic Partnership',
] as const;

const ACTIVITY_DESCRIPTIONS: Record<ActivityType, readonly string[]> = {
  CALL: [
    'Discovery call to understand requirements',
    'Follow-up call after demo',
    'Quarterly business review',
    'Renewal discussion',
    'Pricing conversation with procurement',
    'Check-in with champion',
    'Technical deep-dive call',
    'Executive briefing',
  ],
  EMAIL: [
    'Send proposal with pricing breakdown',
    'Share case study and ROI deck',
    'Follow up on signed NDA',
    'Send recap and next steps',
    'Confirm meeting agenda',
    'Reply to security questionnaire',
    'Share product roadmap snippet',
    'Forward implementation timeline',
  ],
  MEETING: [
    'Product demo for the team',
    'On-site workshop with stakeholders',
    'Contract review with legal',
    'Kickoff meeting with new client',
    'Quarterly business review',
    'Solution architecture session',
    'Procurement / vendor onboarding',
    'C-level alignment meeting',
  ],
  TASK: [
    'Prepare custom slide deck',
    'Build tailored ROI calculator',
    'Draft commercial proposal',
    'Update CRM with notes from call',
    'Set up trial environment',
    'Coordinate technical PoC',
    'Send signed MSA to legal',
    'Schedule onboarding sessions',
  ],
};

interface NotificationContext {
  userName: string;
  leadName?: string;
  dealTitle?: string;
  dealStage?: DealStage;
  dealValue?: string;
  activityDescription?: string;
  clientName?: string;
}

type NotificationTemplate = (c: NotificationContext) => { title: string; message: string };

const NOTIFICATION_TEMPLATES: readonly NotificationTemplate[] = [
  (c) => ({
    title: 'New lead assigned',
    message: `${c.userName}, a new lead "${c.leadName ?? 'Unknown'}" has been assigned to you.`,
  }),
  (c) => ({
    title: `Deal moved to ${c.dealStage ?? 'NEGOTIATION'}`,
    message: `Deal "${c.dealTitle ?? 'Untitled'}" is now in ${c.dealStage ?? 'NEGOTIATION'} stage.`,
  }),
  (c) => ({
    title: 'Activity due tomorrow',
    message: `Reminder: "${c.activityDescription ?? 'Follow-up'}" is due tomorrow.`,
  }),
  (c) => ({
    title: 'Deal closed-won 🎉',
    message: `Congrats! "${c.dealTitle ?? 'Deal'}" closed for ${c.dealValue ?? '$0.00'}.`,
  }),
  (c) => ({
    title: 'Activity completed',
    message: `"${c.activityDescription ?? 'Task'}" was marked complete.`,
  }),
  (c) => ({
    title: 'New client onboarded',
    message: `Welcome ${c.clientName ?? 'a new client'} to the pipeline.`,
  }),
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// Distributions (realistic funnel shapes)
// ─────────────────────────────────────────────────────────────────────────────

const LEAD_STATUS_DIST: ReadonlyArray<Weighted<LeadStatus>> = [
  { value: 'NEW', weight: 25 },
  { value: 'CONTACTED', weight: 20 },
  { value: 'QUALIFIED', weight: 15 },
  { value: 'PROPOSAL_SENT', weight: 10 },
  { value: 'NEGOTIATION', weight: 7 },
  { value: 'WON', weight: 13 },
  { value: 'LOST', weight: 10 },
];

const DEAL_STAGE_DIST: ReadonlyArray<Weighted<DealStage>> = [
  { value: 'LEAD', weight: 30 },
  { value: 'QUALIFIED', weight: 20 },
  { value: 'PROPOSAL', weight: 15 },
  { value: 'NEGOTIATION', weight: 10 },
  { value: 'WON', weight: 15 },
  { value: 'LOST', weight: 10 },
];

const ACTIVITY_TYPE_DIST: ReadonlyArray<Weighted<ActivityType>> = [
  { value: 'CALL', weight: 35 },
  { value: 'EMAIL', weight: 30 },
  { value: 'MEETING', weight: 20 },
  { value: 'TASK', weight: 15 },
];

/** Probability bands per stage — match the application's default behaviour. */
function probabilityForStage(stage: DealStage): number {
  switch (stage) {
    case 'LEAD': return int(5, 15);
    case 'QUALIFIED': return int(20, 40);
    case 'PROPOSAL': return int(40, 65);
    case 'NEGOTIATION': return int(60, 85);
    case 'WON': return 100;
    case 'LOST': return 0;
  }
}

/** Tier-mixed deal value: most SMB, a few enterprise outliers. */
function dealValue(): number {
  const tier = pickWeighted([
    { value: [5_000, 30_000], weight: 50 },
    { value: [30_000, 100_000], weight: 30 },
    { value: [100_000, 400_000], weight: 18 },
    { value: [400_000, 1_000_000], weight: 2 },
  ]);
  return decimal(tier[0]!, tier[1]!);
}

/** Lead value estimate — 80% have one, 20% are unqualified. */
function leadValue(): number | null {
  if (chance(0.2)) return null;
  return decimal(2_000, 150_000);
}

// ─────────────────────────────────────────────────────────────────────────────
// Name / email builders
// ─────────────────────────────────────────────────────────────────────────────

function buildCompanyName(): string {
  return `${pick(COMPANY_PREFIXES)} ${pick(COMPANY_SUFFIXES)}`;
}

function companyDomain(company: string): string {
  return company.toLowerCase().replace(/[^a-z0-9]/g, '') + '.com';
}

function personFullName(): { firstName: string; lastName: string; fullName: string } {
  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function buildEmail(firstName: string, lastName: string, domain: string, salt: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${salt}@${domain}`;
}

function buildPhone(): string {
  return `+54 9 11 ${int(1000, 9999)}-${int(1000, 9999)}`;
}

function quarterForDate(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Seeders
// ─────────────────────────────────────────────────────────────────────────────

async function wipe(): Promise<void> {
  // Reverse FK order. Schema cascades would handle some of this but explicit
  // is clearer when debugging a botched run.
  await prisma.notification.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.deal.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.client.deleteMany();
  await prisma.user.deleteMany();
}

interface SeededUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

async function seedUsers(): Promise<SeededUser[]> {
  const password = await bcrypt.hash(PASSWORD_PLAINTEXT, BCRYPT_ROUNDS);
  const users: SeededUser[] = [];

  // 1 ADMIN with a fixed, known email — the entry point for the demo.
  const admin = await prisma.user.create({
    data: {
      name: 'Admin neVo',
      email: 'admin@nevo.dev',
      password,
      role: 'ADMIN',
      createdAt: daysAgo(700, 720),
    },
    select: { id: true, name: true, email: true, role: true },
  });
  users.push(admin);

  // 3 MANAGERs with predictable emails.
  for (let i = 0; i < 3; i++) {
    const { fullName } = personFullName();
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: `manager${i + 1}@nevo.dev`,
        password,
        role: 'MANAGER',
        createdAt: daysAgo(500, 650),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    users.push(user);
  }

  // 11 SALES_REPs.
  for (let i = 0; i < NUM_USERS - 4; i++) {
    const { firstName, lastName, fullName } = personFullName();
    const user = await prisma.user.create({
      data: {
        name: fullName,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${i}@nevo.dev`,
        password,
        role: 'SALES_REP',
        createdAt: daysAgo(60, 500),
      },
      select: { id: true, name: true, email: true, role: true },
    });
    users.push(user);
  }

  return users;
}

interface SeededClient {
  id: string;
  companyName: string;
  contactName: string;
  industry: string | null;
}

async function seedClients(): Promise<SeededClient[]> {
  const clients: SeededClient[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const companyName = buildCompanyName();
    const { firstName, lastName, fullName } = personFullName();
    const domain = companyDomain(companyName);

    // Resolve email uniqueness — Client.email is UNIQUE.
    let email = buildEmail(firstName, lastName, domain, uniqueSuffix());
    while (usedEmails.has(email)) {
      email = buildEmail(firstName, lastName, domain, uniqueSuffix());
    }
    usedEmails.add(email);

    const industry = chance(0.9) ? pick(INDUSTRIES) : null;

    const client = await prisma.client.create({
      data: {
        companyName,
        contactName: fullName,
        email,
        phone: chance(0.85) ? buildPhone() : null,
        industry,
        createdAt: daysAgo(30, 540),
      },
      select: { id: true, companyName: true, contactName: true, industry: true },
    });
    clients.push(client);
  }

  return clients;
}

interface SeededLead {
  id: string;
  name: string;
  status: LeadStatus;
  assignedToId: string | null;
}

async function seedLeads(users: SeededUser[]): Promise<SeededLead[]> {
  const salesUsers = users.filter((u) => u.role !== 'ADMIN');
  const leads: SeededLead[] = [];

  for (let i = 0; i < NUM_LEADS; i++) {
    const { firstName, lastName, fullName } = personFullName();
    const company = buildCompanyName();
    const domain = companyDomain(company);
    const email = buildEmail(firstName, lastName, domain, uniqueSuffix());

    const status = pickWeighted(LEAD_STATUS_DIST);
    const source = chance(0.92) ? pick(LEAD_SOURCES) : null;

    // 90% assigned, 10% unassigned (top-of-funnel queue).
    const assignee = chance(0.9) ? pick(salesUsers) : null;

    const lead = await prisma.lead.create({
      data: {
        name: fullName,
        company,
        email,
        phone: chance(0.75) ? buildPhone() : null,
        source,
        status,
        value: leadValue(),
        notes: chance(0.4)
          ? `Notes for ${fullName}: contacted via ${source ?? 'unknown'}.`
          : null,
        assignedToId: assignee?.id ?? null,
        createdAt: daysAgo(1, 365),
      },
      select: { id: true, name: true, status: true, assignedToId: true },
    });

    leads.push(lead);
  }

  return leads;
}

interface SeededDeal {
  id: string;
  title: string;
  stage: DealStage;
  ownerId: string;
  clientId: string;
  value: string;
  createdAt: Date;
}

async function seedDeals(
  users: SeededUser[],
  clients: SeededClient[],
): Promise<SeededDeal[]> {
  const owners = users.filter((u) => u.role !== 'ADMIN');
  const deals: SeededDeal[] = [];

  for (let i = 0; i < NUM_DEALS; i++) {
    const client = pick(clients);
    const owner = pick(owners);
    const stage = pickWeighted(DEAL_STAGE_DIST);

    const template = pick(DEAL_TITLE_TEMPLATES);
    const createdAt = daysAgo(1, 270);
    const title = template
      .replace('{company}', client.companyName)
      .replace('{q}', quarterForDate(createdAt).toString());

    // Terminal stages: close date is usually in the past.
    // Open stages: close date is usually in the future.
    let expectedCloseDate: Date | null;
    if (stage === 'WON' || stage === 'LOST') {
      expectedCloseDate = chance(0.85) ? daysAgo(1, 90) : null;
    } else {
      expectedCloseDate = chance(0.85) ? daysFromNow(7, 180) : null;
    }

    const deal = await prisma.deal.create({
      data: {
        title,
        value: dealValue(),
        probability: probabilityForStage(stage),
        expectedCloseDate,
        stage,
        clientId: client.id,
        ownerId: owner.id,
        createdAt,
      },
      select: {
        id: true,
        title: true,
        stage: true,
        ownerId: true,
        clientId: true,
        value: true,
        createdAt: true,
      },
    });

    deals.push({
      id: deal.id,
      title: deal.title,
      stage: deal.stage,
      ownerId: deal.ownerId,
      clientId: deal.clientId,
      value: deal.value.toString(),
      createdAt: deal.createdAt,
    });
  }

  return deals;
}

interface SeededActivity {
  id: string;
  userId: string;
  type: ActivityType;
  description: string;
  dueDate: Date | null;
  completed: boolean;
  leadId: string | null;
  dealId: string | null;
}

async function seedActivities(
  users: SeededUser[],
  leads: SeededLead[],
  deals: SeededDeal[],
): Promise<SeededActivity[]> {
  const owners = users.filter((u) => u.role !== 'ADMIN');
  const activities: SeededActivity[] = [];

  for (let i = 0; i < NUM_ACTIVITIES; i++) {
    const owner = pick(owners);
    const type = pickWeighted(ACTIVITY_TYPE_DIST);
    const description = pick(ACTIVITY_DESCRIPTIONS[type]);

    // Attachment: 75% to a deal, 20% to a lead, 5% standalone task.
    const attachmentRoll = rng();
    let leadId: string | null = null;
    let dealId: string | null = null;
    if (attachmentRoll < 0.75) {
      dealId = pick(deals).id;
    } else if (attachmentRoll < 0.95) {
      leadId = pick(leads).id;
    }

    // Timing buckets give realistic history + a slice of upcoming work:
    //   60% past + completed
    //   20% past + still open (overdue)
    //   20% upcoming (next 30d, not completed)
    const timingRoll = rng();
    let createdAt: Date;
    let dueDate: Date | null;
    let completed: boolean;

    if (timingRoll < 0.6) {
      createdAt = daysAgo(8, 180);
      dueDate = chance(0.8) ? new Date(createdAt.getTime() + int(0, 7) * DAY) : null;
      completed = true;
    } else if (timingRoll < 0.8) {
      createdAt = daysAgo(8, 90);
      dueDate = new Date(createdAt.getTime() + int(0, 7) * DAY);
      completed = false;
    } else {
      createdAt = daysAgo(0, 7);
      dueDate = daysFromNow(0, 30);
      completed = false;
    }

    const activity = await prisma.activity.create({
      data: {
        type,
        description,
        dueDate,
        completed,
        userId: owner.id,
        leadId,
        dealId,
        createdAt,
      },
      select: {
        id: true,
        userId: true,
        type: true,
        description: true,
        dueDate: true,
        completed: true,
        leadId: true,
        dealId: true,
      },
    });

    activities.push(activity);
  }

  return activities;
}

async function seedNotifications(
  users: SeededUser[],
  activities: SeededActivity[],
  deals: SeededDeal[],
  leads: SeededLead[],
  clients: SeededClient[],
): Promise<void> {
  const dealsById = new Map(deals.map((d) => [d.id, d]));
  const leadsById = new Map(leads.map((l) => [l.id, l]));

  for (const user of users) {
    if (user.role === 'ADMIN') continue;

    // Index this user's activities once per user instead of re-scanning inside
    // the inner loop.
    const myActivities = activities.filter((a) => a.userId === user.id);

    const count = int(5, 10);
    for (let i = 0; i < count; i++) {
      const ref = myActivities.length > 0 ? pick(myActivities) : null;
      const refDeal = ref?.dealId ? dealsById.get(ref.dealId) ?? null : null;
      const refLead = ref?.leadId ? leadsById.get(ref.leadId) ?? null : null;

      const template = pick(NOTIFICATION_TEMPLATES);
      const { title, message } = template({
        userName: user.name.split(' ')[0] ?? user.name,
        leadName: refLead?.name,
        dealTitle: refDeal?.title,
        dealStage: refDeal?.stage,
        dealValue: refDeal
          ? `$${Number(refDeal.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
          : undefined,
        activityDescription: ref?.description,
        clientName: clients.length > 0 ? pick(clients).companyName : undefined,
      });

      await prisma.notification.create({
        data: {
          title,
          message,
          read: chance(0.4), // 40% read, 60% unread
          userId: user.id,
          createdAt: daysAgo(0, 14),
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Orchestrator
// ─────────────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const t0 = Date.now();
  console.log('🌱 neVo CRM — seeding deterministic demo data');
  console.log(`   seed: 0x${SEED.toString(16)}`);

  console.log('   → wiping existing data...');
  await wipe();

  console.log(`   → creating ${NUM_USERS} users...`);
  const users = await seedUsers();

  console.log(`   → creating ${NUM_CLIENTS} clients...`);
  const clients = await seedClients();

  console.log(`   → creating ${NUM_LEADS} leads...`);
  const leads = await seedLeads(users);

  console.log(`   → creating ${NUM_DEALS} deals...`);
  const deals = await seedDeals(users, clients);

  console.log(`   → creating ${NUM_ACTIVITIES} activities...`);
  const activities = await seedActivities(users, leads, deals);

  console.log('   → creating notifications...');
  await seedNotifications(users, activities, deals, leads, clients);

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n✅ Seed completed in ${elapsed}s`);
  console.log('\n┌──────────────────────────────────────────────────────────────┐');
  console.log('│  Login credentials                                            │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log('│  ADMIN     admin@nevo.dev               / Password1           │');
  console.log('│  MANAGER   manager1@nevo.dev            / Password1           │');
  console.log('│  MANAGER   manager2@nevo.dev            / Password1           │');
  console.log('│  MANAGER   manager3@nevo.dev            / Password1           │');
  console.log('│  SALES    <firstname>.<lastname>.N@nevo.dev / Password1       │');
  console.log('└──────────────────────────────────────────────────────────────┘');
}

main()
  .catch((err: unknown) => {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
