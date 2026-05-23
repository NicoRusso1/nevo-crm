/**
 * Companies mock data.
 * Core entities in the CRM representing customer organizations.
 */

export type CompanySize = 'Small' | 'Mid' | 'Enterprise';

export type CompanyIndustry =
  | 'Technology'
  | 'Finance'
  | 'Healthcare'
  | 'Retail'
  | 'Manufacturing'
  | 'Energy'
  | 'Telecom'
  | 'Media'
  | 'Real Estate'
  | 'Education';

export interface Company {
  id: string;
  name: string;
  industry: CompanyIndustry;
  size: CompanySize;
  website?: string;
  createdAt: Date;
}

// ── Seed data ──────────────────────────────────────────────────────────────

const monthsAgo = (m: number) => new Date(Date.now() - m * 30 * 86_400_000);

export const COMPANIES: readonly Company[] = [
  { id: 'co-001', name: 'Sentinel Capital',     industry: 'Finance',       size: 'Enterprise', website: 'sentinel.com',        createdAt: monthsAgo(12) },
  { id: 'co-002', name: 'Aurora Dynamics',      industry: 'Technology',    size: 'Mid',        website: 'auroradyn.com',      createdAt: monthsAgo(9) },
  { id: 'co-003', name: 'Atlas International',  industry: 'Finance',       size: 'Enterprise', website: 'atlasintl.com',       createdAt: monthsAgo(18) },
  { id: 'co-004', name: 'Nimbus Group',         industry: 'Technology',    size: 'Mid',        website: 'nimbusgrp.com',      createdAt: monthsAgo(6) },
  { id: 'co-005', name: 'Acme Corp',            industry: 'Retail',        size: 'Enterprise', website: 'acmecorp.com',        createdAt: monthsAgo(8) },
  { id: 'co-006', name: 'Vertex Inc',           industry: 'Manufacturing', size: 'Mid',        website: 'vertexinc.com',      createdAt: monthsAgo(4) },
  { id: 'co-007', name: 'Boreal Labs',          industry: 'Technology',    size: 'Small',      website: 'boreallabs.com',     createdAt: monthsAgo(3) },
  { id: 'co-008', name: 'Quantum Networks',     industry: 'Telecom',       size: 'Enterprise', website: 'quantumnet.com',     createdAt: monthsAgo(11) },
  { id: 'co-009', name: 'Polar Studios',        industry: 'Media',         size: 'Small',      website: 'polarstudio.com',    createdAt: monthsAgo(5) },
  { id: 'co-010', name: 'Helios Systems',       industry: 'Energy',        size: 'Enterprise', website: 'heliossys.com',       createdAt: monthsAgo(14) },
  { id: 'co-011', name: 'Pioneer Partners',     industry: 'Finance',       size: 'Mid',        website: 'pioneerpart.com',    createdAt: monthsAgo(7) },
  { id: 'co-012', name: 'Cobalt Ventures',      industry: 'Technology',    size: 'Mid',        website: 'cobaltvn.com',       createdAt: monthsAgo(10) },
  { id: 'co-013', name: 'Apex Solutions',       industry: 'Technology',    size: 'Enterprise', website: 'apexsol.com',         createdAt: monthsAgo(9) },
  { id: 'co-014', name: 'Stellar Group',        industry: 'Real Estate',   size: 'Mid',        website: 'stellargrp.com',     createdAt: monthsAgo(6) },
  { id: 'co-015', name: 'Vanguard Ventures',    industry: 'Finance',       size: 'Enterprise', website: 'vanguardv.com',      createdAt: monthsAgo(15) },
  { id: 'co-016', name: 'Catalyst Inc',         industry: 'Technology',    size: 'Mid',        website: 'catalystinc.com',    createdAt: monthsAgo(8) },
  { id: 'co-017', name: 'Equinox Labs',         industry: 'Healthcare',    size: 'Small',      website: 'equinoxlab.com',     createdAt: monthsAgo(4) },
  { id: 'co-018', name: 'Beacon Solutions',     industry: 'Telecom',       size: 'Mid',        website: 'beaconsol.com',      createdAt: monthsAgo(7) },
  { id: 'co-019', name: 'Forge Industries',     industry: 'Manufacturing', size: 'Enterprise', website: 'forgeinc.com',       createdAt: monthsAgo(12) },
  { id: 'co-020', name: 'Halcyon Group',        industry: 'Finance',       size: 'Mid',        website: 'halcyongrp.com',     createdAt: monthsAgo(10) },
  { id: 'co-021', name: 'Zenith Holdings',      industry: 'Technology',    size: 'Mid',        website: 'zenithhold.com',     createdAt: monthsAgo(9) },
  { id: 'co-022', name: 'Lumen Networks',       industry: 'Telecom',       size: 'Enterprise', website: 'lumennet.com',        createdAt: monthsAgo(8) },
  { id: 'co-023', name: 'Crescent Studios',     industry: 'Media',         size: 'Small',      website: 'crescentst.com',     createdAt: monthsAgo(7) },
  { id: 'co-024', name: 'Ember Capital',        industry: 'Finance',       size: 'Mid',        website: 'embercap.com',       createdAt: monthsAgo(6) },
  { id: 'co-025', name: 'Tundra Tech',          industry: 'Technology',    size: 'Small',      website: 'tundratech.com',     createdAt: monthsAgo(5) },
];

export function findCompany(id: string): Company | undefined {
  return COMPANIES.find((c) => c.id === id);
}

export function getIndustryColor(industry: CompanyIndustry): string {
  const colors: Record<CompanyIndustry, string> = {
    Technology: 'bg-blue-100 text-blue-800',
    Finance: 'bg-green-100 text-green-800',
    Healthcare: 'bg-red-100 text-red-800',
    Retail: 'bg-purple-100 text-purple-800',
    Manufacturing: 'bg-orange-100 text-orange-800',
    Energy: 'bg-yellow-100 text-yellow-800',
    Telecom: 'bg-indigo-100 text-indigo-800',
    Media: 'bg-pink-100 text-pink-800',
    'Real Estate': 'bg-teal-100 text-teal-800',
    Education: 'bg-cyan-100 text-cyan-800',
  };
  return colors[industry];
}

export function getSizeLabel(size: CompanySize): string {
  return size;
}

export function getSizeOrder(size: CompanySize): number {
  const order = { Small: 1, Mid: 2, Enterprise: 3 };
  return order[size];
}
