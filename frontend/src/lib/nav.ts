import {
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Settings,
  type LucideIcon,
} from 'lucide-react';

/**
 * Sidebar navigation config. Kept as data (not JSX) so the Sidebar component
 * stays free of business decisions about which sections exist.
 */
export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
}

export const PRIMARY_NAV: readonly NavItem[] = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Projects', to: '/projects', icon: FolderKanban },
  { label: 'Tasks', to: '/tasks', icon: CheckSquare },
  { label: 'Settings', to: '/settings', icon: Settings },
] as const;
