/**
 * Format a number as currency (price)
 */
export function formatPrice(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Format a number as multiple (e.g., 15.5x)
 */
export function formatMultiple(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return `${value.toFixed(1)}x`;
}

/**
 * Format a date string
 * For DATE types from database, parse the YYYY-MM-DD part directly to avoid timezone issues
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  // Extract just the date part (YYYY-MM-DD) to avoid timezone issues with DATE types
  const datePart = dateString.split('T')[0]; // Get YYYY-MM-DD
  const [year, month, day] = datePart.split('-').map(Number);
  // Create a date object using the date components (treats as local date, no timezone conversion)
  // Format directly without timezone to preserve the date as stored
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${monthNames[month - 1]} ${day}, ${year}`;
}

/**
 * Format a date/time string for tooltips
 */
export function formatDateTime(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

