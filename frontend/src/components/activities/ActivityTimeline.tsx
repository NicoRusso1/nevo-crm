import { formatDistanceToNow } from 'date-fns';
import { ACTIVITY_ICONS } from '@/components/sales/mock-data';
import { useSalesStore } from '@/components/sales/store';
import { type GlobalActivity } from '@/types/activity';
import { cn } from '@/lib/cn';

/**
 * Renders a timeline of global activities.
 */
export function ActivityTimeline({ activities }: { activities: readonly GlobalActivity[] }) {
  const { getCompany } = useSalesStore();

  if (activities.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <p className="text-muted">No activities found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity, idx) => {
        const Icon = ACTIVITY_ICONS[activity.kind];
        const company = activity.companyId ? getCompany(activity.companyId) : null;

        return (
          <div key={activity.id} className="relative">
            {/* Timeline line */}
            {idx < activities.length - 1 && (
              <div className="absolute left-5 top-10 h-8 w-0.5 bg-line" />
            )}

            <div className="flex gap-4">
              {/* Icon */}
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-elevated">
                <Icon className="h-4 w-4 text-accent" strokeWidth={1.5} />
              </div>

              {/* Content */}
              <div className="flex-1 rounded-lg border border-line bg-surface-elevated p-3 pt-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{activity.title}</p>
                    {company && <p className="text-xs text-muted">{company.name}</p>}
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDistanceToNow(activity.at, { addSuffix: true })}
                  </span>
                </div>

                {activity.body && <p className="mt-2 text-sm text-muted">{activity.body}</p>}

                <div className="mt-2 text-xs text-muted">By {activity.author}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
