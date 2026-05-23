/**
 * Sales pipeline store.
 *
 * Holds the canonical `deals` list, the per-deal activity log, and the
 * currently-open deal. Everything in the sales view reads/writes through this
 * hook — when the API lands, swap the `useState` calls for SWR/TanStack
 * mutations and the rest of the UI stays untouched.
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

// ── Public API ─────────────────────────────────────────────────────────────

export interface AddActivityInput {
  kind: ActivityKind;
  body?: string;
  /** Override the default title ("Call logged", etc.). */
  title?: string;
}

interface SalesStore {
  // State
  deals: readonly Deal[];
  selectedDealId: string | null;
  activitiesByDeal: Readonly<Record<string, DealActivity[]>>;

  // Selectors
  getSelectedDeal: () => Deal | undefined;
  getActivities: (dealId: string) => readonly DealActivity[];

  // Mutations
  selectDeal: (id: string | null) => void;
  updateDeal: (id: string, patch: Partial<Deal>) => void;
  changeStage: (id: string, stage: DealStage) => void;
  addActivity: (dealId: string, input: AddActivityInput) => void;
  markWon: (id: string) => void;
  markLost: (id: string) => void;
}

const SalesContext = createContext<SalesStore | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function SalesProvider({ children }: { children: ReactNode }) {
  const [deals, setDeals] = useState<readonly Deal[]>(INITIAL_DEALS);
  const [activitiesByDeal, setActivitiesByDeal] = useState<
    Readonly<Record<string, DealActivity[]>>
  >(() => seedActivities());
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

  /**
   * Stage change is its own action because terminal stages need special
   * handling (probability snaps to 100 / 0) and we want an activity log
   * entry to drop into the timeline alongside the data change.
   */
  const changeStage = useCallback(
    (id: string, stage: DealStage) => {
      const current = deals.find((d) => d.id === id);
      if (!current || current.stage === stage) return;

      const patch: Partial<Deal> = { stage };
      if (stage === 'won') patch.probability = 100;
      if (stage === 'lost') patch.probability = 0;
      // For non-terminal moves, only nudge probability if the user is currently
      // sitting on the default for the old stage — preserve manual pins.
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

  // Selectors — receive the latest state automatically via closures.
  const getSelectedDeal = useCallback(
    () => (selectedDealId ? deals.find((d) => d.id === selectedDealId) : undefined),
    [selectedDealId, deals],
  );

  const getActivities = useCallback(
    (dealId: string) => activitiesByDeal[dealId] ?? [],
    [activitiesByDeal],
  );

  const value = useMemo<SalesStore>(
    () => ({
      deals,
      selectedDealId,
      activitiesByDeal,
      getSelectedDeal,
      getActivities,
      selectDeal,
      updateDeal,
      changeStage,
      addActivity,
      markWon,
      markLost,
    }),
    [
      deals,
      selectedDealId,
      activitiesByDeal,
      getSelectedDeal,
      getActivities,
      selectDeal,
      updateDeal,
      changeStage,
      addActivity,
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
  // crypto.randomUUID is supported in all evergreen browsers.
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

function labelFor(stage: DealStage): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
