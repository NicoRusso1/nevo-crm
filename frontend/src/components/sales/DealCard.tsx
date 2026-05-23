import { MoreHorizontal, Mail, Phone, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import type { Deal, Priority } from './mock-data';
import { useSalesStore } from './store';

interface DealCardProps {
  deal: Deal;
}

const PRIORITY_LABEL: Record<Priority, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const PRIORITY_DOT: Record<Priority, string> = {
  high: 'bg-danger',
  medium: 'bg-warning',
  low: 'bg-muted-foreground',
};

const PRIORITY_TEXT: Record<Priority, string> = {
  high: 'text-danger',
  medium: 'text-warning',
  low: 'text-muted-foreground',
};

/**
 * Single deal card in the pipeline kanban.
 *
 * Clicking anywhere on the card opens the drawer for that deal. Inner
 * buttons (more menu, quick actions) stop propagation so they don't trigger
 * the parent click.
 */
export function DealCard({ deal }: DealCardProps) {
  const { selectDeal, selectedDealId } = useSalesStore();
  const isSelected = selectedDealId === deal.id;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => selectDeal(deal.id)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectDeal(deal.id);
        }
      }}
      className={cn(
        'group relative cursor-pointer rounded-lg bg-surface-elevated p-3 text-left',
        'ring-1 ring-line transition-all duration-150',
        'hover:ring-line-strong hover:bg-surface-hover',
        'focus-visible:ring-accent',
        isSelected && 'ring-accent ring-1',
      )}
      aria-pressed={isSelected}
    >
      {/* Header: contact + menu */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {deal.contactName}
          </p>
          <p className="truncate text-xs text-muted-foreground">{deal.company}</p>
        </div>
        <button
          type="button"
          className={cn(
            'rounded p-1 text-muted-foreground opacity-0 transition-opacity',
            'hover:bg-surface group-hover:opacity-100 focus-visible:opacity-100',
          )}
          aria-label="Deal options"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreHorizontal className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Value */}
      <p className="mt-2.5 text-base font-semibold tabular-nums text-foreground">
        {formatMoney(deal.value)}
      </p>

      {/* Footer: avatar + priority + quick actions */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Avatar name={deal.contactName} src={deal.avatar ?? null} size="sm" />
          <span className="flex items-center gap-1.5">
            <span className={cn('h-1.5 w-1.5 rounded-full', PRIORITY_DOT[deal.priority])} />
            <span className={cn('text-[11px] font-medium', PRIORITY_TEXT[deal.priority])}>
              {PRIORITY_LABEL[deal.priority]}
            </span>
          </span>
        </div>

        <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <QuickAction icon={Phone} label="Call" />
          <QuickAction icon={Mail} label="Email" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'rounded p-1.5 text-muted-foreground',
        'hover:bg-surface hover:text-foreground',
      )}
      aria-label={label}
    >
      <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
    </button>
  );
}
