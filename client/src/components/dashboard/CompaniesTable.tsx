import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Company } from '@/types/company';
import { formatPrice, formatPercentage, formatMultiple, formatDate, formatDateTime } from '@/utils/formatting';

interface CompaniesTableProps {
  companies: Company[];
}

type SortField = 'ticker' | 'company_name' | 'current_stock_price' | 'exit_multiple_5yr' | 'irr_5yr' | 'updated_at' | 'analyst_initials';
type SortDirection = 'asc' | 'desc';

export function CompaniesTable({ companies }: CompaniesTableProps) {
  const navigate = useNavigate();
  const [sortField, setSortField] = useState<SortField>('irr_5yr');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const sortedCompanies = useMemo(() => {
    const sorted = [...companies];

    // Separate companies with valid IRRs from those without
    const withIRR = sorted.filter(c => c.irr_5yr !== null && c.irr_5yr !== undefined);
    const withoutIRR = sorted.filter(c => c.irr_5yr === null || c.irr_5yr === undefined);

    // Sort companies with IRRs
    withIRR.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'irr_5yr':
          aValue = a.irr_5yr ?? -Infinity;
          bValue = b.irr_5yr ?? -Infinity;
          break;
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'company_name':
          aValue = a.company_name;
          bValue = b.company_name;
          break;
        case 'current_stock_price':
          aValue = a.current_stock_price ?? 0;
          bValue = b.current_stock_price ?? 0;
          break;
        case 'exit_multiple_5yr':
          aValue = a.exit_multiple_5yr ?? 0;
          bValue = b.exit_multiple_5yr ?? 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0).getTime();
          bValue = new Date(b.updated_at || 0).getTime();
          break;
        case 'analyst_initials':
          aValue = a.analyst_initials;
          bValue = b.analyst_initials;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    // When sorting by IRR, put companies without IRR at the bottom
    if (sortField === 'irr_5yr') {
      return [...withIRR, ...withoutIRR];
    }

    // Otherwise, sort all companies together
    sorted.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'irr_5yr':
          aValue = a.irr_5yr ?? -Infinity;
          bValue = b.irr_5yr ?? -Infinity;
          break;
        case 'ticker':
          aValue = a.ticker;
          bValue = b.ticker;
          break;
        case 'company_name':
          aValue = a.company_name;
          bValue = b.company_name;
          break;
        case 'current_stock_price':
          aValue = a.current_stock_price ?? 0;
          bValue = b.current_stock_price ?? 0;
          break;
        case 'exit_multiple_5yr':
          aValue = a.exit_multiple_5yr ?? 0;
          bValue = b.exit_multiple_5yr ?? 0;
          break;
        case 'updated_at':
          aValue = new Date(a.updated_at || 0).getTime();
          bValue = new Date(b.updated_at || 0).getTime();
          break;
        case 'analyst_initials':
          aValue = a.analyst_initials;
          bValue = b.analyst_initials;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [companies, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return <span>{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th
              className="border border-gray-300 px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('ticker')}
            >
              Ticker <SortIcon field="ticker" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('company_name')}
            >
              Company Name <SortIcon field="company_name" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('current_stock_price')}
            >
              Current Price <SortIcon field="current_stock_price" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('exit_multiple_5yr')}
            >
              5-Year Exit Multiple <SortIcon field="exit_multiple_5yr" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-right cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('irr_5yr')}
            >
              5-Year Expected Return <SortIcon field="irr_5yr" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('updated_at')}
            >
              Last Updated <SortIcon field="updated_at" />
            </th>
            <th
              className="border border-gray-300 px-4 py-3 text-left cursor-pointer hover:bg-gray-200"
              onClick={() => handleSort('analyst_initials')}
            >
              Analyst <SortIcon field="analyst_initials" />
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCompanies.map((company) => (
            <tr
              key={company.id}
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => navigate(`/edit/${company.ticker}`)}
            >
              <td className="border border-gray-300 px-4 py-3 font-semibold">
                {company.ticker}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                {company.company_name}
              </td>
              <td
                className="border border-gray-300 px-4 py-3 text-right"
                title={company.price_last_updated ? formatDateTime(company.price_last_updated) : 'Never updated'}
              >
                {formatPrice(company.current_stock_price) || '—'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right">
                {formatMultiple(company.exit_multiple_5yr) || '—'}
              </td>
              <td className="border border-gray-300 px-4 py-3 text-right">
                {company.irr_5yr !== null && company.irr_5yr !== undefined ? (
                  formatPercentage(company.irr_5yr)
                ) : (
                  <span
                    title="Needs at least 6 years of estimates for 5-year IRR"
                    className="text-muted-foreground"
                  >
                    —
                  </span>
                )}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                {formatDate(company.updated_at) || '—'}
              </td>
              <td className="border border-gray-300 px-4 py-3">
                {company.analyst_initials}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sortedCompanies.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No companies found. Add your first company to get started.
        </div>
      )}
    </div>
  );
}

