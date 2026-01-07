/**
 * Client-side IRR calculator for preview purposes
 */

import { getCurrentFiscalYear } from './fiscalYear';

interface EstimateData {
  fiscal_year: number;
  metric_value: number | null;
  dividend_value: number | null;
}

interface IRRInput {
  currentPrice: number | null;
  exitMultiple: number | null;
  fiscalYearEndDate: string;
  estimates: EstimateData[];
}

interface IRRResult {
  irr: number | null;
  priceCAGR: number | null;
  dividendYield: number | null;
  futurePrice: number | null;
  interpolatedMetric: number | null;
  missingData: string[];
}

/**
 * Calculate year fraction remaining in current fiscal year
 */
function calculateYearFraction(fiscalYearEndDate: string): number {
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
 */
function getMetricForYear(estimates: EstimateData[], fiscalYear: number): number | null {
  const estimate = estimates.find(e => e.fiscal_year === fiscalYear);
  return estimate?.metric_value ?? null;
}

/**
 * Get dividend value for a specific fiscal year from estimates array
 */
function getDividendForYear(estimates: EstimateData[], fiscalYear: number): number | null {
  const estimate = estimates.find(e => e.fiscal_year === fiscalYear);
  return estimate?.dividend_value ?? null;
}

/**
 * Calculate 5-year Expected Return (IRR) from form data
 */
export function calculate5YearIRRPreview(input: IRRInput): IRRResult {
  const missingData: string[] = [];
  
  // Check for required data
  if (!input.currentPrice || input.currentPrice <= 0) {
    missingData.push('Current stock price');
  }
  
  if (!input.exitMultiple || input.exitMultiple <= 0) {
    missingData.push('Exit multiple');
  }
  
  if (!input.fiscalYearEndDate) {
    missingData.push('Fiscal year end date');
  }
  
  // Calculate current fiscal year
  const currentFY = input.fiscalYearEndDate ? getCurrentFiscalYear(input.fiscalYearEndDate) : null;
  
  if (!currentFY) {
    return {
      irr: null,
      priceCAGR: null,
      dividendYield: null,
      futurePrice: null,
      interpolatedMetric: null,
      missingData,
    };
  }
  
  // Need Year 5 (currentFY + 4) and Year 6 (currentFY + 5) metrics for interpolation
  const year5FY = currentFY + 4;
  const year6FY = currentFY + 5;
  
  const year5Metric = getMetricForYear(input.estimates, year5FY);
  const year6Metric = getMetricForYear(input.estimates, year6FY);
  
  if (year5Metric === null) {
    missingData.push(`FY ${year5FY} metric estimate`);
  }
  
  if (year6Metric === null) {
    missingData.push(`FY ${year6FY} metric estimate`);
  }
  
  // If missing required data, return early
  if (missingData.length > 0) {
    return {
      irr: null,
      priceCAGR: null,
      dividendYield: null,
      futurePrice: null,
      interpolatedMetric: null,
      missingData,
    };
  }
  
  const currentPrice = input.currentPrice!;
  const exitMultiple = input.exitMultiple!;
  const yearFraction = calculateYearFraction(input.fiscalYearEndDate!);
  
  // Interpolate Year 5 metric: (yearFraction × Year5) + ((1 - yearFraction) × Year6)
  const interpolatedMetric = (yearFraction * year5Metric!) + ((1 - yearFraction) * year6Metric!);
  
  // Calculate future price
  const futurePrice = interpolatedMetric * exitMultiple;
  
  // Calculate price CAGR: (futurePrice / currentPrice)^(1/5) - 1
  const priceCAGR = Math.pow(futurePrice / currentPrice, 1 / 5) - 1;
  
  // Calculate total dividends for years 1-5 (with Year 5 interpolated)
  const dividends: number[] = [];
  for (let i = 0; i < 5; i++) {
    const fy = currentFY + i;
    const div = getDividendForYear(input.estimates, fy);
    dividends.push(div ?? 0);
  }
  
  // Interpolate Year 5 dividend
  const year5Div = dividends[4];
  const year6Div = getDividendForYear(input.estimates, year6FY) ?? 0;
  dividends[4] = (yearFraction * year5Div) + ((1 - yearFraction) * year6Div);
  
  const totalDividends = dividends.reduce((sum, div) => sum + div, 0);
  
  // Calculate average dividend yield
  const avgDividendYield = (totalDividends / 5) / currentPrice;
  
  // Calculate expected return (IRR)
  const irr = priceCAGR + avgDividendYield;
  
  return {
    irr,
    priceCAGR,
    dividendYield: avgDividendYield,
    futurePrice,
    interpolatedMetric,
    missingData: [],
  };
}
