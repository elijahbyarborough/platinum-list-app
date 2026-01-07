import { useMemo } from 'react';
import { calculate5YearIRRPreview } from '@/utils/irrCalculator';
import { formatPercentage, formatPrice, formatMultiple } from '@/utils/formatting';
import { cn } from '@/lib/utils';
import { MetricType } from '@/types/company';

interface EstimateData {
  fiscal_year: number;
  metric_value: number | null;
  dividend_value: number | null;
}

interface IRRPreviewProps {
  currentPrice: number | null;
  exitMultiple: number | null;
  fiscalYearEndDate: string;
  estimates: EstimateData[];
  metricType?: MetricType;
}

// Get IRR color class based on value
function getIRRColorClass(irr: number | null): string {
  if (irr === null) return 'text-muted-foreground';
  
  const percentage = irr * 100;
  if (percentage >= 15) return 'text-[hsl(var(--irr-excellent))]';
  if (percentage >= 10) return 'text-[hsl(var(--irr-good))]';
  if (percentage >= 5) return 'text-[hsl(var(--irr-moderate))]';
  if (percentage >= 0) return 'text-[hsl(var(--irr-low))]';
  return 'text-[hsl(var(--irr-negative))]';
}

function getIRRBackgroundClass(irr: number | null): string {
  if (irr === null) return 'bg-secondary/50';
  
  const percentage = irr * 100;
  if (percentage >= 15) return 'bg-[hsl(var(--irr-excellent))]/10';
  if (percentage >= 10) return 'bg-[hsl(var(--irr-good))]/10';
  if (percentage >= 5) return 'bg-[hsl(var(--irr-moderate))]/10';
  if (percentage >= 0) return 'bg-[hsl(var(--irr-low))]/10';
  return 'bg-[hsl(var(--irr-negative))]/10';
}

export function IRRPreview({
  currentPrice,
  exitMultiple,
  fiscalYearEndDate,
  estimates,
  metricType = 'GAAP EPS',
}: IRRPreviewProps) {
  const result = useMemo(() => {
    return calculate5YearIRRPreview({
      currentPrice,
      exitMultiple,
      fiscalYearEndDate,
      estimates,
    });
  }, [currentPrice, exitMultiple, fiscalYearEndDate, estimates]);

  const hasIRR = result.irr !== null;

  return (
    <section className="form-section">
      <h2 className="form-section-title flex items-center gap-2">
        <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
        5-Year Expected Return Calculation
      </h2>
      
      {hasIRR ? (
        <div className="space-y-6">
          {/* Main IRR Display */}
          <div className={cn(
            "text-center p-6 rounded-xl border border-border/50 transition-all duration-300",
            getIRRBackgroundClass(result.irr)
          )}>
            <div className="text-sm text-muted-foreground mb-2 uppercase tracking-wider">
              Expected Annual Return (IRR)
            </div>
            <div className={cn(
              "text-5xl font-bold font-mono tracking-tight",
              getIRRColorClass(result.irr)
            )}>
              {formatPercentage(result.irr)}
            </div>
          </div>

          {/* Breakdown Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                5Y FWD {metricType}
              </div>
              <div className="text-lg font-semibold font-mono">
                {result.interpolatedMetric?.toFixed(2) || '—'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                {metricType} Multiple
              </div>
              <div className="text-lg font-semibold font-mono">
                {exitMultiple !== null ? formatMultiple(exitMultiple) : '—'}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Future Price
              </div>
              <div className="text-lg font-semibold font-mono">
                {formatPrice(result.futurePrice)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Price CAGR
              </div>
              <div className="text-lg font-semibold font-mono">
                {formatPercentage(result.priceCAGR)}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-secondary/30 border border-border/30">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                Avg. Div Yield
              </div>
              <div className="text-lg font-semibold font-mono">
                {formatPercentage(result.dividendYield)}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 px-4 rounded-xl bg-secondary/20 border border-border/30">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-secondary flex items-center justify-center">
            <svg className="w-6 h-6 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-muted-foreground mb-3 font-medium">Cannot calculate IRR</div>
          <div className="text-sm">
            <span className="text-muted-foreground">Missing data:</span>
            <ul className="mt-2 space-y-1">
              {result.missingData.map((item, idx) => (
                <li key={idx} className="flex items-center justify-center gap-2 text-muted-foreground/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </section>
  );
}
