import { TrendingUp, Link as LinkIcon, Briefcase } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/format';
import { useSalesStore } from '@/components/sales/store';
import { getIndustryColor, getSizeOrder, type Company, type CompanySize } from './mock-data';
import { cn } from '@/lib/cn';

/**
 * Company header card showing name, industry, size, revenue, and quick stats.
 */
export function CompanyCard({ company }: { company: Company }) {
  const { getCompanyDeals, getCompanyRevenue, getCompanyContacts } = useSalesStore();

  const deals = getCompanyDeals(company.id);
  const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length;
  const revenue = getCompanyRevenue(company.id);
  const contacts = getCompanyContacts(company.id);

  return (
    <Card>
      <Card.Body>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{company.name}</h1>
            <p className="mt-1 text-muted">{company.industry}</p>
          </div>
          <SizeBadge size={company.size} />
        </div>

        {/* Quick stats grid */}
        <div className="grid grid-cols-3 gap-4 py-4 border-t border-b border-line">
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Contacts</p>
            <p className="mt-1 text-lg font-semibold text-foreground">{contacts.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Active Deals</p>
            <p className="mt-1 text-lg font-semibold text-accent">{activeDeals}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-muted uppercase">Won Revenue</p>
            <div className="mt-1 flex items-center gap-1">
              {revenue > 0 ? (
                <>
                  <TrendingUp className="h-4 w-4 text-success" />
                  <span className="text-lg font-semibold text-success">{formatMoney(revenue)}</span>
                </>
              ) : (
                <span className="text-lg font-semibold text-muted">—</span>
              )}
            </div>
          </div>
        </div>

        {/* Website & details */}
        {company.website && (
          <div className="mt-6 flex items-center gap-2">
            <LinkIcon className="h-4 w-4 text-muted" />
            <a
              href={`https://${company.website}`}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-accent hover:underline"
            >
              {company.website}
            </a>
          </div>
        )}
      </Card.Body>
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
