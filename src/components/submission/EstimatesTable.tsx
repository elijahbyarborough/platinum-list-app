import { useState, useEffect, useMemo } from 'react';
import { getFiscalYears } from '@/utils/fiscalYear';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { MetricType } from '@/types/company';

interface EstimateData {
  fiscal_year: number;
  metric_value: number | null;
  dividend_value: number | null;
}

interface EstimatesTableProps {
  fiscalYearEndDate: string;
  estimates: EstimateData[];
  onEstimatesChange: (estimates: EstimateData[]) => void;
  metricType?: MetricType;
}

export function EstimatesTable({
  fiscalYearEndDate,
  estimates,
  onEstimatesChange,
  metricType = 'GAAP EPS',
}: EstimatesTableProps) {
  const [isPasteActive, setIsPasteActive] = useState<'metrics' | 'dividends' | null>(null);

  // Generate fiscal years based on fiscal year end date
  const fiscalYears = useMemo(() => {
    if (!fiscalYearEndDate) return [];
    return getFiscalYears(fiscalYearEndDate, 8);
  }, [fiscalYearEndDate]);

  // Initialize estimates when fiscal years change
  useEffect(() => {
    if (fiscalYears.length > 0 && estimates.length === 0) {
      const initialEstimates = fiscalYears.map(year => ({
        fiscal_year: year,
        metric_value: null,
        dividend_value: null,
      }));
      onEstimatesChange(initialEstimates);
    }
  }, [fiscalYears, estimates.length, onEstimatesChange]);

  // Get value for a specific fiscal year
  const getEstimate = (fiscalYear: number): EstimateData => {
    return estimates.find(e => e.fiscal_year === fiscalYear) || {
      fiscal_year: fiscalYear,
      metric_value: null,
      dividend_value: null,
    };
  };

  // Update metric for a specific fiscal year
  const handleMetricChange = (fiscalYear: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && isNaN(numValue)) return;

    const newEstimates = fiscalYears.map(year => {
      const existing = getEstimate(year);
      if (year === fiscalYear) {
        return { ...existing, metric_value: numValue };
      }
      return existing;
    });
    onEstimatesChange(newEstimates);
  };

  // Update dividend for a specific fiscal year
  const handleDividendChange = (fiscalYear: number, value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && isNaN(numValue)) return;

    const newEstimates = fiscalYears.map(year => {
      const existing = getEstimate(year);
      if (year === fiscalYear) {
        return { ...existing, dividend_value: numValue };
      }
      return existing;
    });
    onEstimatesChange(newEstimates);
  };

  const handlePaste = (e: React.ClipboardEvent, rowType: 'metrics' | 'dividends', startYear?: number) => {
    e.preventDefault();
    e.stopPropagation();
    const pastedData = e.clipboardData.getData('text');
    
    // Split by tabs (Excel columns) and newlines (Excel rows), then flatten
    // Excel typically uses tabs for columns within a row
    const lines = pastedData.split(/\r?\n/).filter(line => line.trim() !== '');
    const allValues: string[] = [];
    
    // If multiple lines, use first line (single row paste)
    // If single line with tabs, split by tabs
    if (lines.length > 0) {
      const firstLine = lines[0];
      const values = firstLine.split(/\t/).map(v => v.trim()).filter(v => v !== '');
      allValues.push(...values);
    }

    const newEstimates = [...estimates.length > 0 ? estimates : fiscalYears.map(year => ({
      fiscal_year: year,
      metric_value: null,
      dividend_value: null,
    }))];

    // If we know the starting year (from the input that received paste), start there
    const startIndex = startYear ? fiscalYears.indexOf(startYear) : 0;

    allValues.forEach((value, idx) => {
      const targetIndex = startIndex + idx;
      if (targetIndex >= 0 && targetIndex < fiscalYears.length) {
        const targetYear = fiscalYears[targetIndex];
        const estimateIndex = newEstimates.findIndex(e => e.fiscal_year === targetYear);
        
        if (estimateIndex >= 0) {
          const numValue = value ? parseFloat(value.replace(/,/g, '')) : null;
          const validValue = numValue !== null && !isNaN(numValue) ? numValue : null;
          
          if (rowType === 'metrics') {
            newEstimates[estimateIndex] = {
              ...newEstimates[estimateIndex],
              metric_value: validValue ?? newEstimates[estimateIndex].metric_value,
            };
          } else {
            newEstimates[estimateIndex] = {
              ...newEstimates[estimateIndex],
              dividend_value: validValue ?? newEstimates[estimateIndex].dividend_value,
            };
          }
        }
      }
    });

    onEstimatesChange(newEstimates);
    setIsPasteActive(rowType);
    setTimeout(() => setIsPasteActive(null), 1000);
  };

  if (!fiscalYearEndDate) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-lg">
        Select a fiscal year end date to enter estimates
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Paste instruction banner */}
      <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Excel Paste Supported</p>
          <p className="text-xs text-muted-foreground">
            Select a row and paste (Ctrl/Cmd+V) tab-separated values directly from Excel
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <table className="w-full">
          <thead>
            <tr className="bg-[hsl(var(--table-header))]">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 w-28">
                Fiscal Year
              </th>
              {fiscalYears.map((year) => (
                <th 
                  key={year} 
                  className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 min-w-[80px]"
                >
                  FY {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Metrics Row */}
            <tr 
              onPaste={(e) => handlePaste(e, 'metrics')}
              className={cn(
                "transition-all duration-300",
                isPasteActive === 'metrics' && "bg-primary/10"
              )}
            >
              <td className="px-4 py-3 bg-[hsl(var(--table-row-odd))] border-b border-border/30">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">{metricType}</span>
                </div>
              </td>
              {fiscalYears.map((year) => {
                const estimate = getEstimate(year);
                return (
                  <td key={year} className="px-1 py-2 bg-[hsl(var(--table-row-odd))] border-b border-border/30">
                    <Input
                      type="number"
                      step="0.01"
                      value={estimate.metric_value === null ? '' : estimate.metric_value}
                      onChange={(e) => handleMetricChange(year, e.target.value)}
                      onPaste={(e) => handlePaste(e, 'metrics', year)}
                      className="h-9 text-center text-sm px-2 bg-background/50"
                      placeholder="—"
                    />
                  </td>
                );
              })}
            </tr>

            {/* Dividends Row */}
            <tr 
              onPaste={(e) => handlePaste(e, 'dividends')}
              className={cn(
                "transition-all duration-300",
                isPasteActive === 'dividends' && "bg-primary/10"
              )}
            >
              <td className="px-4 py-3 bg-[hsl(var(--table-row-even))]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">Dividends</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    Per Share
                  </span>
                </div>
              </td>
              {fiscalYears.map((year) => {
                const estimate = getEstimate(year);
                return (
                  <td key={year} className="px-1 py-2 bg-[hsl(var(--table-row-even))]">
                    <Input
                      type="number"
                      step="0.01"
                      value={estimate.dividend_value === null ? '' : estimate.dividend_value}
                      onChange={(e) => handleDividendChange(year, e.target.value)}
                      onPaste={(e) => handlePaste(e, 'dividends', year)}
                      className="h-9 text-center text-sm px-2 bg-background/50"
                      placeholder="—"
                    />
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Keyboard shortcut hint */}
      <div className="flex items-center justify-end gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">Tab</kbd>
          <span>Next cell</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-secondary border border-border text-[10px] font-mono">⌘V</kbd>
          <span>Paste from Excel</span>
        </span>
      </div>
    </div>
  );
}
