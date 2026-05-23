import { Phone, AlertCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import {
  ACTIVITY_ICONS,
  FOLLOW_UPS,
  NEXT_ACTIVITIES,
  TODAYS_CALLS,
  type DueCall,
  type FollowUp,
  type ScheduledActivity,
} from './mock-data';

/**
 * Right-hand "today" panel — the rep's worklist for the current shift.
 *
 * Three stacked sections; each is dense, scannable, action-oriented. Avoid
 * decoration: the panel exists to make the next click obvious.
 */
export function ActionPanel() {
  return (
    <aside className="flex w-full flex-col gap-5">
      <Section title="Next Activities" count={NEXT_ACTIVITIES.length}>
        <ul className="space-y-1">
          {NEXT_ACTIVITIES.map((a) => (
            <li key={a.id}>
              <ActivityRow activity={a} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Today's Calls" count={TODAYS_CALLS.length}>
        <ul className="space-y-1">
          {TODAYS_CALLS.map((c) => (
            <li key={c.id}>
              <CallRow call={c} />
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Follow-ups due" count={FOLLOW_UPS.length} accent="danger">
        <ul className="space-y-1">
          {FOLLOW_UPS.map((f) => (
            <li key={f.id}>
              <FollowUpRow followUp={f} />
            </li>
          ))}
        </ul>
      </Section>
    </aside>
  );
}

// ── Section wrapper ────────────────────────────────────────────────────────

interface SectionProps {
  title: string;
  count: number;
  accent?: 'default' | 'danger';
  children: React.ReactNode;
}

function Section({ title, count, accent = 'default', children }: SectionProps) {
  return (
    <section>
      <header className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          {title}
        </h3>
        <span
          className={cn(
            'text-[11px] font-medium tabular-nums',
            accent === 'danger' ? 'text-danger' : 'text-muted-foreground',
          )}
        >
          {count}
        </span>
      </header>
      {children}
    </section>
  );
}

// ── Row primitive (icon | text block | trailing time) ──────────────────────

interface RowProps {
  icon: LucideIcon;
  iconTone?: 'default' | 'danger';
  title: string;
  subtitle: string;
  trailing: { text: string; tone: 'default' | 'danger' };
}

function Row({ icon: Icon, iconTone = 'default', title, subtitle, trailing }: RowProps) {
  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
        'transition-colors hover:bg-surface-elevated',
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 shrink-0 items-center justify-center rounded-md ring-1',
          iconTone === 'danger'
            ? 'bg-danger/10 text-danger ring-danger/20'
            : 'bg-surface-elevated text-muted-foreground ring-line',
        )}
      >
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <span
        className={cn(
          'shrink-0 text-[11px] font-medium tabular-nums',
          trailing.tone === 'danger' ? 'text-danger' : 'text-muted-foreground',
        )}
      >
        {trailing.text}
      </span>
    </button>
  );
}

// ── Specialized rows ───────────────────────────────────────────────────────

function ActivityRow({ activity }: { activity: ScheduledActivity }) {
  return (
    <Row
      icon={ACTIVITY_ICONS[activity.kind]}
      title={activity.title}
      subtitle={activity.subtitle}
      trailing={{ text: relativeTime(activity.time), tone: 'default' }}
    />
  );
}

function CallRow({ call }: { call: DueCall }) {
  return (
    <Row
      icon={Phone}
      title={call.contactName}
      subtitle={call.company}
      trailing={{ text: relativeTime(call.time), tone: 'default' }}
    />
  );
}

function FollowUpRow({ followUp }: { followUp: FollowUp }) {
  return (
    <Row
      icon={AlertCircle}
      iconTone="danger"
      title={followUp.contactName}
      subtitle={followUp.company}
      trailing={{ text: relativeTime(followUp.due), tone: 'danger' }}
    />
  );
}
