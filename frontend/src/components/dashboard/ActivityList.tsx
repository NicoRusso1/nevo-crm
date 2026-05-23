import { ArrowUpRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/format';

export interface ActivityItem {
  id: string;
  actor: { name: string; avatar?: string | null };
  action: string;
  target: string;
  timestamp: Date;
  /** Optional contextual icon shown next to the timestamp. */
  icon?: LucideIcon;
}

interface ActivityListProps {
  items: readonly ActivityItem[];
  /** Header label. Defaults to "Recent activity". */
  title?: string;
  /** Subtext under the header. */
  description?: string;
}

export function ActivityList({
  items,
  title = 'Recent activity',
  description = "What's happened across your workspace.",
}: ActivityListProps) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </div>
        <Button
          variant="ghost"
          size="sm"
          trailingIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
        >
          View all
        </Button>
      </Card.Header>

      <Card.Body className="pt-2">
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item.id}>
              <ActivityRow item={item} />
            </li>
          ))}
        </ul>
      </Card.Body>
    </Card>
  );
}

function ActivityRow({ item }: { item: ActivityItem }) {
  const Icon = item.icon;
  return (
    <div className="flex items-start gap-3 py-3.5">
      <Avatar
        name={item.actor.name}
        src={item.actor.avatar ?? null}
        size="sm"
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug text-foreground">
          <span className="font-medium">{item.actor.name}</span>
          <span className="text-muted"> {item.action} </span>
          <span className="font-medium">{item.target}</span>
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          {Icon ? <Icon className="h-3 w-3" strokeWidth={1.75} /> : null}
          <time dateTime={item.timestamp.toISOString()}>
            {relativeTime(item.timestamp)}
          </time>
        </p>
      </div>
    </div>
  );
}
