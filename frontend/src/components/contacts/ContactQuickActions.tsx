import { useState } from 'react';
import { Phone, FileText, Briefcase, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { AddActivityInput } from './hooks';

interface ContactQuickActionsProps {
  onAction: (input: AddActivityInput) => void;
}

/**
 * Sticky action bar between the header and the content. The four buttons are
 * the most common things a rep does to an open contact — fire and forget.
 *
 * "Add note" is special: it expands an inline composer instead of logging
 * immediately, since notes carry text.
 */
export function ContactQuickActions({ onAction }: ContactQuickActionsProps) {
  const [composing, setComposing] = useState(false);
  const [noteText, setNoteText] = useState('');

  function handleSave() {
    const body = noteText.trim();
    if (!body) return;
    onAction({ kind: 'note', body });
    setNoteText('');
    setComposing(false);
  }

  return (
    <div
      className={cn(
        'rounded-xl bg-surface px-4 py-3 ring-1 ring-line shadow-card',
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          leadingIcon={<Phone className="h-3.5 w-3.5" />}
          onClick={() =>
            onAction({ kind: 'call', body: 'Quick call logged.' })
          }
        >
          Log call
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<FileText className="h-3.5 w-3.5" />}
          onClick={() => setComposing(true)}
          disabled={composing}
        >
          Add note
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<Briefcase className="h-3.5 w-3.5" />}
          onClick={() =>
            onAction({
              kind: 'note',
              title: 'Deal created',
              body: 'New deal drafted from contact panel.',
            })
          }
        >
          Create deal
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<CalendarClock className="h-3.5 w-3.5" />}
          onClick={() =>
            onAction({
              kind: 'meeting',
              body: 'Follow-up scheduled for next week.',
            })
          }
        >
          Schedule follow-up
        </Button>
      </div>

      {composing ? (
        <div className="mt-3 rounded-lg bg-surface-elevated p-3 ring-1 ring-line">
          <textarea
            autoFocus
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a note about this contact…"
            className={cn(
              'w-full resize-none rounded-md bg-transparent text-sm text-foreground',
              'placeholder:text-muted-foreground focus:outline-none',
            )}
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setComposing(false);
                setNoteText('');
              }}
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} disabled={!noteText.trim()}>
              Save note
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
