import { useState, useEffect } from 'react';
import { getFiscalYearLabels } from '@/utils/fiscalYear';
import { Input } from '@/components/ui/input';

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

  const handlePaste = (e: React.ClipboardEvent<HTMLTableElement>, rowIndex: number) => {
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
    } else if (rowIndex === 1) {
      // Dividends row
      const newDividends = [...localDividends];
      values.slice(0, 11).forEach((val, idx) => {
        const numVal = parseFloat(val.trim());
        newDividends[idx] = isNaN(numVal) ? null : numVal;
      });
      setLocalDividends(newDividends);
      onDividendsChange(newDividends);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left font-semibold"></th>
            {labels.map((label, idx) => (
              <th key={idx} className="border border-gray-300 px-4 py-2 bg-gray-100 text-center font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr onPaste={(e) => handlePaste(e, 0)}>
            <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
              Metrics
            </td>
            {localMetrics.map((value, idx) => (
              <td key={idx} className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.01"
                  value={value === null ? '' : value}
                  onChange={(e) => handleMetricsChange(idx, e.target.value)}
                  className="w-full text-center"
                  placeholder="—"
                />
              </td>
            ))}
          </tr>
          <tr onPaste={(e) => handlePaste(e, 1)}>
            <td className="border border-gray-300 px-4 py-2 bg-gray-50 font-medium">
              Dividends
            </td>
            {localDividends.map((value, idx) => (
              <td key={idx} className="border border-gray-300 px-2 py-1">
                <Input
                  type="number"
                  step="0.01"
                  value={value === null ? '' : value}
                  onChange={(e) => handleDividendsChange(idx, e.target.value)}
                  className="w-full text-center"
                  placeholder="—"
                />
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <p className="text-sm text-muted-foreground mt-2">
        Paste tab-separated values from Excel into either row
      </p>
    </div>
  );
}

