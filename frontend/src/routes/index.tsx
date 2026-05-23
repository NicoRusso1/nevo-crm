import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { TasksPage } from '@/pages/TasksPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { ContactDetailPage } from '@/pages/ContactDetailPage';

/**
 * Router config. Every authenticated page renders inside `AppLayout` (sidebar
 * + topbar). When auth lands, gate the parent route behind a loader/guard.
 */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      // Default to the demo contact when arriving at /contacts.
      { path: 'contacts', element: <Navigate to="/contacts/c-001" replace /> },
      { path: 'contacts/:contactId', element: <ContactDetailPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'tasks', element: <TasksPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
]);
