import { PageHeader } from '@/components/layout/PageHeader';
import { ActivityCenter } from '@/components/activities/ActivityCenter';

/**
 * Global activity center page.
 * Shows unified timeline of all CRM activities with filtering.
 */
export function ActivityCenterPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Activity Center"
        description="Unified view of all activities across companies, contacts, and deals."
      />

      <div className="mt-8">
        <ActivityCenter />
      </div>
    </div>
  );
}
