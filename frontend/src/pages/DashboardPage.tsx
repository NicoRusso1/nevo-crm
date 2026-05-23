import { Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PipelineKanban } from '@/components/sales/PipelineKanban';
import { PipelineStatsBar } from '@/components/sales/PipelineStatsBar';
import { ActionPanel } from '@/components/sales/ActionPanel';
import { DealDrawer } from '@/components/sales/DealDrawer';

/**
 * Sales pipeline — the main operational view of neVo Sales CRM.
 *
 * Layout: pipeline kanban (left, ~60%) + action panel (right). Clicking on
 * a deal card opens the side drawer with full details. All mutations go
 * through `SalesProvider` so the kanban, stats bar and drawer stay in sync.
 */
export function DashboardPage() {
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeading />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,_1.6fr)_360px]">
        {/* Pipeline column */}
        <div className="flex min-h-0 flex-col gap-4">
          <PipelineStatsBar />
          <PipelineKanban />
        </div>

        {/* Action panel — only on xl+, where there's room. */}
        <div className="hidden min-h-0 overflow-y-auto xl:block">
          <ActionPanel />
        </div>
      </div>

      {/* Deal detail drawer — fixed, mounted at top level of the provider. */}
      <DealDrawer />
    </div>
  );
}

function PageHeading() {
  return (
    <div className="flex items-end justify-between">
      <div>
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Pipeline
        </h1>
        <p className="mt-0.5 text-sm text-muted">Your deals, organized by stage.</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Filter className="h-3.5 w-3.5" strokeWidth={1.75} />}
        >
          Filters
        </Button>
        <Button size="sm" leadingIcon={<Plus className="h-4 w-4" strokeWidth={2} />}>
          New deal
        </Button>
      </div>
    </div>
  );
}
