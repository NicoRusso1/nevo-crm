import { useMemo, useState } from 'react';
import { useSalesStore } from '@/components/sales/store';
import { ActivityTimeline } from './ActivityTimeline';
import { ActivityFilters } from './ActivityFilters';
import { type ActivityKind } from '@/components/sales/mock-data';

interface ActivityFiltersState {
  kind: ActivityKind | null;
  companyId: string | null;
  author: string | null;
}

/**
 * Main activity center component orchestrating filters and timeline.
 */
export function ActivityCenter() {
  const { globalActivities } = useSalesStore();
  const [filters, setFilters] = useState<ActivityFiltersState>({
    kind: null,
    companyId: null,
    author: null,
  });

  // Filter activities
  const filtered = useMemo(() => {
    return globalActivities.filter((activity) => {
      if (filters.kind && activity.kind !== filters.kind) return false;
      if (filters.companyId && activity.companyId !== filters.companyId) return false;
      if (filters.author && activity.author !== filters.author) return false;
      return true;
    });
  }, [globalActivities, filters]);

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      {/* Filters sidebar */}
      <div className="sticky top-8 h-fit">
        <ActivityFilters filters={filters} onFiltersChange={setFilters} />
      </div>

      {/* Timeline */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {filtered.length} {filtered.length === 1 ? 'activity' : 'activities'}
          </h2>
        </div>
        <ActivityTimeline activities={filtered} />
      </div>
    </div>
  );
}
