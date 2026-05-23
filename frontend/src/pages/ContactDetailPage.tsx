import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ContactHeader } from '@/components/contacts/ContactHeader';
import { ContactQuickActions } from '@/components/contacts/ContactQuickActions';
import { ContactSummary } from '@/components/contacts/ContactSummary';
import { ContactDealsList } from '@/components/contacts/ContactDealsList';
import { ContactTimeline } from '@/components/contacts/ContactTimeline';
import { findContact } from '@/components/contacts/mock-data';
import { useContactState } from '@/components/contacts/hooks';

/**
 * Contact detail — the "sales account" view for a single person.
 *
 * Two-column body: 8/12 left (deals + timeline) + 4/12 right (summary).
 * Quick actions live as a sticky-feeling toolbar between header and content.
 */
export function ContactDetailPage() {
  const { contactId = 'c-001' } = useParams<{ contactId: string }>();
  const contact = findContact(contactId);

  if (!contact) {
    return <NotFound contactId={contactId} />;
  }

  return <ContactDetail contactId={contactId} contact={contact} />;
}

interface ContactDetailProps {
  contactId: string;
  contact: NonNullable<ReturnType<typeof findContact>>;
}

function ContactDetail({ contactId, contact }: ContactDetailProps) {
  const { deals, activities, addActivity, summary, lastActivityAt } =
    useContactState(contactId);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Back link — keeps the rep oriented within the CRM. */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to pipeline
        </Link>
      </div>

      <ContactHeader contact={contact} />

      <ContactQuickActions onAction={addActivity} />

      {/* Body grid: deals + timeline (left) — summary (right) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-8">
          <ContactDealsList deals={deals} />
          <ContactTimeline activities={activities} />
        </div>
        <aside className="space-y-6 lg:col-span-4">
          <ContactSummary
            totalDeals={summary.totalDeals}
            totalRevenue={summary.wonRevenue}
            lastActivityAt={lastActivityAt}
          />
        </aside>
      </div>
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────

function NotFound({ contactId }: { contactId: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-3 py-24 text-center">
      <h1 className="text-xl font-semibold text-foreground">Contact not found</h1>
      <p className="text-sm text-muted">
        We couldn't find a contact with the id{' '}
        <code className="rounded bg-surface-elevated px-1.5 py-0.5 font-mono text-xs">
          {contactId}
        </code>
        .
      </p>
      <Link to="/">
        <Button variant="secondary" size="sm" leadingIcon={<ArrowLeft className="h-3.5 w-3.5" />}>
          Back to pipeline
        </Button>
      </Link>
    </div>
  );
}
