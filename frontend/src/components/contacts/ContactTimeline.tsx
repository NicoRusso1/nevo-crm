import { Phone, Mail, Calendar, FileText, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/format';
import type { ContactActivity, ContactActivityKind } from './mock-data';

const ICONS: Record<ContactActivityKind, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
};

const KIND_LABEL: Record<ContactActivityKind, string> = {
  call: 'Call',
  email: 'Email',
  meeting: 'Meeting',
  note: 'Note',
};

const KIND_TONE: Record<ContactActivityKind, string> = {
  call: 'text-accent bg-accent-muted ring-accent/30',
  email: 'text-foreground bg-surface-elevated ring-line-strong',
  meeting: 'text-warning bg-warning/10 ring-warning/30',
  note: 'text-muted-foreground bg-surface-elevated ring-line',
};

interface ContactTimelineProps {
  activities: readonly ContactActivity[];
}

/**
 * Full-history timeline. Latest first. Each entry has a colored icon badge
 * (so a rep can scan for the kind of interaction at a glance) plus the
 * standard title / body / author / time row.
 */
export function ContactTimeline({ activities }: ContactTimelineProps) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>Activity</Card.Title>
          <Card.Description>
            {activities.length === 0
              ? 'No interactions logged yet.'
              : 'Every touchpoint with this contact, newest first.'}
          </Card.Description>
        </div>
        {activities.length > 0 ? (
          <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
            {activities.length}
          </span>
        ) : null}
      </Card.Header>

      <Card.Body className="pt-2">
        {activities.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Log your first interaction from the actions above.
          </p>
        ) : (
          <ol className="relative space-y-5 pl-7">
            {/* Vertical thread */}
            <span
              className="absolute left-3 top-2 bottom-2 w-px bg-line"
              aria-hidden
            />
            {activities.map((activity) => (
              <li key={activity.id} className="relative">
                <TimelineDot kind={activity.kind} />
                <Row activity={activity} />
              </li>
            ))}
          </ol>
        )}
      </Card.Body>
    </Card>
  );
}

function TimelineDot({ kind }: { kind: ContactActivityKind }) {
  const Icon = ICONS[kind];
  return (
    <span
      className={cn(
        'absolute -left-7 top-0',
        'flex h-6 w-6 items-center justify-center rounded-full ring-1',
        KIND_TONE[kind],
      )}
    >
      <Icon className="h-3 w-3" strokeWidth={1.75} />
    </span>
  );
}

function Row({ activity }: { activity: ContactActivity }) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-medium text-foreground">
          <span className="text-muted-foreground">{KIND_LABEL[activity.kind]} · </span>
          {activity.title}
        </p>
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
  );
}
