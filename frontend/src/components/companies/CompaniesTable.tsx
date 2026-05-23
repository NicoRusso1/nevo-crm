import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/format';
import { useSalesStore } from '@/components/sales/store';
import { getIndustryColor, getSizeOrder, type Company, type CompanySize } from './mock-data';

/**
 * Table view of all companies showing key metrics.
 * Clickable rows navigate to company detail views.
 */
export function CompaniesTable({ companies }: { companies: readonly Company[] }) {
  const { getCompanyDeals, getCompanyRevenue, getCompanyContacts } = useSalesStore();

  if (companies.length === 0) {
    return (
      <Card>
        <Card.Body>
          <p className="text-center text-muted">No companies yet.</p>
        </Card.Body>
      </Card>
    );
  }

  // Sort by size (Enterprise > Mid > Small) then by name
  const sorted = [...companies].sort((a, b) => {
    const sizeOrder = getSizeOrder(b.size) - getSizeOrder(a.size);
    if (sizeOrder !== 0) return sizeOrder;
    return a.name.localeCompare(b.name);
  });

  return (
    <Card>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-muted uppercase">Industry</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase">Contacts</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase">Active Deals</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase">Won Revenue</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-muted uppercase" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((company) => {
              const deals = getCompanyDeals(company.id);
              const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length;
              const revenue = getCompanyRevenue(company.id);
              const contacts = getCompanyContacts(company.id);

              return (
                <tr
                  key={company.id}
                  className="border-b border-line hover:bg-surface-elevated/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      to={`/companies/${company.id}`}
                      className="group flex items-center gap-2"
                    >
                      <div>
                        <p className="font-medium text-foreground group-hover:text-accent">{company.name}</p>
                        <SizeBadge size={company.size} />
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn('inline-block px-2 py-1 rounded-full text-xs font-medium', getIndustryColor(company.industry))}>
                      {company.industry}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm">{contacts.length}</td>
                  <td className="px-6 py-4 text-right text-sm">
                    <span className={cn(activeDeals > 0 ? 'text-accent font-medium' : 'text-muted')}>
                      {activeDeals}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    {revenue > 0 ? (
                      <span className="flex items-center justify-end gap-1 text-success">
                        <TrendingUp className="h-4 w-4" />
                        {formatMoney(revenue)}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/companies/${company.id}`}>
                      <Button variant="ghost" size="sm" trailing Icon={ArrowRight} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SizeBadge({ size }: { size: CompanySize }) {
  const tones: Record<CompanySize, 'neutral' | 'accent' | 'success'> = {
    Small: 'neutral',
    Mid: 'accent',
    Enterprise: 'success',
  };
  return <Badge tone={tones[size]}>{size}</Badge>;
}
