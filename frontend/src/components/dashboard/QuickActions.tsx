import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

export interface QuickAction {
  icon: LucideIcon;
  label: string;
  description: string;
  onClick?: () => void;
}

interface QuickActionsProps {
  actions: readonly QuickAction[];
  title?: string;
  description?: string;
}

export function QuickActions({
  actions,
  title = 'Quick actions',
  description = 'Jump back in.',
}: QuickActionsProps) {
  return (
    <Card>
      <Card.Header>
        <div>
          <Card.Title>{title}</Card.Title>
          <Card.Description>{description}</Card.Description>
        </div>
      </Card.Header>

      <Card.Body className="space-y-1 pt-2">
        {actions.map((action) => (
          <ActionRow key={action.label} action={action} />
        ))}
      </Card.Body>
    </Card>
  );
}

function ActionRow({ action }: { action: QuickAction }) {
  return (
    <button
      type="button"
      onClick={action.onClick}
      className={cn(
        'group flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left',
        'transition-colors hover:bg-surface-elevated',
        'focus-visible:bg-surface-elevated',
      )}
    >
      <div
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
          'bg-surface-elevated text-muted ring-1 ring-line',
          'group-hover:bg-accent-muted group-hover:text-accent group-hover:ring-accent/30',
          'transition-colors',
        )}
      >
        <action.icon className="h-4 w-4" strokeWidth={1.75} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{action.label}</p>
        <p className="truncate text-xs text-muted-foreground">{action.description}</p>
      </div>
      <ChevronRight
        className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        strokeWidth={1.75}
      />
    </button>
  );
}
