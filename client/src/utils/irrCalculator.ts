/**
 * Client-side IRR calculator for preview purposes
 */

interface IRRInput {
  currentPrice: number | null;
  exitMultiple: number | null;
  fiscalYearEndDate: string;
  metrics: (number | null)[];
  dividends: (number | null)[];
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
function calculateYearFraction(fyeDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const fye = new Date(fyeDate);
  fye.setHours(0, 0, 0, 0);
  
  // Calculate days remaining until FYE
  const daysUntilFYE = Math.ceil((fye.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  // If we've passed the FYE, calculate for the next fiscal year
  if (daysUntilFYE < 0) {
    const nextFYE = new Date(fye);
    nextFYE.setFullYear(nextFYE.getFullYear() + 1);
    
    const daysUntilNextFYE = Math.ceil((nextFYE.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, Math.min(1, daysUntilNextFYE / 365));
  }
  
  return Math.max(0, Math.min(1, daysUntilFYE / 365));
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
  
  // Need Year 5 (index 4) and Year 6 (index 5) metrics for interpolation
  const year5Metric = input.metrics[4];
  const year6Metric = input.metrics[5];
  
  if (year5Metric === null || year5Metric === undefined) {
    missingData.push('Year 5 metric estimate');
  }
  
  if (year6Metric === null || year6Metric === undefined) {
    missingData.push('Year 6 metric estimate');
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
  const yearFraction = calculateYearFraction(input.fiscalYearEndDate);
  
  // Interpolate Year 5 metric: (yearFraction × Year5) + ((1 - yearFraction) × Year6)
  const interpolatedMetric = (yearFraction * year5Metric!) + ((1 - yearFraction) * year6Metric!);
  
  // Calculate future price
  const futurePrice = interpolatedMetric * exitMultiple;
  
  // Calculate price CAGR: (futurePrice / currentPrice)^(1/5) - 1
  const priceCAGR = Math.pow(futurePrice / currentPrice, 1 / 5) - 1;
  
  // Calculate total dividends for years 1-5 (with Year 5 interpolated)
  const dividends: number[] = [];
  for (let i = 0; i < 5; i++) {
    dividends.push(input.dividends[i] ?? 0);
  }
  
  // Interpolate Year 5 dividend
  const year5Div = dividends[4];
  const year6Div = input.dividends[5] ?? 0;
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

