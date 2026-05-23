import { useCallback, useMemo, useState } from 'react';
import {
  CONTACT_ACTIVITIES,
  CONTACT_DEALS,
  type ContactActivity,
  type ContactActivityKind,
  type ContactDeal,
} from './mock-data';

const ACTIVITY_TITLE: Record<ContactActivityKind, string> = {
  call: 'Call logged',
  email: 'Email sent',
  meeting: 'Meeting scheduled',
  note: 'Note added',
};

export interface AddActivityInput {
  kind: ContactActivityKind;
  body?: string;
  /** Optional title override. Defaults to the canonical "X logged/sent/etc." */
  title?: string;
}

/**
 * Page-local state for a single contact's deals + activity timeline.
 *
 * Encapsulated as a hook so the page component stays focused on layout. When
 * the API lands, replace the `useState` calls with mutations + cache reads —
 * the consuming components don't change.
 */
export function useContactState(contactId: string) {
  const [deals, setDeals] = useState<readonly ContactDeal[]>(
    () => CONTACT_DEALS[contactId] ?? [],
  );
  const [activities, setActivities] = useState<readonly ContactActivity[]>(
    () => CONTACT_ACTIVITIES[contactId] ?? [],
  );

  const addActivity = useCallback((input: AddActivityInput) => {
    const next: ContactActivity = {
      id: makeId(),
      kind: input.kind,
      title: input.title ?? ACTIVITY_TITLE[input.kind],
      body: input.body,
      author: 'You',
      at: new Date(),
    };
    setActivities((prev) => [next, ...prev]);
  }, []);

  // Derived KPIs — recomputed on each deals change.
  const summary = useMemo(() => {
    const totalDeals = deals.length;
    const wonRevenue = deals
      .filter((d) => d.status === 'won')
      .reduce((sum, d) => sum + d.value, 0);
    return { totalDeals, wonRevenue };
  }, [deals]);

  const lastActivityAt = activities[0]?.at ?? null;

  return {
    deals,
    activities,
    addActivity,
    summary,
    lastActivityAt,
    // Setter exposed so future actions (drag stage, edit deal) can update.
    setDeals,
  };
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}
