import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { EstimatesTable } from '@/components/submission/EstimatesTable';
import { TickerAutocomplete } from '@/components/submission/TickerAutocomplete';
import { FiscalYearPicker } from '@/components/submission/FiscalYearPicker';
import { IRRPreview } from '@/components/submission/IRRPreview';
import { api } from '@/utils/api';
import { CompanyFormData, MetricType, AnalystInitials } from '@/types/company';
import { formatPrice, formatDateTime } from '@/utils/formatting';

export default function SubmissionForm() {
  const navigate = useNavigate();
  const { ticker } = useParams();
  const queryClient = useQueryClient();
  const [stockPrice, setStockPrice] = useState<number | null>(null);
  const [priceLastUpdated, setPriceLastUpdated] = useState<string | null>(null);
  const [refreshingPrice, setRefreshingPrice] = useState(false);

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

      // Set stock price from existing company
      setStockPrice(existingCompany.current_stock_price);
      setPriceLastUpdated(existingCompany.price_last_updated);
    }
  }, [existingCompany]);

  const handleTickerSelect = async (selectedTicker: string, companyName: string) => {
    const normalizedTicker = selectedTicker.toUpperCase();
    setFormData((prev) => ({
      ...prev,
      ticker: normalizedTicker,
      company_name: companyName,
    }));
    
    // Clear fiscal year end date first so it will update
    setFormData((prev) => ({
      ...prev,
      fiscal_year_end_date: '',
    }));
    
    // Fetch stock price and fiscal year end for the selected ticker
    await refreshStockPrice(normalizedTicker);
  };

  const refreshStockPrice = async (tickerToRefresh?: string) => {
    const tickerSymbol = tickerToRefresh || formData.ticker;
    if (!tickerSymbol) return;

    setRefreshingPrice(true);
    try {
      // Use the quote endpoint which doesn't require the company to exist
      const response = await fetch(`/api/companies/${tickerSymbol}/quote`);
      if (response.ok) {
        const data = await response.json();
        if (data.price !== null) {
          setStockPrice(data.price);
          setPriceLastUpdated(new Date().toISOString());
        }
        // Auto-populate fiscal year end if available
        if (data.fiscalYearEnd) {
          setFormData((prev) => ({
            ...prev,
            fiscal_year_end_date: data.fiscalYearEnd,
          }));
        }
      }
    } catch (error) {
      console.error('Error fetching stock price:', error);
    } finally {
      setRefreshingPrice(false);
    }
  };

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

    // When editing, ensure we don't update the stock price - it should remain frozen at submission time
    const submissionData = ticker 
      ? { ...formData, current_stock_price: undefined }
      : formData;

    createCompanyMutation.mutate(submissionData);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-grid-pattern">
      <div className="container mx-auto px-6 py-8 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {ticker ? 'Edit Estimates' : 'New Submission'}
          </h1>
          <p className="text-muted-foreground">
            {ticker ? `Updating estimates for ${ticker}` : 'Add a new company with earnings estimates'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Company Information Section */}
          <section className="form-section">
            <h2 className="form-section-title flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Company Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="ticker">Ticker Symbol</Label>
                <TickerAutocomplete
                  value={formData.ticker}
                  onChange={(value) => setFormData({ ...formData, ticker: value })}
                  onSelect={handleTickerSelect}
                  disabled={!!ticker}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  placeholder="e.g., Apple Inc."
                  required
                />
              </div>

              {/* Stock Price Display */}
              <div className="space-y-2">
                <Label>{ticker ? 'Price at Submission' : 'Current Stock Price'}</Label>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-12 px-4 rounded-lg bg-secondary/50 border border-border flex items-center">
                    {refreshingPrice ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        <span className="text-muted-foreground text-sm">Fetching...</span>
                      </div>
                    ) : stockPrice !== null ? (
                      <span className="font-mono text-xl font-semibold text-[hsl(var(--irr-excellent))]">
                        {formatPrice(stockPrice)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </div>
                  {!ticker && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => refreshStockPrice()}
                      disabled={!formData.ticker || refreshingPrice}
                      className="h-12 px-4"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Refresh
                    </Button>
                  )}
                  {ticker && (
                    <div className="px-3 py-2 text-xs text-muted-foreground bg-secondary rounded-lg">
                      Locked
                    </div>
                  )}
                </div>
                {priceLastUpdated && !ticker && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {formatDateTime(priceLastUpdated)}
                  </p>
                )}
                {ticker && priceLastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Submitted: {formatDateTime(priceLastUpdated)}
                  </p>
                )}
              </div>

              <div>
                <FiscalYearPicker
                  value={formData.fiscal_year_end_date}
                  onChange={(value) => setFormData({ ...formData, fiscal_year_end_date: value })}
                  required
                />
              </div>
            </div>
          </section>

          {/* Analysis Settings Section */}
          <section className="form-section">
            <h2 className="form-section-title flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Analysis Settings
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="metric_type">Metric Type</Label>
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

              <div className="space-y-2">
                <Label htmlFor="analyst_initials">Analyst</Label>
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
            </div>
          </section>

          {/* Estimates Section */}
          <section className="form-section">
            <h2 className="form-section-title flex items-center gap-2">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Earnings Estimates
            </h2>
            
            <EstimatesTable
              fiscalYearEndDate={formData.fiscal_year_end_date}
              metrics={formData.metrics}
              dividends={formData.dividends}
              onMetricsChange={(metrics) => setFormData({ ...formData, metrics })}
              onDividendsChange={(dividends) => setFormData({ ...formData, dividends })}
            />
          </section>

          {/* IRR Preview */}
          <IRRPreview
            currentPrice={stockPrice}
            exitMultiple={formData.exit_multiple_5yr}
            fiscalYearEndDate={formData.fiscal_year_end_date}
            metrics={formData.metrics}
            dividends={formData.dividends}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Button 
              type="submit" 
              disabled={createCompanyMutation.isPending}
              size="lg"
              className="min-w-[160px]"
            >
              {createCompanyMutation.isPending ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Saving...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Company
                </span>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={() => navigate('/dashboard')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
