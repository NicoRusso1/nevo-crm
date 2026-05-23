import { Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { compactNumber } from '@/lib/format';
import { DealCard } from './DealCard';
import type { Deal, DealStage } from './mock-data';

interface PipelineColumnProps {
  stage: DealStage;
  label: string;
  deals: readonly Deal[];
}

/**
 * Visual accent per stage. Kept very subtle — a 2px top border on the
 * column header in the stage's tone, nothing more. Pipedrive-style.
 */
const STAGE_ACCENT: Record<DealStage, string> = {
  lead: 'bg-muted-foreground',
  contacted: 'bg-sky-400/70',
  qualified: 'bg-violet-400/70',
  proposal: 'bg-amber-400/70',
  won: 'bg-success',
  lost: 'bg-danger',
};

export function PipelineColumn({ stage, label, deals }: PipelineColumnProps) {
  const total = deals.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="flex h-full w-[260px] shrink-0 flex-col">
      {/* Column header */}
      <div className="px-1 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn('h-1.5 w-1.5 rounded-full', STAGE_ACCENT[stage])} />
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              {label}
            </h3>
            <span className="text-[11px] font-medium text-muted-foreground tabular-nums">
              {deals.length}
            </span>
          </div>
          <span className="text-xs font-medium text-muted-foreground tabular-nums">
            ${compactNumber(total)}
          </span>
        </div>
      </div>

      {/* Cards (scrollable when tall) */}
      <div className="flex-1 space-y-2 overflow-y-auto pr-1">
        {deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} />
        ))}

        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium',
            'text-muted-foreground transition-colors',
            'hover:bg-surface-elevated hover:text-foreground',
            'ring-1 ring-line ring-dashed',
          )}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          Add deal
        </button>
      </div>
    </div>
  );
}
