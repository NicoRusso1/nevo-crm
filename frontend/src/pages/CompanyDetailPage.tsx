import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useSalesStore } from '@/components/sales/store';
import { CompanyCard } from '@/components/companies/CompanyCard';
import { CompanyContacts } from '@/components/companies/CompanyContacts';
import { CompanyDeals } from '@/components/companies/CompanyDeals';
import { CompanyActivityFeed } from '@/components/companies/CompanyActivityFeed';

/**
 * Company detail page showing all information and related entities.
 * Layout: header (full width) + three-column grid (contacts, deals, activities).
 */
export function CompanyDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { getCompany } = useSalesStore();

  if (!companyId) {
    return <NotFound message="Company ID not found" />;
  }

  const company = getCompany(companyId);
  if (!company) {
    return <NotFound message="Company not found" />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      {/* Back button */}
      <button
        onClick={() => navigate('/companies')}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to companies
      </button>

      {/* Header card */}
      <div className="mb-8">
        <CompanyCard company={company} />
      </div>

      {/* Three-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        <CompanyContacts companyId={company.id} />
        <CompanyDeals companyId={company.id} />
        <CompanyActivityFeed companyId={company.id} />
      </div>
    </div>
  );
}

function NotFound({ message }: { message: string }) {
  const navigate = useNavigate();
  return (
    <div className="mx-auto max-w-7xl">
      <button
        onClick={() => navigate('/companies')}
        className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to companies
      </button>
      <div className="rounded-lg border border-line bg-surface p-8 text-center">
        <p className="text-muted">{message}</p>
      </div>
    </div>
  );
}
