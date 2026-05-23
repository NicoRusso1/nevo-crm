import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface DeltaProps {
  /** Percent change as a signed number, e.g. `12.5` or `-3.2`. */
  value: number;
  /** Optional label appended after the percentage: "vs last week". */
  period?: string;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  delta?: DeltaProps;
  icon?: LucideIcon;
}

/**
 * KPI card: label + big value + optional delta indicator + optional icon.
 *
 * Visuals follow the Stripe pattern — the value is the loudest element, the
 * delta is small and color-coded, and the icon sits in a quiet badge on the
 * right rather than competing for attention.
 */
export function MetricCard({ label, value, delta, icon: Icon }: MetricCardProps) {
  const isPositive = delta ? delta.value >= 0 : true;
  const DeltaIcon = isPositive ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="transition-colors hover:bg-surface-elevated/40">
      <Card.Body className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          {Icon ? (
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
              <Icon className="h-4 w-4 text-muted-foreground" strokeWidth={1.75} />
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-3xl font-semibold tracking-tight text-foreground tabular-nums">
            {value}
          </p>

          {delta ? (
            <div className="flex items-center gap-1.5 text-xs">
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 font-medium tabular-nums',
                  isPositive ? 'text-success' : 'text-danger',
                )}
              >
                <DeltaIcon className="h-3 w-3" strokeWidth={2} />
                {Math.abs(delta.value).toFixed(1)}%
              </span>
              {delta.period ? (
                <span className="text-muted-foreground">{delta.period}</span>
              ) : null}
            </div>
          ) : null}
        </div>
      </Card.Body>
    </Card>
  );
}
