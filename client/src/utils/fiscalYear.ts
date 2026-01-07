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

