import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { EstimatesTable } from '@/components/submission/EstimatesTable';
import { api } from '@/utils/api';
import { CompanyFormData, MetricType, AnalystInitials } from '@/types/company';

// Fetch company name from ticker via API
const fetchCompanyName = async (ticker: string): Promise<string | null> => {
  try {
    // This would call the backend API in production
    // For now, we'll fetch it from the API service
    const response = await fetch(`http://localhost:3001/api/companies/${ticker}/refresh-price`);
    if (response.ok) {
      const data = await response.json();
      return data.company_name || null;
    }
    return null;
  } catch {
    return null;
  }
};

export default function SubmissionForm() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const queryClient = useQueryClient();
  const [loadingCompanyName, setLoadingCompanyName] = useState(false);

  const [formData, setFormData] = useState<CompanyFormData>({
    ticker: ticker?.toUpperCase() || '',
    company_name: '',
    fiscal_year_end_date: '',
    metric_type: 'EPS',
    analyst_initials: 'EY',
    exit_multiple_5yr: null,
    metrics: Array(11).fill(null),
    dividends: Array(11).fill(null),
  });

  // Load existing company data if editing
  const { data: existingCompany } = useQuery({
    queryKey: ['company', ticker],
    queryFn: () => api.getCompany(ticker!),
    enabled: !!ticker,
  });

  useEffect(() => {
    if (existingCompany) {
      // Convert fy1-fy11 format to arrays
      const metrics: (number | null)[] = [];
      const dividends: (number | null)[] = [];

      for (let i = 1; i <= 11; i++) {
        metrics.push(existingCompany[`fy${i}_metric` as keyof typeof existingCompany] as number | null);
        dividends.push(existingCompany[`fy${i}_div` as keyof typeof existingCompany] as number | null);
      }

      setFormData({
        ticker: existingCompany.ticker,
        company_name: existingCompany.company_name,
        fiscal_year_end_date: existingCompany.fiscal_year_end_date,
        metric_type: existingCompany.metric_type,
        analyst_initials: existingCompany.analyst_initials,
        exit_multiple_5yr: existingCompany.exit_multiple_5yr || null,
        metrics,
        dividends,
      });
    }
  }, [existingCompany]);

  // Fetch company name when ticker changes
  useEffect(() => {
    if (formData.ticker && formData.ticker.length >= 1 && !formData.company_name) {
      const timer = setTimeout(async () => {
        setLoadingCompanyName(true);
        const name = await fetchCompanyName(formData.ticker);
        if (name) {
          setFormData((prev) => ({ ...prev, company_name: name }));
        }
        setLoadingCompanyName(false);
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [formData.ticker]);

  const createCompanyMutation = useMutation({
    mutationFn: api.createCompany,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      navigate('/dashboard');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.ticker || !formData.company_name || !formData.fiscal_year_end_date) {
      alert('Please fill in all required fields');
      return;
    }

    createCompanyMutation.mutate(formData);
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>{ticker ? 'Edit Company' : 'Add New Company'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker *</Label>
                <Input
                  id="ticker"
                  value={formData.ticker}
                  onChange={(e) => setFormData({ ...formData, ticker: e.target.value.toUpperCase() })}
                  required
                  disabled={!!ticker}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                  disabled={loadingCompanyName}
                />
                {loadingCompanyName && <p className="text-xs text-muted-foreground">Fetching...</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscal_year_end_date">Fiscal Year End Date *</Label>
                <Input
                  id="fiscal_year_end_date"
                  type="date"
                  value={formData.fiscal_year_end_date}
                  onChange={(e) => setFormData({ ...formData, fiscal_year_end_date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="metric_type">Metric Type *</Label>
                <Select
                  id="metric_type"
                  value={formData.metric_type}
                  onChange={(e) => setFormData({ ...formData, metric_type: e.target.value as MetricType })}
                  required
                >
                  <option value="EPS">EPS</option>
                  <option value="FCFPS">FCFPS</option>
                  <option value="Distributable Earnings">Distributable Earnings</option>
                  <option value="P/B">P/B</option>
                  <option value="P/NAV">P/NAV</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="analyst_initials">Analyst *</Label>
                <Select
                  id="analyst_initials"
                  value={formData.analyst_initials}
                  onChange={(e) => setFormData({ ...formData, analyst_initials: e.target.value as AnalystInitials })}
                  required
                >
                  <option value="EY">EY</option>
                  <option value="TR">TR</option>
                  <option value="JM">JM</option>
                  <option value="BB">BB</option>
                  <option value="NM">NM</option>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="exit_multiple_5yr">5-Year Exit Multiple</Label>
                <Input
                  id="exit_multiple_5yr"
                  type="number"
                  step="0.1"
                  value={formData.exit_multiple_5yr === null ? '' : formData.exit_multiple_5yr}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      exit_multiple_5yr: e.target.value === '' ? null : parseFloat(e.target.value),
                    })
                  }
                  placeholder="e.g., 15.5"
                />
              </div>
            </div>

            <div className="space-y-4">
              <Label>Estimates (paste from Excel)</Label>
              <EstimatesTable
                fiscalYearEndDate={formData.fiscal_year_end_date}
                metrics={formData.metrics}
                dividends={formData.dividends}
                onMetricsChange={(metrics) => setFormData({ ...formData, metrics })}
                onDividendsChange={(dividends) => setFormData({ ...formData, dividends })}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createCompanyMutation.isPending}>
                {createCompanyMutation.isPending ? 'Saving...' : 'Save Company'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

