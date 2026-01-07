import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getCurrentFiscalYear } from '@/utils/fiscalYear';

interface FiscalYearPickerProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function FiscalYearPicker({ value, onChange, required }: FiscalYearPickerProps) {
  const [userHasEdited, setUserHasEdited] = useState(false);

  // Calculate current fiscal year based on the date
  const currentFiscalYear = useMemo(() => {
    if (!value) return null;
    return getCurrentFiscalYear(value);
  }, [value]);

  // Handle date input change - mark as user edited
  const handleDateChange = (newValue: string) => {
    setUserHasEdited(true);
    onChange(newValue);
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
        <Label htmlFor="current_fiscal_year">Current Fiscal Year</Label>
        <div className="relative">
          <div className="h-12 px-4 rounded-lg bg-secondary/50 border border-border flex items-center">
            {currentFiscalYear ? (
              <span className="font-mono text-lg">FY {currentFiscalYear}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
          {showEstimated && (
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/70 text-xs italic pointer-events-none">
              Estimated
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
