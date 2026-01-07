/**
 * Get the current fiscal year based on fiscal year end date
 * @param fiscalYearEndDate - Date string (YYYY-MM-DD) when fiscal year ends
 * @returns The current fiscal year number
 */
export function getCurrentFiscalYear(fiscalYearEndDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fye = new Date(fiscalYearEndDate);
  fye.setHours(0, 0, 0, 0);
  
  const fyeYear = fye.getFullYear();
  
  // Create this year's FYE date
  const fyeThisYear = new Date(today.getFullYear(), fye.getMonth(), fye.getDate());
  
  // If we've passed this year's FYE, we're in the next fiscal year
  if (today > fyeThisYear) {
    return today.getFullYear() + 1;
  }
  
  return today.getFullYear();
}

/**
 * Get fiscal year labels for the estimates table
 * @param fiscalYearEndDate - Date string (YYYY-MM-DD) when fiscal year ends
 * @param count - Number of years to generate (default 8)
 * @returns Array of fiscal year numbers starting from current fiscal year
 */
export function getFiscalYears(fiscalYearEndDate: string, count: number = 8): number[] {
  const startYear = getCurrentFiscalYear(fiscalYearEndDate);
  return Array.from({ length: count }, (_, i) => startYear + i);
}

/**
 * Get fiscal year labels for display
 * @param fiscalYearEndDate - Date string (YYYY-MM-DD) when fiscal year ends
 * @param count - Number of years to generate (default 8)
 * @returns Array of strings like "FY 2026", "FY 2027", etc.
 */
export function getFiscalYearLabels(fiscalYearEndDate: string, count: number = 8): string[] {
  const years = getFiscalYears(fiscalYearEndDate, count);
  return years.map(year => `FY ${year}`);
}
