import { Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/format';
import { useSalesStore } from '@/components/sales/store';
import { STAGES, type DealStage, type Priority } from '@/components/sales/mock-data';
import { cn } from '@/lib/cn';

/**
 * Section showing all deals at a company.
 */
export function CompanyDeals({ companyId }: { companyId: string }) {
  const { getCompanyDeals, selectDeal } = useSalesStore();
  const deals = getCompanyDeals(companyId);

  if (deals.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center gap-3 mb-4">
            <Briefcase className="h-5 w-5 text-muted" />
            <h3 className="font-semibold text-foreground">Deals</h3>
          </div>
          <p className="text-sm text-muted">No deals yet.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center gap-3 mb-4">
          <Briefcase className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Deals ({deals.length})</h3>
        </div>

        <div className="space-y-2">
          {deals.map((deal) => (
            <div
              key={deal.id}
              onClick={() => selectDeal(deal.id)}
              className="group cursor-pointer flex items-center justify-between rounded-lg border border-transparent p-3 hover:bg-surface-elevated hover:border-line transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium text-foreground group-hover:text-accent">{deal.contactName}</p>
                <p className="text-xs text-muted">
                  {formatMoney(deal.value)} · {getProbabilityLabel(deal.probability)}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <StageTag stage={deal.stage} />
                <PriorityTag priority={deal.priority} />
              </div>
            </div>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

function StageTag({ stage }: { stage: DealStage }) {
  const colors: Record<DealStage, string> = {
    lead: 'bg-surface-elevated text-muted',
    contacted: 'bg-surface-elevated text-muted',
    qualified: 'bg-accent/10 text-accent',
    proposal: 'bg-accent/10 text-accent',
    won: 'bg-success/10 text-success',
    lost: 'bg-danger/10 text-danger',
  };

  const label = STAGES.find((s) => s.key === stage)?.label ?? stage;

  return <Badge className={cn('capitalize', colors[stage])}>{label}</Badge>;
}

function PriorityTag({ priority }: { priority: Priority }) {
  const colors: Record<Priority, 'neutral' | 'accent' | 'danger'> = {
    low: 'neutral',
    medium: 'accent',
    high: 'danger',
  };

  return <Badge tone={colors[priority]} className="capitalize">{priority}</Badge>;
}

function getProbabilityLabel(prob: number): string {
  if (prob === 0) return 'Lost';
  if (prob === 100) return 'Won';
  return `${prob}%`;
}
