import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Settings"
        description="Manage your account, workspace and preferences."
      />

      <Card>
        <Card.Header>
          <div>
            <Card.Title>Profile</Card.Title>
            <Card.Description>
              Your personal information visible to teammates.
            </Card.Description>
          </div>
        </Card.Header>
        <Card.Body className="space-y-5">
          <Field label="Full name">
            <Input placeholder="Nicolas Russo" />
          </Field>
          <Field label="Email">
            <Input type="email" placeholder="nico@nevo.dev" />
          </Field>
          <Field
            label="Bio"
            hint="A short description shown on your profile."
          >
            <Input placeholder="Tell your team a bit about yourself" />
          </Field>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save changes</Button>
        </Card.Footer>
      </Card>

      <Card className="mt-6">
        <Card.Header>
          <div>
            <Card.Title>Workspace</Card.Title>
            <Card.Description>Identity for your team workspace.</Card.Description>
          </div>
        </Card.Header>
        <Card.Body className="space-y-5">
          <Field label="Workspace name">
            <Input placeholder="neVo" />
          </Field>
          <Field label="Slug" hint="Used in URLs. Lowercase letters and dashes only.">
            <Input placeholder="nevo" />
          </Field>
        </Card.Body>
        <Card.Footer>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
          <Button size="sm">Save changes</Button>
        </Card.Footer>
      </Card>
    </div>
  );
}

interface FieldProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function Field({ label, hint, children }: FieldProps) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      {children}
      {hint ? <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span> : null}
    </label>
  );
}
