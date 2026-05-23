import { ArrowUpRight, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

const STAT_PLACEHOLDERS = [
  { label: 'Total revenue', value: '—', delta: null },
  { label: 'Active projects', value: '—', delta: null },
  { label: 'Open tasks', value: '—', delta: null },
  { label: 'Completion rate', value: '—', delta: null },
];

export function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Dashboard"
        description="An overview of activity across your workspace."
        actions={
          <>
            <Button variant="ghost" size="sm">
              Last 30 days
            </Button>
            <Button leadingIcon={<Plus className="h-4 w-4" />} size="sm">
              New
            </Button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STAT_PLACEHOLDERS.map((stat) => (
          <Card key={stat.label}>
            <Card.Body className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {stat.label}
              </p>
              <div className="flex items-end justify-between gap-2">
                <p className="text-2xl font-semibold tracking-tight text-foreground">
                  {stat.value}
                </p>
                <Badge tone="neutral">No data</Badge>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>

      {/* Chart placeholder + side card */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <Card.Header>
            <div>
              <Card.Title>Activity</Card.Title>
              <Card.Description>
                Trends across all your projects over the last 30 days.
              </Card.Description>
            </div>
            <Button variant="ghost" size="sm" trailingIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
              View all
            </Button>
          </Card.Header>
          <Card.Body>
            <div className="flex h-64 items-center justify-center rounded-lg bg-surface-elevated/40 text-sm text-muted-foreground">
              Chart placeholder
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Header>
            <div>
              <Card.Title>Recent activity</Card.Title>
              <Card.Description>The latest events in your workspace.</Card.Description>
            </div>
          </Card.Header>
          <Card.Body>
            <ul className="divide-y divide-line">
              {[1, 2, 3, 4].map((i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="h-8 w-8 rounded-full bg-surface-elevated" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-foreground">Placeholder event</p>
                    <p className="text-xs text-muted-foreground">just now</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
}
