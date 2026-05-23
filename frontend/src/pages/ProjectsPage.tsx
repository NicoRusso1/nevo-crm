import { FolderKanban, Plus } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export function ProjectsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Projects"
        description="Group work into projects and track progress at a glance."
        actions={
          <Button leadingIcon={<Plus className="h-4 w-4" />} size="sm">
            New project
          </Button>
        }
      />

      <Card>
        <Card.Body className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-elevated">
            <FolderKanban className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
          </div>
          <h2 className="text-base font-semibold text-foreground">No projects yet</h2>
          <p className="mt-1.5 max-w-sm text-sm text-muted">
            Projects help you organize work, set milestones, and bring your team
            together. Create your first one to get started.
          </p>
          <Button className="mt-6" leadingIcon={<Plus className="h-4 w-4" />}>
            Create project
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}
