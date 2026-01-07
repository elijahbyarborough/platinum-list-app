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
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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

