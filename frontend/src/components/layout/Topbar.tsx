import { Bell, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';

/**
 * Sticky top bar inside the main column. Holds the global search and any
 * shell-level controls (notifications, quick actions, profile menu).
 */
export function Topbar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/80 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-4 px-8">
        <div className="flex-1 max-w-md">
          <Input
            placeholder="Search…"
            leadingIcon={<Search className="h-4 w-4" strokeWidth={1.75} />}
            trailingIcon={
              <kbd className="hidden h-5 select-none items-center gap-1 rounded border border-line-strong bg-surface px-1.5 font-mono text-[10px] text-muted-foreground sm:inline-flex">
                ⌘K
              </kbd>
            }
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-surface-elevated hover:text-foreground transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" strokeWidth={1.75} />
            <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-accent" />
          </button>
        </div>
      </div>
    </header>
  );
}
