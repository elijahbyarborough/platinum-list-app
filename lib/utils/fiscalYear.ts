/**
 * Fiscal Year utilities for handling fiscal year roll-forward logic
 */

/**
 * Calculate the year fraction remaining in the current fiscal year
 * @param fyeDate - Fiscal year end date (e.g., "2026-12-31")
 * @returns Year fraction (0-1), where 1.0 = start of fiscal year, 0.0 = end of fiscal year
 */
export function calculateYearFraction(fyeDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fye = new Date(fyeDate);
  fye.setHours(0, 0, 0, 0);
  
  // Calculate days remaining until FYE
  const daysUntilFYE = Math.ceil((fye.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // If we've passed the FYE, calculate for the next fiscal year
  if (daysUntilFYE < 0) {
    // Roll forward to next fiscal year
    const nextFYE = new Date(fye);
    nextFYE.setFullYear(nextFYE.getFullYear() + 1);
    
    const daysUntilNextFYE = Math.ceil((nextFYE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(1, daysUntilNextFYE / 365));
  }
  
  // Normalize to 0-1 range (365 days in a year)
  return Math.max(0, Math.min(1, daysUntilFYE / 365));
}

/**
 * Determine which stored fiscal year (fy1-fy11) corresponds to a given target year
 * @param fyeDate - Fiscal year end date (e.g., "2026-12-31")
 * @param targetYearOffset - Years forward from the base fiscal year (0 = current FY, 1 = next FY, etc.)
 * @returns The stored fiscal year index (1-11) or null if beyond stored range
 */
export function getStoredYearIndex(fyeDate: string, targetYearOffset: number): number | null {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fye = new Date(fyeDate);
  fye.setHours(0, 0, 0, 0);
  
  // If today has passed the FYE, roll forward
  const daysUntilFYE = Math.ceil((fye.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let baseYearIndex = 1; // fy1 is always the first stored year
  
  if (daysUntilFYE < 0) {
    // We've passed the FYE, so fy1 is now the next fiscal year
    // The stored data needs to be shifted
    const yearsPassed = Math.floor(Math.abs(daysUntilFYE) / 365) + 1;
    baseYearIndex = yearsPassed + 1;
  }
  
  const targetIndex = baseYearIndex + targetYearOffset;
  
  if (targetIndex < 1 || targetIndex > 11) {
    return null;
  }
  
  return targetIndex;
}

/**
 * Get the fiscal year number (e.g., FY 2026, FY 2027) for a given stored year index
 * @param fyeDate - Fiscal year end date (e.g., "2026-12-31")
 * @param storedYearIndex - The stored fiscal year index (1-11)
 * @returns The fiscal year number (e.g., 2026, 2027) or null if invalid
 */
export function getFiscalYearNumber(fyeDate: string, storedYearIndex: number): number | null {
  if (storedYearIndex < 1 || storedYearIndex > 11) {
    return null;
  }
  
  const fye = new Date(fyeDate);
  const baseYear = fye.getFullYear();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilFYE = Math.ceil((fye.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  if (daysUntilFYE < 0) {
    // We've passed the FYE, so shift forward
    const yearsPassed = Math.floor(Math.abs(daysUntilFYE) / 365) + 1;
    const shift = yearsPassed;
    return baseYear + storedYearIndex - shift;
  }
  
  // Normal case: storedYearIndex 1 = baseYear, 2 = baseYear+1, etc.
  return baseYear + storedYearIndex - 1;
}

/**
 * Extract metric value for a specific year from stored fiscal year data
 * @param company - Company object with fy1_metric through fy11_metric
 * @param yearOffset - Years forward from current fiscal year (0-5 for 5-year IRR)
 * @returns The metric value or null
 */
export function getMetricForYear(company: any, yearOffset: number): number | null {
  const storedIndex = getStoredYearIndex(company.fiscal_year_end_date, yearOffset);
  if (!storedIndex) return null;
  
  const metricKey = `fy${storedIndex}_metric` as keyof typeof company;
  return company[metricKey] ?? null;
}

/**
 * Extract dividend value for a specific year from stored fiscal year data
 * @param company - Company object with fy1_div through fy11_div
 * @param yearOffset - Years forward from current fiscal year (0-5 for 5-year IRR)
 * @returns The dividend value or null
 */
export function getDividendForYear(company: any, yearOffset: number): number | null {
  const storedIndex = getStoredYearIndex(company.fiscal_year_end_date, yearOffset);
  if (!storedIndex) return null;
  
  const divKey = `fy${storedIndex}_div` as keyof typeof company;
  return company[divKey] ?? null;
}

