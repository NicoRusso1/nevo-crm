/**
 * Unified activity type across CRM entities.
 * Activities can be linked to companies, contacts, or deals (at least one is required).
 */

export type ActivityKind = 'call' | 'email' | 'meeting' | 'note';

export interface GlobalActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  body?: string;
  author: string;
  at: Date;
  // Entity references (at least one is required)
  companyId?: string;
  contactId?: string;
  dealId?: string;
}
