import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CompaniesTable } from '@/components/dashboard/CompaniesTable';
import { RefreshPricesButton } from '@/components/dashboard/RefreshPricesButton';
import { api } from '@/utils/api';

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: companies = [], isLoading, error } = useQuery({
    queryKey: ['companies'],
    queryFn: api.getCompanies,
  });

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground text-sm">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <div className="text-center p-8 rounded-lg bg-card border border-destructive/20">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-destructive mb-2">Error Loading Data</h3>
          <p className="text-muted-foreground text-sm">Unable to fetch companies. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-pattern">
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight mb-1">Platinum List | IRR Tracker</h1>
            <p className="text-muted-foreground">Tracking forward return estimates.</p>
          </div>
          <RefreshPricesButton />
        </div>

        {/* Table Section */}
        <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
          <div className="px-6 py-4 border-b border-border/50">
            <div>
              <h2 className="text-lg font-semibold">Companies</h2>
            </div>
          </div>
          <CompaniesTable companies={companies} />
        </div>
      </div>
    </div>
  );
}
