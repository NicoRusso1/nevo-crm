import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

/**
 * App shell: fixed sidebar + sticky topbar + scrollable content area.
 * Used as the parent route for every authenticated page.
 */
export function AppLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar />
        <main className="flex-1 px-8 py-8 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
