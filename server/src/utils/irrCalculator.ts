import { getMetricForYear, getDividendForYear, calculateYearFraction } from './fiscalYear.js';
import { Company } from '../models/types.js';

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
 * @param company - Company object with fiscal year data
 * @param exitMultiple - Exit multiple for 5-year horizon
 * @returns Calculated IRR as decimal (e.g., 0.15 for 15%) or null if insufficient data
 */
export function calculate5YearIRR(company: Company, exitMultiple: number): number | null {
  // Need at least Year 5 and Year 6 for interpolation
  const year5Metric = getMetricForYear(company, 4); // Year 5 (0-indexed: years 0-4 = years 1-5)
  const year6Metric = getMetricForYear(company, 5); // Year 6
  
  if (year5Metric === null || year6Metric === null) {
    return null; // Insufficient data
  }
  
  if (!company.current_stock_price || company.current_stock_price <= 0) {
    return null; // Need current price
  }
  
  const yearFraction = calculateYearFraction(company.fiscal_year_end_date);
  
  // Interpolate Year 5 metric: (yearFraction × Year5) + ((1 - yearFraction) × Year6)
  const interpolatedMetric = (yearFraction * year5Metric) + ((1 - yearFraction) * year6Metric);
  
  // Calculate future price
  const futurePrice = interpolatedMetric * exitMultiple;
  
  // Calculate price CAGR: (futurePrice / currentPrice)^(1/5) - 1
  const priceCAGR = Math.pow(futurePrice / company.current_stock_price, 1 / 5) - 1;
  
  // Calculate total dividends for years 1-5 (with Year 5 interpolated)
  const dividends: number[] = [];
  for (let i = 0; i < 5; i++) {
    const div = getDividendForYear(company, i);
    dividends.push(div ?? 0); // Treat null as 0
  }
  
  // Interpolate Year 5 dividend
  const year5Div = dividends[4];
  const year6Div = getDividendForYear(company, 5) ?? 0;
  dividends[4] = (yearFraction * year5Div) + ((1 - yearFraction) * year6Div);
  
  const totalDividends = dividends.reduce((sum, div) => sum + div, 0);
  
  // Calculate average dividend yield
  const avgDividendYield = (totalDividends / 5) / company.current_stock_price;
  
  // Calculate expected return
  const expectedReturn = priceCAGR + avgDividendYield;
  
  return expectedReturn;
}

/**
 * Check if company has sufficient data for 5-year IRR calculation
 * Requires: Year 5 and Year 6 metrics, and current stock price
 */
export function hasSufficientDataForIRR(company: Company): boolean {
  const year5Metric = getMetricForYear(company, 4);
  const year6Metric = getMetricForYear(company, 5);
  
  return (
    year5Metric !== null &&
    year6Metric !== null &&
    company.current_stock_price !== null &&
    company.current_stock_price > 0
  );
}

