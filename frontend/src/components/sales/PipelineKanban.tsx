import { useMemo } from 'react';
import { PipelineColumn } from './PipelineColumn';
import { DEALS, STAGES, type Deal, type DealStage } from './mock-data';

/**
 * Pipeline board — horizontally scrollable kanban with one column per stage.
 *
 * Memoizes the per-stage grouping so re-renders (from hover state changes in
 * children, etc.) don't re-iterate the deal list.
 */
export function PipelineKanban() {
  const dealsByStage = useMemo(() => groupByStage(DEALS), []);

  return (
    <div
      className="
        flex flex-1 gap-3 overflow-x-auto overflow-y-hidden
        pb-2
      "
    >
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
