import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import { ACTIVITY_ICONS, type DealActivity } from './mock-data';

interface DealActivityTimelineProps {
  activities: readonly DealActivity[];
}

/**
 * Chronological timeline shown in the drawer. Latest first. Each entry has
 * an icon badge, title, optional body, and a relative timestamp.
 *
 * Empty state nudges the user to log their first interaction.
 */
export function DealActivityTimeline({ activities }: DealActivityTimelineProps) {
  if (activities.length === 0) {
    return (
      <div className="rounded-lg bg-surface-elevated/40 px-4 py-8 text-center">
        <p className="text-sm text-muted">No activity yet.</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Use the quick actions above to log your first interaction.
        </p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-4 pl-6">
      {/* Vertical thread line behind the icons */}
      <span
        className="absolute left-[10px] top-1 bottom-1 w-px bg-line"
        aria-hidden
      />
      {activities.map((activity) => (
        <li key={activity.id} className="relative">
          <TimelineDot kind={activity.kind} />
          <div className="space-y-0.5">
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-sm font-medium text-foreground">{activity.title}</p>
              <time
                className="shrink-0 text-[11px] font-medium tabular-nums text-muted-foreground"
                dateTime={activity.at.toISOString()}
              >
                {relativeTime(activity.at)}
              </time>
            </div>
            {activity.body ? (
              <p className="text-sm leading-relaxed text-muted">{activity.body}</p>
            ) : null}
            <p className="text-[11px] text-muted-foreground">{activity.author}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function TimelineDot({ kind }: { kind: DealActivity['kind'] }) {
  const Icon = ACTIVITY_ICONS[kind];
  return (
    <span
      className={cn(
        'absolute -left-6 top-0.5',
        'flex h-5 w-5 items-center justify-center rounded-full',
        'bg-surface-elevated ring-2 ring-surface',
      )}
    >
      <Icon className="h-3 w-3 text-muted-foreground" strokeWidth={1.75} />
    </span>
  );
}
