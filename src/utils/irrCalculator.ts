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
 * Get the fiscal year for a specific date
 */
function getFiscalYearForDate(date: Date, fiscalYearEndDate: string): number {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const fye = new Date(fiscalYearEndDate);
  fye.setHours(0, 0, 0, 0);
  
  const fyeThisYear = new Date(checkDate.getFullYear(), fye.getMonth(), fye.getDate());
  
  if (checkDate > fyeThisYear) {
    return checkDate.getFullYear() + 1;
  }
  
  return checkDate.getFullYear();
}

/**
 * Calculate the year fraction for a specific date within its fiscal year
 * @returns Year fraction (0-1), where 1.0 = start of fiscal year, 0.0 = end of fiscal year
 */
function calculateYearFractionForDate(date: Date, fiscalYearEndDate: string): number {
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  
  const fye = new Date(fiscalYearEndDate);
  fye.setHours(0, 0, 0, 0);
  
  const fiscalYear = getFiscalYearForDate(checkDate, fiscalYearEndDate);
  
  const fiscalYearStart = new Date(fiscalYear - 1, fye.getMonth(), fye.getDate());
  fiscalYearStart.setDate(fiscalYearStart.getDate() + 1);
  
  const fiscalYearEnd = new Date(fiscalYear, fye.getMonth(), fye.getDate());
  
  const daysFromStart = Math.ceil((checkDate.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24));
  const daysInYear = Math.ceil((fiscalYearEnd.getTime() - fiscalYearStart.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.max(0, Math.min(1, 1 - (daysFromStart / daysInYear)));
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
  
  if (!input.fiscalYearEndDate) {
    return {
      irr: null,
      priceCAGR: null,
      dividendYield: null,
      futurePrice: null,
      interpolatedMetric: null,
      missingData,
    };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate the date exactly 5 years from today
  const fiveYearsFromNow = new Date(today);
  fiveYearsFromNow.setFullYear(today.getFullYear() + 5);
  
  // Get the fiscal year for the 5-year forward date
  const forwardFY = getFiscalYearForDate(fiveYearsFromNow, input.fiscalYearEndDate);
  const nextFY = forwardFY + 1;
  
  const forwardMetric = getMetricForYear(input.estimates, forwardFY);
  const nextMetric = getMetricForYear(input.estimates, nextFY);
  
  if (forwardMetric === null) {
    missingData.push(`FY ${forwardFY} metric estimate`);
  }
  
  if (nextMetric === null) {
    missingData.push(`FY ${nextFY} metric estimate`);
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
  
  // Calculate year fraction for the 5-year forward date within its fiscal year
  const yearFraction = calculateYearFractionForDate(fiveYearsFromNow, input.fiscalYearEndDate);
  
  // Interpolate: (yearFraction × forwardFY) + ((1 - yearFraction) × nextFY)
  const interpolatedMetric = (yearFraction * forwardMetric!) + ((1 - yearFraction) * nextMetric!);
  
  // Calculate future price
  const futurePrice = interpolatedMetric * exitMultiple;
  
  // Calculate price CAGR: (futurePrice / currentPrice)^(1/5) - 1
  const priceCAGR = Math.pow(futurePrice / currentPrice, 1 / 5) - 1;
  
  // Calculate total dividends for the 5-year period
  const currentFY = getCurrentFiscalYear(input.fiscalYearEndDate);
  const dividends: number[] = [];
  
  // Get dividends for fiscal years starting from current FY
  for (let i = 0; i < 5; i++) {
    const fy = currentFY + i;
    const div = getDividendForYear(input.estimates, fy);
    dividends.push(div ?? 0);
  }
  
  // For the fiscal year that contains the 5-year forward date, interpolate
  if (forwardFY >= currentFY && forwardFY < currentFY + 5) {
    const forwardDiv = getDividendForYear(input.estimates, forwardFY) ?? 0;
    const nextDiv = getDividendForYear(input.estimates, nextFY) ?? 0;
    const interpolatedDiv = (yearFraction * forwardDiv) + ((1 - yearFraction) * nextDiv);
    
    const index = forwardFY - currentFY;
    if (index >= 0 && index < 5) {
      dividends[index] = interpolatedDiv;
    }
  }
  
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
