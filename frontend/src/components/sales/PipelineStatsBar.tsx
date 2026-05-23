import { useMemo } from 'react';
import { compactNumber } from '@/lib/format';
import { DEALS } from './mock-data';

/**
 * Quiet header strip with three sales-relevant numbers. Intentionally low-key
 * — these inform but never compete with the pipeline for attention.
 *
 * Numbers are computed from the same DEALS source so the bar stays in sync
 * with whatever the kanban shows.
 */
export function PipelineStatsBar() {
  const stats = useMemo(() => {
    const inProgress = DEALS.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const won = DEALS.filter((d) => d.stage === 'won').length;
    const lost = DEALS.filter((d) => d.stage === 'lost').length;
    const closed = won + lost;

    return {
      pipelineValue: inProgress.reduce((sum, d) => sum + d.value, 0),
      dealsInProgress: inProgress.length,
      winRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    };
  }, []);

  return (
    <div className="flex items-center gap-8 px-1">
      <Stat label="Total pipeline value" value={`$${compactNumber(stats.pipelineValue)}`} />
      <Divider />
      <Stat label="Deals in progress" value={stats.dealsInProgress.toString()} />
      <Divider />
      <Stat label="Win rate" value={`${stats.winRate}%`} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}

function Divider() {
  return <span className="h-3.5 w-px bg-line" aria-hidden />;
}
