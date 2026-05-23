import { CheckSquare, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function TasksPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Tasks"
        description="A unified inbox for everything you need to do."
        actions={
          <Button leadingIcon={<Plus className="h-4 w-4" />} size="sm">
            New task
          </Button>
        }
      />

      <Card>
        <Card.Body className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
            <CheckSquare className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-semibold text-foreground">No tasks yet</h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Capture follow-ups, deadlines and reminders here. They'll surface in
            the topbar and on your dashboard.
          </p>
          <Button className="mt-6" leadingIcon={<Plus className="h-4 w-4" />}>
            Add a task
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
