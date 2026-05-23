import { Link } from 'react-router-dom';
import { Mail, Phone, Users } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useSalesStore } from '@/components/sales/store';
import { type Contact } from '@/components/contacts/mock-data';
import { cn } from '@/lib/cn';

/**
 * Section showing all contacts at a company.
 */
export function CompanyContacts({ companyId }: { companyId: string }) {
  const { getCompanyContacts } = useSalesStore();
  const contacts = getCompanyContacts(companyId);

  if (contacts.length === 0) {
    return (
      <Card>
        <Card.Body>
          <div className="flex items-center gap-3 mb-4">
            <Users className="h-5 w-5 text-muted" />
            <h3 className="font-semibold text-foreground">Contacts</h3>
          </div>
          <p className="text-sm text-muted">No contacts yet.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card>
      <Card.Body>
        <div className="flex items-center gap-3 mb-4">
          <Users className="h-5 w-5 text-accent" />
          <h3 className="font-semibold text-foreground">Contacts ({contacts.length})</h3>
        </div>

        <div className="space-y-3">
          {contacts.map((contact) => (
            <ContactRow key={contact.id} contact={contact} />
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

function ContactRow({ contact }: { contact: Contact }) {
  const statusTones: Record<typeof contact.status, 'neutral' | 'accent' | 'success'> = {
    lead: 'neutral',
    active: 'accent',
    customer: 'success',
  };

  return (
    <Link
      to={`/contacts/${contact.id}`}
      className="group flex items-center justify-between rounded-lg border border-transparent p-3 hover:bg-surface-elevated hover:border-line transition-colors"
    >
      <div className="flex-1">
        <p className="font-medium text-foreground group-hover:text-accent">
          {contact.firstName} {contact.lastName}
        </p>
        {contact.position && <p className="text-xs text-muted">{contact.position}</p>}
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-4 text-xs text-muted">
          {contact.email && (
            <a
              href={`mailto:${contact.email}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Mail className="h-3 w-3" />
              <span>{contact.email}</span>
            </a>
          )}
          {contact.phone && (
            <a
              href={`tel:${contact.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 hover:text-foreground"
            >
              <Phone className="h-3 w-3" />
              <span>{contact.phone}</span>
            </a>
          )}
        </div>

        <Badge tone={statusTones[contact.status]} className="capitalize">
          {contact.status}
        </Badge>
      </div>
    </Link>
  );
}
