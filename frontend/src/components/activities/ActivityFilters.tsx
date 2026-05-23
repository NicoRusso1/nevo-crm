import { useMemo } from 'react';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useSalesStore } from '@/components/sales/store';
import { type ActivityKind } from '@/components/sales/mock-data';

interface ActivityFiltersState {
  kind: ActivityKind | null;
  companyId: string | null;
  author: string | null;
}

/**
 * Filter sidebar for activity timeline.
 */
export function ActivityFilters({
  filters,
  onFiltersChange,
}: {
  filters: ActivityFiltersState;
  onFiltersChange: (filters: ActivityFiltersState) => void;
}) {
  const { companies, globalActivities } = useSalesStore();

  // Extract unique authors from activities
  const authors = useMemo(
    () => Array.from(new Set(globalActivities.map((a) => a.author))).sort(),
    [globalActivities],
  );

  return (
    <Card>
      <Card.Body>
        <h3 className="font-semibold text-foreground mb-4">Filters</h3>

        <div className="space-y-4">
          {/* Activity kind filter */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-2">
              Activity Type
            </label>
            <select
              value={filters.kind ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  kind: (e.target.value as ActivityKind) || null,
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground hover:border-line-strong focus:border-accent focus:outline-none"
            >
              <option value="">All activities</option>
              <option value="call">Calls</option>
              <option value="email">Emails</option>
              <option value="meeting">Meetings</option>
              <option value="note">Notes</option>
            </select>
          </div>

          {/* Company filter */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-2">
              Company
            </label>
            <select
              value={filters.companyId ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  companyId: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground hover:border-line-strong focus:border-accent focus:outline-none"
            >
              <option value="">All companies</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Author filter */}
          <div>
            <label className="block text-xs font-semibold text-muted uppercase mb-2">
              Author
            </label>
            <select
              value={filters.author ?? ''}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  author: e.target.value || null,
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-foreground hover:border-line-strong focus:border-accent focus:outline-none"
            >
              <option value="">All authors</option>
              {authors.map((author) => (
                <option key={author} value={author}>
                  {author}
                </option>
              ))}
            </select>
          </div>

          {/* Clear filters button */}
          {(filters.kind || filters.companyId || filters.author) && (
            <button
              onClick={() =>
                onFiltersChange({
                  kind: null,
                  companyId: null,
                  author: null,
                })
              }
              className="w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted hover:text-foreground hover:bg-surface-elevated transition-colors"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
}
