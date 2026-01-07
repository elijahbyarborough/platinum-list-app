import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-500">Error loading companies</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Platinum List Dashboard</h1>
        <div className="flex gap-4">
          <Button onClick={() => navigate('/submit')}>
            Add New Company
          </Button>
          <RefreshPricesButton />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Companies</CardTitle>
        </CardHeader>
        <CardContent>
          <CompaniesTable companies={companies} />
        </CardContent>
      </Card>
    </div>
  );
}

