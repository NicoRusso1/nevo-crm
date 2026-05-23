import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { PRIMARY_NAV } from '@/lib/nav';
import { Avatar } from '@/components/ui/Avatar';
import { ChevronsUpDown } from 'lucide-react';

/**
 * Fixed-width column on the left of the app shell. Renders the logo, the
 * primary navigation, and a compact user card at the bottom.
 */
export function Sidebar() {
  return (
    <aside
      className={cn(
        'flex h-screen w-64 shrink-0 flex-col',
        'border-r border-line bg-surface',
      )}
    >
      <BrandHeader />

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        <ul className="space-y-1">
          {PRIMARY_NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium',
                    'transition-colors duration-150',
                    isActive
                      ? 'bg-accent-muted text-foreground'
                      : 'text-muted hover:bg-surface-elevated hover:text-foreground',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isActive ? 'text-accent' : 'text-muted-foreground',
                      )}
                      strokeWidth={1.75}
                    />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <UserCard />
    </aside>
  );
}

function BrandHeader() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-md bg-accent text-white">
        <span className="text-sm font-bold tracking-tight">N</span>
      </div>
      <span className="text-[15px] font-semibold tracking-tight text-foreground">
        neVo
      </span>
    </div>
  );
}

function UserCard() {
  return (
    <div className="border-t border-line p-3">
      <button
        type="button"
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left',
          'transition-colors hover:bg-surface-elevated',
        )}
      >
        <Avatar name="Nicolas Russo" size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">Nicolas Russo</p>
          <p className="truncate text-xs text-muted-foreground">nico@nevo.dev</p>
        </div>
        <ChevronsUpDown
          className="h-4 w-4 shrink-0 text-muted-foreground"
          strokeWidth={1.75}
        />
      </button>
    </div>
  );
}
