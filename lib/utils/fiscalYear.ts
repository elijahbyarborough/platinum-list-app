/**
 * Fiscal Year utilities for handling fiscal year calculations
 */

import { Estimate } from '../db.js';

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
  
  // Create this year's FYE date
  const fyeThisYear = new Date(today.getFullYear(), fye.getMonth(), fye.getDate());
  
  // If we've passed this year's FYE, we're in the next fiscal year
  if (today > fyeThisYear) {
    return today.getFullYear() + 1;
  }
  
  return today.getFullYear();
}

/**
 * Calculate the year fraction remaining in the current fiscal year
 * @param fiscalYearEndDate - Date string (YYYY-MM-DD) when fiscal year ends
 * @returns Year fraction (0-1), where 1.0 = start of fiscal year, 0.0 = end of fiscal year
 */
export function calculateYearFraction(fiscalYearEndDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fye = new Date(fiscalYearEndDate);
  fye.setHours(0, 0, 0, 0);
  
  // Create this year's and next year's FYE dates
  let targetFYE = new Date(today.getFullYear(), fye.getMonth(), fye.getDate());
  
  // If we've passed this year's FYE, use next year's
  if (today > targetFYE) {
    targetFYE = new Date(today.getFullYear() + 1, fye.getMonth(), fye.getDate());
  }
  
  const daysUntilFYE = Math.ceil((targetFYE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // Normalize to 0-1 range (365 days in a year)
  return Math.max(0, Math.min(1, daysUntilFYE / 365));
}

/**
 * Get metric value for a specific fiscal year from estimates array
 * @param estimates - Array of estimates with fiscal_year, metric_value, dividend_value
 * @param fiscalYear - The fiscal year to look up
 * @returns The metric value or null if not found
 */
export function getMetricForYear(estimates: Estimate[], fiscalYear: number): number | null {
  const estimate = estimates.find(e => e.fiscal_year === fiscalYear);
  return estimate?.metric_value ?? null;
}

/**
 * Get dividend value for a specific fiscal year from estimates array
 * @param estimates - Array of estimates with fiscal_year, metric_value, dividend_value
 * @param fiscalYear - The fiscal year to look up
 * @returns The dividend value or null if not found
 */
export function getDividendForYear(estimates: Estimate[], fiscalYear: number): number | null {
  const estimate = estimates.find(e => e.fiscal_year === fiscalYear);
  return estimate?.dividend_value ?? null;
}

/**
 * Generate an array of fiscal years starting from a base year
 * @param startYear - The first fiscal year
 * @param count - Number of years to generate
 * @returns Array of fiscal year numbers
 */
export function generateFiscalYears(startYear: number, count: number): number[] {
  return Array.from({ length: count }, (_, i) => startYear + i);
}
