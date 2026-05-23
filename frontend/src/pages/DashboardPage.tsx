import { Filter, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PipelineKanban } from '@/components/sales/PipelineKanban';
import { PipelineStatsBar } from '@/components/sales/PipelineStatsBar';
import { ActionPanel } from '@/components/sales/ActionPanel';

/**
 * Sales pipeline — the main operational view of neVo Sales CRM.
 *
 * Layout: pipeline kanban (left, ~60%) + action panel (right). The kanban
 * scrolls horizontally inside its column; the action panel stays sticky.
 *
 * No animations, no charts, no marketing widgets — this is the workspace a
 * rep keeps open all day.
 */
export function DashboardPage() {
  return (
    // The shell already adds px-8 py-8. We use a full-height column so the
    // pipeline can take all available vertical space without the page itself
    // scrolling vertically.
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-6">
      {/* Page heading */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            Pipeline
          </h1>
          <p className="mt-0.5 text-sm text-muted">
            Your deals, organized by stage.
          </p>
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

      {/* Pipeline column (60%) + Action panel (40%-ish capped) */}
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,_1.6fr)_360px]">
        {/* Pipeline column */}
        <div className="flex min-h-0 flex-col gap-4">
          <PipelineStatsBar />
          <PipelineKanban />
        </div>

        {/* Action panel — only shown on xl+, where there's room. */}
        <div className="hidden min-h-0 overflow-y-auto xl:block">
          <ActionPanel />
        </div>
      </div>
    </div>
  );
}
