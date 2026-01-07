import { getMetricForYear, getDividendForYear, calculateYearFraction, getCurrentFiscalYear, getFiscalYearForDate, calculateYearFractionForDate } from './fiscalYear.js';
import { Company, Estimate } from '../db.js';

/**
 * Calculate 5-year Expected Return (IRR) for a company
 * 
 * Formula:
 * 1. futurePrice = interpolatedMetric × exitMultiple
 * 2. priceCAGR = (futurePrice / currentPrice)^(1/5) - 1
 * 3. totalDividends = sum of dividends for years 1-5 (with year 5 interpolated)
 * 4. avgDividendYield = (totalDividends / 5) / currentPrice
 * 5. expectedReturn = priceCAGR + avgDividendYield
 * 
 * The "5-year forward" metric is calculated as exactly 5 years from today,
 * not "Year 5 of the fiscal cycle"
 * 
 * @param company - Company object with fiscal year end date
 * @param estimates - Array of estimates for the company
 * @param exitMultiple - Exit multiple for 5-year horizon
 * @returns Calculated IRR as decimal (e.g., 0.15 for 15%) or null if insufficient data
 */
export function calculate5YearIRR(
  company: Company,
  estimates: Estimate[],
  exitMultiple: number
): number | null {
  if (!company.current_stock_price || company.current_stock_price <= 0) {
    return null; // Need current price
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate the date exactly 5 years from today
  const fiveYearsFromNow = new Date(today);
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
  
  // Get the fiscal year for the 5-year forward date
  const forwardFY = getFiscalYearForDate(fiveYearsFromNow, company.fiscal_year_end_date);
  const nextFY = forwardFY + 1;
  
  // Get metrics for the fiscal years we need to interpolate between
  const forwardMetric = getMetricForYear(estimates, forwardFY);
  const nextMetric = getMetricForYear(estimates, nextFY);
  
  if (forwardMetric === null || nextMetric === null) {
    return null; // Insufficient data
  }
  
  // Calculate year fraction for the 5-year forward date within its fiscal year
  const yearFraction = calculateYearFractionForDate(fiveYearsFromNow, company.fiscal_year_end_date);
  
  // Interpolate: (yearFraction × forwardFY) + ((1 - yearFraction) × nextFY)
  // yearFraction = 1.0 at start of FY, 0.0 at end of FY
  // So if we're early in the FY, use more of forwardFY; if late, use more of nextFY
  const interpolatedMetric = (yearFraction * forwardMetric) + ((1 - yearFraction) * nextMetric);
  
  // Calculate future price
  const futurePrice = interpolatedMetric * exitMultiple;
  
  // Calculate price CAGR: (futurePrice / currentPrice)^(1/5) - 1
  const priceCAGR = Math.pow(futurePrice / company.current_stock_price, 1 / 5) - 1;
  
  // Calculate total dividends for the 5-year period
  // We need dividends for the fiscal years that span from today to 5 years from now
  const currentFY = getCurrentFiscalYear(company.fiscal_year_end_date);
  const dividends: number[] = [];
  
  // Get dividends for fiscal years starting from current FY
  // We'll interpolate the last one based on the 5-year forward date
  for (let i = 0; i < 5; i++) {
    const fy = currentFY + i;
    const div = getDividendForYear(estimates, fy);
    dividends.push(div ?? 0);
  }
  
  // For the 5th year, interpolate based on where the 5-year forward date falls
  // If forwardFY is within our 5-year range, interpolate that year's dividend
  if (forwardFY >= currentFY && forwardFY < currentFY + 5) {
    const forwardDiv = getDividendForYear(estimates, forwardFY) ?? 0;
    const nextDiv = getDividendForYear(estimates, forwardFY + 1) ?? 0;
    const interpolatedDiv = (yearFraction * forwardDiv) + ((1 - yearFraction) * nextDiv);
    
    // Replace the dividend for the fiscal year that contains the 5-year forward date
    const index = forwardFY - currentFY;
    if (index >= 0 && index < 5) {
      dividends[index] = interpolatedDiv;
    }
  }
  
  const totalDividends = dividends.reduce((sum, div) => sum + div, 0);
  
  // Calculate average dividend yield
  const avgDividendYield = (totalDividends / 5) / company.current_stock_price;
  
  // Calculate expected return
  const expectedReturn = priceCAGR + avgDividendYield;
  
  return expectedReturn;
}

/**
 * Check if company has sufficient data for 5-year IRR calculation
 * Requires: Metrics for the fiscal year that contains the 5-year forward date and the next fiscal year
 */
export function hasSufficientDataForIRR(
  company: Company,
  estimates: Estimate[]
): boolean {
  if (!company.current_stock_price || company.current_stock_price <= 0) {
    return false;
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate the date exactly 5 years from today
  const fiveYearsFromNow = new Date(today);
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
  
  // Get the fiscal year for the 5-year forward date
  const forwardFY = getFiscalYearForDate(fiveYearsFromNow, company.fiscal_year_end_date);
  const nextFY = forwardFY + 1;
  
  const forwardMetric = getMetricForYear(estimates, forwardFY);
  const nextMetric = getMetricForYear(estimates, nextFY);
  
  return (
    forwardMetric !== null &&
    nextMetric !== null
  );
}
