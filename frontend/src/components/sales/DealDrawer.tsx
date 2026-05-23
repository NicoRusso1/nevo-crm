import { useEffect } from 'react';
import { Building2, Mail, User, X, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { DealActivityTimeline } from './DealActivityTimeline';
import { DealQuickActions } from './DealQuickActions';
import {
  STAGES,
  findOwner,
  type Deal,
  type DealStage,
  type Priority,
} from './mock-data';
import { useSalesStore } from './store';

/**
 * Right-side drawer that shows everything about the open deal.
 *
 * Renders nothing when no deal is selected — the markup mounts only on first
 * open, and the panel slides in/out from the right via CSS transform.
 */
export function DealDrawer() {
  const { selectedDealId, selectDeal, getSelectedDeal, getActivities } = useSalesStore();
  const open = selectedDealId !== null;
  const deal = getSelectedDeal();

  // ESC to close.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') selectDeal(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, selectDeal]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={() => selectDeal(null)}
        aria-hidden
        className={cn(
          'fixed inset-0 z-30 bg-background/60 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        )}
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 right-0 z-40 flex w-full max-w-xl flex-col',
          'border-l border-line bg-surface shadow-elevated',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {deal ? <DrawerBody deal={deal} activities={getActivities(deal.id)} /> : null}
      </aside>
    </>
  );
}

// ── Body ───────────────────────────────────────────────────────────────────

interface DrawerBodyProps {
  deal: Deal;
  activities: ReturnType<ReturnType<typeof useSalesStore>['getActivities']>;
}

function DrawerBody({ deal, activities }: DrawerBodyProps) {
  const { updateDeal, changeStage, selectDeal } = useSalesStore();
  const owner = findOwner(deal.ownerId);

  return (
    <>
      <DrawerHeader
        title={deal.company}
        subtitle={deal.contactName}
        onClose={() => selectDeal(null)}
      />

      <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
        {/* Top facts: value + stage + priority */}
        <section className="grid grid-cols-3 gap-3">
          <Fact label="Deal value">
            <span className="text-xl font-semibold tabular-nums text-foreground">
              {formatMoney(deal.value)}
            </span>
          </Fact>
          <Fact label="Stage">
            <StageSelect
              dealId={deal.id}
              value={deal.stage}
              onChange={(s) => changeStage(deal.id, s)}
            />
          </Fact>
          <Fact label="Priority">
            <PriorityChip priority={deal.priority} />
          </Fact>
        </section>

        {/* Probability slider */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor={`prob-${deal.id}`}
              className="text-[11px] font-semibold uppercase tracking-wider text-muted"
            >
              Probability
            </label>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {deal.probability}%
            </span>
          </div>
          <input
            id={`prob-${deal.id}`}
            type="range"
            min={0}
            max={100}
            step={5}
            value={deal.probability}
            onChange={(e) => updateDeal(deal.id, { probability: Number(e.target.value) })}
            className="h-1 w-full cursor-pointer appearance-none rounded-full bg-line accent-accent"
          />
        </section>

        {/* Contact + Owner */}
        <section className="grid grid-cols-2 gap-3">
          <InfoRow icon={Building2} label="Company" value={deal.company} />
          <InfoRow
            icon={Mail}
            label="Contact email"
            value={deal.contactEmail ?? '—'}
            mono
          />
          <InfoRow icon={User} label="Contact" value={deal.contactName} />
          <div className="rounded-lg bg-surface-elevated p-3 ring-1 ring-line">
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Owner
            </p>
            {owner ? (
              <div className="mt-1.5 flex items-center gap-2">
                <Avatar name={owner.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">
                    {owner.name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{owner.email}</p>
                </div>
              </div>
            ) : (
              <p className="mt-1.5 text-sm text-muted">Unassigned</p>
            )}
          </div>
        </section>

        {/* Quick actions */}
        <section>
          <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-muted">
            Quick actions
          </h3>
          <DealQuickActions deal={deal} />
        </section>

        {/* Activity timeline */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted">
              Activity
            </h3>
            {activities.length > 0 ? (
              <span className="text-[11px] font-medium tabular-nums text-muted-foreground">
                {activities.length}
              </span>
            ) : null}
          </div>
          <DealActivityTimeline activities={activities} />
        </section>
      </div>
    </>
  );
}

// ── Pieces ─────────────────────────────────────────────────────────────────

function DrawerHeader({
  title,
  subtitle,
  onClose,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
}) {
  return (
    <header className="flex shrink-0 items-start justify-between gap-3 border-b border-line px-6 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-base font-semibold text-foreground">{title}</p>
        <p className="truncate text-sm text-muted">{subtitle}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'rounded-md p-1.5 text-muted-foreground',
          'hover:bg-surface-elevated hover:text-foreground',
        )}
        aria-label="Close panel"
      >
        <X className="h-4 w-4" />
      </button>
    </header>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-surface-elevated p-3 ring-1 ring-line">
      <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function StageSelect({
  dealId,
  value,
  onChange,
}: {
  dealId: string;
  value: DealStage;
  onChange: (s: DealStage) => void;
}) {
  return (
    <select
      id={`stage-select-${dealId}`}
      value={value}
      onChange={(e) => onChange(e.target.value as DealStage)}
      className={cn(
        'w-full appearance-none rounded-md bg-surface px-2 py-1 text-sm font-medium text-foreground',
        'ring-1 ring-line transition-colors',
        'hover:bg-surface-hover focus:outline-none focus:ring-accent',
        // Tiny custom chevron via inline SVG background.
        'bg-[url("data:image/svg+xml;utf8,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 16 16%27 fill=%27none%27 stroke=%27%239CA3AF%27 stroke-width=%271.5%27><path d=%27m4 6 4 4 4-4%27/></svg>")] bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat pr-7',
      )}
    >
      {STAGES.map((s) => (
        <option key={s.key} value={s.key} className="bg-surface text-foreground">
          {s.label}
        </option>
      ))}
    </select>
  );
}

function PriorityChip({ priority }: { priority: Priority }) {
  const tone = priority === 'high' ? 'danger' : priority === 'medium' ? 'warning' : 'neutral';
  const label = priority.charAt(0).toUpperCase() + priority.slice(1);
  return <Badge tone={tone}>{label}</Badge>;
}

interface InfoRowProps {
  icon: LucideIcon;
  label: string;
  value: string;
  mono?: boolean;
}

function InfoRow({ icon: Icon, label, value, mono }: InfoRowProps) {
  return (
    <div className="rounded-lg bg-surface-elevated p-3 ring-1 ring-line">
      <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" strokeWidth={1.75} />
        {label}
      </p>
      <p
        className={cn(
          'mt-1.5 truncate text-sm text-foreground',
          mono && 'font-mono text-xs',
        )}
      >
        {value}
      </p>
    </div>
  );
}
