/**
 * Unified CRM store.
 *
 * Holds the canonical deals, companies, and global activities.
 * Everything in the CRM reads/writes through this hook — when the API lands,
 * swap the useState calls for SWR/TanStack mutations and the rest of the UI stays untouched.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  ACTIVITY_LABEL,
  INITIAL_DEALS,
  SEEDED_ACTIVITIES,
  defaultProbabilityFor,
  type ActivityKind,
  type Deal,
  type DealActivity,
  type DealStage,
} from './mock-data';
import { COMPANIES, type Company } from '@/components/companies/mock-data';
import { type GlobalActivity } from '@/types/activity';
import { CONTACTS, type Contact } from '@/components/contacts/mock-data';

// ── Public API ─────────────────────────────────────────────────────────────

export interface AddActivityInput {
  kind: ActivityKind;
  body?: string;
  title?: string;
}

interface SalesStore {
  // State
  deals: readonly Deal[];
  companies: readonly Company[];
  contacts: readonly Contact[];
  selectedDealId: string | null;
  activitiesByDeal: Readonly<Record<string, DealActivity[]>>;
  globalActivities: readonly GlobalActivity[];

  // Selectors
  getSelectedDeal: () => Deal | undefined;
  getActivities: (dealId: string) => readonly DealActivity[];
  getCompanyContacts: (companyId: string) => readonly Contact[];
  getCompanyDeals: (companyId: string) => readonly Deal[];
  getCompanyRevenue: (companyId: string) => number;
  getActivitiesFor: (entity: { type: 'company' | 'contact' | 'deal'; id: string }) => readonly GlobalActivity[];
  getCompany: (id: string) => Company | undefined;

  // Mutations
  selectDeal: (id: string | null) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  changeStage: (id: string, stage: DealStage) => void;
  addActivity: (dealId: string, input: AddActivityInput) => void;
  addGlobalActivity: (companyId: string | undefined, contactId: string | undefined, dealId: string | undefined, input: AddActivityInput) => void;
  markWon: (id: string) => void;
  markLost: (id: string) => void;
}

const SalesContext = createContext<SalesStore | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function SalesProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<readonly Deal[]>(INITIAL_DEALS);
  const [companies] = useState<readonly Company[]>(COMPANIES);
  const [contacts] = useState<readonly Contact[]>(CONTACTS);
  const [activitiesByDeal, setActivitiesByDeal] = useState<
    Readonly<Record<string, DealActivity[]>>
  >(() => seedActivities());
  const [globalActivities, setGlobalActivities] = useState<readonly GlobalActivity[]>([]);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

  const selectDeal = useCallback((id: string | null) => {
    setSelectedDealId(id);
  }, []);

  const updateDeal = useCallback((id: string, patch: Partial<Deal>) => {
    setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  }, []);

  const addActivity = useCallback(
    (dealId: string, input: AddActivityInput) => {
      const activity: DealActivity = {
        id: makeId(),
        kind: input.kind,
        title: input.title ?? ACTIVITY_LABEL[input.kind],
        body: input.body,
        author: 'You',
        at: new Date(),
      };
      setActivitiesByDeal((prev) => ({
        ...prev,
        [dealId]: [activity, ...(prev[dealId] ?? [])],
      }));
    },
    [],
  );

  const addGlobalActivity = useCallback(
    (companyId: string | undefined, contactId: string | undefined, dealId: string | undefined, input: AddActivityInput) => {
      const activity: GlobalActivity = {
        id: makeId(),
        kind: input.kind,
        title: input.title ?? ACTIVITY_LABEL[input.kind],
        body: input.body,
        author: 'You',
        at: new Date(),
        companyId,
        contactId,
        dealId,
      };
      setGlobalActivities((prev) => [activity, ...prev]);
    },
    [],
  );

  const changeStage = useCallback(
    (id: string, stage: DealStage) => {
      const current = deals.find((d) => d.id === id);
      if (!current || current.stage === stage) return;

      const patch: Partial<Deal> = { stage };
      if (stage === 'won') patch.probability = 100;
      if (stage === 'lost') patch.probability = 0;
      if (
        stage !== 'won' &&
        stage !== 'lost' &&
        current.probability === defaultProbabilityFor(current.stage)
      ) {
        patch.probability = defaultProbabilityFor(stage);
      }

      setDeals((prev) => prev.map((d) => (d.id === id ? { ...d, ...patch } : d)));
      addActivity(id, {
        kind: 'note',
        title: 'Stage changed',
        body: `Moved to ${labelFor(stage)}`,
      });
    },
    [deals, addActivity],
  );

  const markWon = useCallback(
    (id: string) => {
      changeStage(id, 'won');
    },
    [changeStage],
  );

  const markLost = useCallback(
    (id: string) => {
      changeStage(id, 'lost');
    },
    [changeStage],
  );

  // Selectors
  const getSelectedDeal = useCallback(
    () => (selectedDealId ? deals.find((d) => d.id === selectedDealId) : undefined),
    [selectedDealId, deals],
  );

  const getActivities = useCallback(
    (dealId: string) => activitiesByDeal[dealId] ?? [],
    [activitiesByDeal],
  );

  const getCompany = useCallback(
    (id: string) => companies.find((c) => c.id === id),
    [companies],
  );

  const getCompanyContacts = useCallback(
    (companyId: string) => contacts.filter((c) => c.companyId === companyId),
    [contacts],
  );

  const getCompanyDeals = useCallback(
    (companyId: string) => deals.filter((d) => d.companyId === companyId),
    [deals],
  );

  const getCompanyRevenue = useCallback(
    (companyId: string) => {
      return deals
        .filter((d) => d.companyId === companyId && d.probability === 100)
        .reduce((sum, d) => sum + d.value, 0);
    },
    [deals],
  );

  const getActivitiesFor = useCallback(
    (entity: { type: 'company' | 'contact' | 'deal'; id: string }) => {
      if (entity.type === 'company') {
        return globalActivities.filter((a) => a.companyId === entity.id);
      } else if (entity.type === 'contact') {
        return globalActivities.filter((a) => a.contactId === entity.id);
      } else {
        return globalActivities.filter((a) => a.dealId === entity.id);
      }
    },
    [globalActivities],
  );

  const value = useMemo<SalesStore>(
    () => ({
      deals,
      companies,
      contacts,
      selectedDealId,
      activitiesByDeal,
      globalActivities,
      getSelectedDeal,
      getActivities,
      getCompanyContacts,
      getCompanyDeals,
      getCompanyRevenue,
      getActivitiesFor,
      getCompany,
      selectDeal,
      updateDeal,
      changeStage,
      addActivity,
      addGlobalActivity,
      markWon,
      markLost,
    }),
    [
      deals,
      companies,
      contacts,
      selectedDealId,
      activitiesByDeal,
      globalActivities,
      getSelectedDeal,
      getActivities,
      getCompanyContacts,
      getCompanyDeals,
      getCompanyRevenue,
      getActivitiesFor,
      getCompany,
      selectDeal,
      updateDeal,
      changeStage,
      addActivity,
      addGlobalActivity,
      markWon,
      markLost,
    ],
  );

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useSalesStore(): SalesStore {
  const ctx = useContext(SalesContext);
  if (!ctx) {
    throw new Error('useSalesStore must be used inside <SalesProvider>');
  }
  return ctx;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function seedActivities(): Record<string, DealActivity[]> {
  const out: Record<string, DealActivity[]> = {};
  for (const [id, list] of Object.entries(SEEDED_ACTIVITIES)) {
    out[id] = [...list];
  }
  return out;
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function labelFor(stage: DealStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
