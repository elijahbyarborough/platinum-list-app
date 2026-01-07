import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';

interface FiscalYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FiscalYearPicker({ value, onChange, required }: FiscalYearPickerProps) {
  const [userHasEdited, setUserHasEdited] = useState(false);

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

  // Handle date input change - mark as user edited
  const handleDateChange = (newValue: string) => {
    setUserHasEdited(true);
    onChange(newValue);
  };

  // Handle year dropdown change - update the year while keeping month/day
  const handleYearChange = (newYear: string) => {
    setUserHasEdited(true);
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

  // Show "Estimated" if there's a value but user hasn't manually edited it
  const showEstimated = value && !userHasEdited;

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label htmlFor="fiscal_year_end_date">Next Fiscal Year End</Label>
        <div className="relative">
          <Input
            id="fiscal_year_end_date"
            type="date"
            value={value}
            onChange={(e) => handleDateChange(e.target.value)}
            required={required}
            className="font-mono h-12 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:right-3 [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
          />
          {showEstimated && (
            <span className="absolute right-12 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-xs italic pointer-events-none">
              Estimated
            </span>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="fiscal_year">Current Fiscal Year</Label>
        <div className="relative">
          <Select
            id="fiscal_year"
            value={selectedYear?.toString() || ''}
            onChange={(e) => handleYearChange(e.target.value)}
            className="h-12 pr-24"
          >
            <option value="" disabled>FY</option>
            {fiscalYearOptions.map((year) => (
              <option key={year} value={year}>
                FY {year}
              </option>
            ))}
          </Select>
          {showEstimated && (
            <span className="absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-xs italic pointer-events-none">
              Estimated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
