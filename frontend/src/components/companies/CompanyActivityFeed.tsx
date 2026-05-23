import { Activity } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useSalesStore } from '@/components/sales/store';
import { ACTIVITY_ICONS } from '@/components/sales/mock-data';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/cn';

/**
 * Activity timeline for a company showing all linked activities.
 */
export function CompanyActivityFeed({ companyId }: { companyId: string }) {
  const { getActivitiesFor } = useSalesStore();
  const activities = getActivitiesFor({ type: 'company', id: companyId });

  if (activities.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center gap-3 mb-4">
            <Activity className="h-5 w-5 text-muted" />
            <h3 className="font-semibold text-foreground">Activity</h3>
          </div>
          <p className="text-sm text-muted">No activities yet.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center gap-3 mb-6">
          <Activity className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Activity ({activities.length})</h3>
        </div>

        <div className="space-y-4">
          {activities.map((activity, idx) => {
            const Icon = ACTIVITY_ICONS[activity.kind];
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
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-foreground">{activity.title}</p>
                    {activity.body && <p className="mt-1 text-sm text-muted">{activity.body}</p>}
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                      <span>{activity.author}</span>
                      <span>·</span>
                      <span>{formatDistanceToNow(activity.at, { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card.Body>
    </Card>
  );
}
