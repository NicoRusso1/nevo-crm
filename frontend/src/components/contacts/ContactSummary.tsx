import { Briefcase, DollarSign, Clock, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { formatMoney, relativeTime } from '@/lib/format';

interface ContactSummaryProps {
  totalDeals: number;
  totalRevenue: number;
  lastActivityAt: Date | null;
}

/**
 * Three-stat summary block for the contact.
 *
 * Stacks vertically by default (when used in the right column of the page);
 * the stats themselves are full-row so they read like a CRM summary card,
 * not a dashboard KPI strip.
 */
export function ContactSummary({
  totalDeals,
  totalRevenue,
  lastActivityAt,
}: ContactSummaryProps) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>Summary</Card.Title>
          <Card.Description>Account snapshot.</Card.Description>
        </div>
      </Card.Header>
      <Card.Body className="space-y-3 pt-2">
        <Stat icon={Briefcase} label="Total deals" value={totalDeals.toString()} />
        <Stat icon={DollarSign} label="Won revenue" value={formatMoney(totalRevenue)} />
        <Stat
          icon={Clock}
          label="Last activity"
          value={lastActivityAt ? relativeTime(lastActivityAt) : '—'}
        />
      </Card.Body>
    </Card>
  );
}

interface StatProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function Stat({ icon: Icon, label, value }: StatProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-sm text-muted">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" strokeWidth={1.75} />
        {label}
      </span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
