import { Mail, Phone, Building2, MapPin, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import type { Contact, ContactStatus } from './mock-data';

interface ContactHeaderProps {
  contact: Contact;
}

const STATUS_LABEL: Record<ContactStatus, string> = {
  lead: 'Lead',
  active: 'Active',
  customer: 'Customer',
};

const STATUS_TONE: Record<ContactStatus, React.ComponentProps<typeof Badge>['tone']> = {
  lead: 'neutral',
  active: 'accent',
  customer: 'success',
};

/**
 * Top header for the contact detail view.
 *
 * Identity-first layout: large avatar + name + status, with a row of
 * scannable metadata (email, phone, company, position) below. No actions
 * here — those live in the QuickActions bar so this header stays an
 * "identity card".
 */
export function ContactHeader({ contact }: ContactHeaderProps) {
  const fullName = `${contact.firstName} ${contact.lastName}`;
  const memberSince = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    year: 'numeric',
  }).format(contact.createdAt);

  return (
    <header
      className={cn(
        'flex flex-col gap-4 rounded-xl bg-surface px-6 py-5',
        'ring-1 ring-line shadow-card',
      )}
    >
      <div className="flex items-start gap-5">
        <Avatar name={fullName} src={contact.avatar ?? null} size="lg" />

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {fullName}
            </h1>
            <Badge tone={STATUS_TONE[contact.status]}>
              {STATUS_LABEL[contact.status]}
            </Badge>
          </div>
          {contact.position ? (
            <p className="text-sm text-muted">
              {contact.position} · {contact.company}
            </p>
          ) : (
            <p className="text-sm text-muted">{contact.company}</p>
          )}
        </div>

        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <p>Customer since</p>
          <p className="mt-0.5 text-foreground">{memberSince}</p>
        </div>
      </div>

      {/* Metadata strip */}
      <dl className="grid grid-cols-1 gap-3 border-t border-line pt-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetaItem icon={Mail} label="Email" value={contact.email} mono />
        <MetaItem
          icon={Phone}
          label="Phone"
          value={contact.phone ?? '—'}
          mono={Boolean(contact.phone)}
        />
        <MetaItem icon={Building2} label="Company" value={contact.company} />
        <MetaItem
          icon={MapPin}
          label="Owner"
          value={contact.owner.name}
          hint={contact.owner.email}
        />
      </dl>
    </header>
  );
}

interface MetaItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  mono?: boolean;
}

function MetaItem({ icon: Icon, label, value, hint, mono }: MetaItemProps) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </dt>
      <dd className="mt-1 min-w-0">
        <p
          className={cn(
            'truncate text-sm text-foreground',
            mono && 'font-mono text-[13px]',
          )}
        >
          {value}
        </p>
        {hint ? <p className="truncate text-xs text-muted-foreground">{hint}</p> : null}
      </dd>
    </div>
  );
}
