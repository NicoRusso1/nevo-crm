import { useMemo } from 'react';
import { compactNumber } from '@/lib/format';
import { useSalesStore } from './store';

/**
 * Quiet header strip with three sales-relevant numbers. Computed from the
 * live `deals` state so it stays in sync as deals move between stages.
 */
export function PipelineStatsBar() {
  const { deals } = useSalesStore();

  const stats = useMemo(() => {
    const inProgress = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
    const won = deals.filter((d) => d.stage === 'won').length;
    const lost = deals.filter((d) => d.stage === 'lost').length;
    const closed = won + lost;

    return {
      pipelineValue: inProgress.reduce((sum, d) => sum + d.value, 0),
      dealsInProgress: inProgress.length,
      winRate: closed === 0 ? 0 : Math.round((won / closed) * 100),
    };
  }, [deals]);

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
