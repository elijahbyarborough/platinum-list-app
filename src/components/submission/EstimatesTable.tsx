import { useState, useEffect } from 'react';
import { getFiscalYearLabels } from '@/utils/fiscalYear';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface EstimatesTableProps {
  fiscalYearEndDate: string;
  metrics: (number | null)[];
  dividends: (number | null)[];
  onMetricsChange: (metrics: (number | null)[]) => void;
  onDividendsChange: (dividends: (number | null)[]) => void;
}

export function EstimatesTable({
  fiscalYearEndDate,
  metrics,
  dividends,
  onMetricsChange,
  onDividendsChange,
}: EstimatesTableProps) {
  const [localMetrics, setLocalMetrics] = useState<(number | null)[]>(metrics);
  const [localDividends, setLocalDividends] = useState<(number | null)[]>(dividends);
  const [isPasteActive, setIsPasteActive] = useState<'metrics' | 'dividends' | null>(null);

  useEffect(() => {
    setLocalMetrics(metrics);
  }, [metrics]);

  useEffect(() => {
    setLocalDividends(dividends);
  }, [dividends]);

  const labels = fiscalYearEndDate ? getFiscalYearLabels(fiscalYearEndDate) : [];

  const handleMetricsChange = (index: number, value: string) => {
    const newMetrics = [...localMetrics];
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && !isNaN(numValue)) {
      newMetrics[index] = numValue;
    } else if (value === '') {
      newMetrics[index] = null;
    } else {
      return; // Invalid input, don't update
    }
    setLocalMetrics(newMetrics);
    onMetricsChange(newMetrics);
  };

  const handleDividendsChange = (index: number, value: string) => {
    const newDividends = [...localDividends];
    const numValue = value === '' ? null : parseFloat(value);
    if (numValue !== null && !isNaN(numValue)) {
      newDividends[index] = numValue;
    } else if (value === '') {
      newDividends[index] = null;
    } else {
      return; // Invalid input, don't update
    }
    setLocalDividends(newDividends);
    onDividendsChange(newDividends);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTableRowElement>, rowIndex: number) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const values = pastedData.split(/\t|\n/).filter(v => v.trim() !== '');

    if (rowIndex === 0) {
      // Metrics row
      const newMetrics = [...localMetrics];
      values.slice(0, 11).forEach((val, idx) => {
        const numVal = parseFloat(val.trim());
        newMetrics[idx] = isNaN(numVal) ? null : numVal;
      });
      setLocalMetrics(newMetrics);
      onMetricsChange(newMetrics);
      setIsPasteActive('metrics');
      setTimeout(() => setIsPasteActive(null), 1000);
    } else if (rowIndex === 1) {
      // Dividends row
      const newDividends = [...localDividends];
      values.slice(0, 11).forEach((val, idx) => {
        const numVal = parseFloat(val.trim());
        newDividends[idx] = isNaN(numVal) ? null : numVal;
      });
      setLocalDividends(newDividends);
      onDividendsChange(newDividends);
      setIsPasteActive('dividends');
      setTimeout(() => setIsPasteActive(null), 1000);
    }
  };

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
                Row
              </th>
              {labels.map((label, idx) => (
                <th 
                  key={idx} 
                  className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border/50 min-w-[80px]"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Metrics Row */}
            <tr 
              onPaste={(e) => handlePaste(e, 0)}
              className={cn(
                "transition-all duration-300",
                isPasteActive === 'metrics' && "bg-primary/10"
              )}
            >
              <td className="px-4 py-3 bg-[hsl(var(--table-row-odd))] border-b border-border/30">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-foreground">Metrics</span>
                  <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">
                    EPS/FCFPS
                  </span>
                </div>
              </td>
              {localMetrics.map((value, idx) => (
                <td key={idx} className="px-1 py-2 bg-[hsl(var(--table-row-odd))] border-b border-border/30">
                  <Input
                    type="number"
                    step="0.01"
                    value={value === null ? '' : value}
                    onChange={(e) => handleMetricsChange(idx, e.target.value)}
                    className="h-9 text-center text-sm px-2 bg-background/50"
                    placeholder="—"
                  />
                </td>
              ))}
            </tr>

            {/* Dividends Row */}
            <tr 
              onPaste={(e) => handlePaste(e, 1)}
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
              {localDividends.map((value, idx) => (
                <td key={idx} className="px-1 py-2 bg-[hsl(var(--table-row-even))]">
                  <Input
                    type="number"
                    step="0.01"
                    value={value === null ? '' : value}
                    onChange={(e) => handleDividendsChange(idx, e.target.value)}
                    className="h-9 text-center text-sm px-2 bg-background/50"
                    placeholder="—"
                  />
                </td>
              ))}
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
