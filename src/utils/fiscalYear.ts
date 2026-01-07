/**
 * Get fiscal year labels for the estimates table
 * Based on the fiscal year end date
 */
export function getFiscalYearLabels(fyeDate: string): string[] {
  const labels: string[] = [];
  const fye = new Date(fyeDate);
  const baseYear = fye.getFullYear();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilFYE = Math.ceil((fye.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let startYear = baseYear;
  
  if (daysUntilFYE < 0) {
    // We've passed the FYE, so shift forward
    const yearsPassed = Math.floor(Math.abs(daysUntilFYE) / 365) + 1;
    startYear = baseYear + yearsPassed;
  }
  
  for (let i = 0; i < 11; i++) {
    labels.push(`FY ${startYear + i}`);
  }
  
  return labels;
}

/**
 * Get the current fiscal year number based on the FYE date
 * Returns the fiscal year that we are currently in
 */
export function getCurrentFiscalYear(fyeDate: string): number {
  const fye = new Date(fyeDate);
  const baseYear = fye.getFullYear();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a date for the FYE in the current calendar year
  const fyeThisYear = new Date(today.getFullYear(), fye.getMonth(), fye.getDate());
  
  // If we've passed the FYE this calendar year, we're in the next fiscal year
  if (today > fyeThisYear) {
    return today.getFullYear() + 1;
  }
  
  return today.getFullYear();
}

/**
 * Get the next fiscal year end date based on the FYE pattern
 * If the FYE has passed, returns the next occurrence
 */
export function getNextFiscalYearEndDate(fyeDate: string): Date {
  const fye = new Date(fyeDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Create a date for the FYE in the current calendar year
  let nextFYE = new Date(today.getFullYear(), fye.getMonth(), fye.getDate());
  
  // If we've passed the FYE this year, get next year's
  if (today > nextFYE) {
    nextFYE = new Date(today.getFullYear() + 1, fye.getMonth(), fye.getDate());
  }
  
  return nextFYE;
}

/**
 * Format a date as a readable string
 */
export function formatFYEDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get common fiscal year end dates for quick selection
 * Returns dates for the upcoming fiscal year
 */
export function getCommonFYEDates(): { label: string; date: string }[] {
  const today = new Date();
  const currentYear = today.getFullYear();
  
  const dates = [
    { month: 11, day: 31, label: 'Dec 31' }, // Calendar year
    { month: 2, day: 31, label: 'Mar 31' },  // Q1 fiscal
    { month: 5, day: 30, label: 'Jun 30' },  // Q2 fiscal
    { month: 8, day: 30, label: 'Sep 30' },  // Q3 fiscal
  ];
  
  return dates.map(({ month, day, label }) => {
    let year = currentYear;
    const testDate = new Date(currentYear, month, day);
    
    // If the date has passed, use next year
    if (today > testDate) {
      year = currentYear + 1;
    }
    
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    
    return {
      label: `${label}, ${year}`,
      date: dateStr,
    };
  });
}

