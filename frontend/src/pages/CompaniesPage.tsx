import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/layout/PageHeader';
import { CompaniesTable } from '@/components/companies/CompaniesTable';
import { useSalesStore } from '@/components/sales/store';

/**
 * Companies list page.
 * Shows all companies in a table with key metrics.
 */
export function CompaniesPage() {
  const { companies } = useSalesStore();

  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Companies"
        description="Manage your customer organizations and track engagement."
        actions={
          <Button leadingIcon={<Plus className="h-4 w-4" />} variant="primary">
            New company
          </Button>
        }
      />

      <div className="mt-8">
        <CompaniesTable companies={companies} />
      </div>
    </div>
  );
}
