import { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { getCurrentFiscalYear } from '@/utils/fiscalYear';

interface FiscalYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FiscalYearPicker({ value, onChange, required }: FiscalYearPickerProps) {
  // Generate fiscal year options (current year through +10 years)
  const fiscalYearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = 0; i <= 10; i++) {
      years.push(currentYear + i);
    }
    return years;
  }, []);

  // Get the selected year from the date value
  const selectedYear = useMemo(() => {
    if (!value) return null;
    return new Date(value).getFullYear();
  }, [value]);

  // Get current fiscal year for display
  const currentFY = useMemo(() => {
    if (!value) return null;
    return getCurrentFiscalYear(value);
  }, [value]);

  // Handle year dropdown change - update the year while keeping month/day
  const handleYearChange = (newYear: string) => {
    const year = parseInt(newYear, 10);
    if (!value) {
      // Default to Dec 31 if no date is set
      onChange(`${year}-12-31`);
    } else {
      const date = new Date(value);
      date.setFullYear(year);
      onChange(date.toISOString().split('T')[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-3">
        <div className="flex-1">
          <Input
            id="fiscal_year_end_date"
            type="date"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="font-mono"
          />
        </div>
        <div className="w-28">
          <Select
            value={selectedYear?.toString() || ''}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="" disabled>FY</option>
            {fiscalYearOptions.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Current fiscal year display */}
      {currentFY && (
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Current Fiscal Year:</span>
          <span className="font-medium text-foreground bg-secondary px-2 py-0.5 rounded">
            FY {currentFY}
          </span>
        </div>
      )}
    </div>
  );
}
