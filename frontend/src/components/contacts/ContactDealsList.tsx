import { ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import type { ContactDeal, ContactDealStatus } from './mock-data';

interface ContactDealsListProps {
  deals: readonly ContactDeal[];
}

const STATUS_LABEL: Record<ContactDealStatus, string> = {
  open: 'Open',
  won: 'Won',
  lost: 'Lost',
};

const STATUS_TONE: Record<ContactDealStatus, React.ComponentProps<typeof Badge>['tone']> = {
  open: 'accent',
  won: 'success',
  lost: 'danger',
};

/**
 * Deals associated with the contact. Renders as a tight list (not a heavy
 * data table) — sales reps scan ~10 entries; full table comes from the deals
 * page.
 */
export function ContactDealsList({ deals }: ContactDealsListProps) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>Related deals</Card.Title>
          <Card.Description>
            {deals.length === 0
              ? 'No deals on file.'
              : `${deals.length} deal${deals.length === 1 ? '' : 's'} linked to this contact.`}
          </Card.Description>
        </div>
        <Button
          variant="ghost"
          size="sm"
          trailingIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
        >
          View all
        </Button>
      </Card.Header>

      <Card.Body className="pt-2">
        {deals.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No deals linked yet.
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {deals.map((deal) => (
              <li key={deal.id}>
                <DealRow deal={deal} />
              </li>
            ))}
          </ul>
        )}
      </Card.Body>
    </Card>
  );
}

function DealRow({ deal }: { deal: ContactDeal }) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center justify-between gap-4 py-3 text-left',
        'transition-colors hover:bg-surface-elevated/40 rounded',
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{deal.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {stageLabel(deal.stage)} · {deal.probability}%
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold tabular-nums text-foreground">
          {formatMoney(deal.value)}
        </span>
        <Badge tone={STATUS_TONE[deal.status]}>{STATUS_LABEL[deal.status]}</Badge>
      </div>
    </button>
  );
}

function stageLabel(stage: string): string {
  return stage.charAt(0).toUpperCase() + stage.slice(1);
}
