import { useState } from 'react';
import { Phone, FileText, MoveRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { Deal } from './mock-data';
import { useSalesStore } from './store';

interface DealQuickActionsProps {
  deal: Deal;
}

/**
 * Action bar at the top of the drawer. Each button is a one-click mutation
 * on the open deal except "Add note", which opens an inline composer.
 */
export function DealQuickActions({ deal }: DealQuickActionsProps) {
  const { addActivity, markWon, markLost } = useSalesStore();
  const [composing, setComposing] = useState(false);
  const [noteText, setNoteText] = useState('');

  const isClosed = deal.stage === 'won' || deal.stage === 'lost';

  function handleSaveNote() {
    const body = noteText.trim();
    if (!body) return;
    addActivity(deal.id, { kind: 'note', body });
    setNoteText('');
    setComposing(false);
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
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
          leadingIcon={<Phone className="h-3.5 w-3.5" />}
          onClick={() =>
            addActivity(deal.id, {
              kind: 'call',
              body: 'Quick call logged.',
            })
          }
        >
          Log call
        </Button>

        <Button
          variant="secondary"
          size="sm"
          leadingIcon={<MoveRight className="h-3.5 w-3.5" />}
          onClick={() => {
            // Focus the stage select in the drawer body.
            const el = document.getElementById(`stage-select-${deal.id}`);
            if (el instanceof HTMLSelectElement) el.focus();
          }}
        >
          Move stage
        </Button>

        <div className="flex-1" />

        <Button
          variant="outline"
          size="sm"
          leadingIcon={<Check className="h-3.5 w-3.5" />}
          onClick={() => markWon(deal.id)}
          disabled={deal.stage === 'won'}
          className={cn(
            'border-success/30 text-success',
            'hover:bg-success/10',
            deal.stage === 'won' && 'opacity-50',
          )}
        >
          Mark won
        </Button>

        <Button
          variant="outline"
          size="sm"
          leadingIcon={<X className="h-3.5 w-3.5" />}
          onClick={() => markLost(deal.id)}
          disabled={deal.stage === 'lost'}
          className={cn(
            'border-danger/30 text-danger',
            'hover:bg-danger/10',
            deal.stage === 'lost' && 'opacity-50',
          )}
        >
          Mark lost
        </Button>
      </div>

      {composing ? (
        <div className="rounded-lg bg-surface-elevated p-3 ring-1 ring-line">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Write a note about this deal…"
            autoFocus
            rows={3}
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
            <Button size="sm" onClick={handleSaveNote} disabled={!noteText.trim()}>
              Save note
            </Button>
          </div>
        </div>
      ) : null}

      {isClosed ? (
        <p className="text-xs text-muted-foreground">
          This deal is closed. You can still log activities for historical records.
        </p>
      ) : null}
    </div>
  );
}
