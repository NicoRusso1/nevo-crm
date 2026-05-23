import { useMemo } from 'react';
import { PipelineColumn } from './PipelineColumn';
import { STAGES, type Deal, type DealStage } from './mock-data';
import { useSalesStore } from './store';

/**
 * Pipeline board — horizontally scrollable kanban with one column per stage.
 *
 * Reads `deals` from the sales store so any mutation (stage change, mark
 * won/lost) is reflected immediately in the right column.
 */
export function PipelineKanban() {
  const { deals } = useSalesStore();
  const dealsByStage = useMemo(() => groupByStage(deals), [deals]);

  return (
    <div className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden pb-2">
      {STAGES.map((stage) => (
        <PipelineColumn
          key={stage.key}
          stage={stage.key}
          label={stage.label}
          deals={dealsByStage[stage.key]}
        />
      ))}
    </div>
  );
}

function groupByStage(deals: readonly Deal[]): Record<DealStage, Deal[]> {
  const seed: Record<DealStage, Deal[]> = {
    lead: [],
    contacted: [],
    qualified: [],
    proposal: [],
    won: [],
    lost: [],
  };
  for (const d of deals) {
    seed[d.stage].push(d);
  }
  return seed;
}
