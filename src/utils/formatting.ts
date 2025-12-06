/**
 * Formatting Utilities for İmar Calculations
 *
 * Handles proper display of numerical values to avoid floating-point precision issues
 * and ensure consistent formatting across the application
 */

/**
 * Format a number for Turkish locale display
 * @param num - Number to format
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted string with Turkish thousand separators
 */
export function formatNumber(num: number, decimals: number = 1): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
}

/**
 * Format a coefficient (multiplier) value
 * Always shows exactly 2 decimal places to avoid floating-point display bugs
 * @param num - Coefficient to format
 * @returns Formatted string (e.g., "1.70" not "1.7000000000000002")
 */
export function formatCoefficient(num: number): string {
  return num.toFixed(2);
}

/**
 * Format an area value with proper Turkish formatting
 * @param area - Area in m²
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted string with m² suffix
 */
export function formatArea(area: number, decimals: number = 2): string {
  return `${formatNumber(area, decimals)} m²`;
}

/**
 * Format TAKS or KAKS value
 * These are coefficients, always show 2 decimal places
 * @param value - TAKS/KAKS value
 * @returns Formatted string
 */
export function formatTaksKaks(value: number): string {
  return formatCoefficient(value);
}

/**
 * Format Kat Adedi (number of floors)
 * Usually shows 1 decimal place
 * @param value - Number of floors
 * @returns Formatted string with "kat" suffix
 */
export function formatKatAdedi(value: number): string {
  return `${value.toFixed(1)} kat`;
}

/**
 * Validate and clamp a number within range
 * Useful for input validation
 * @param value - Value to validate
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Clamped value
 */
export function clampValue(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Format currency (Turkish Lira)
 * @param amount - Amount in TL
 * @param decimals - Number of decimal places (default: 0 for whole numbers)
 * @returns Formatted string with TL suffix
 */
export function formatCurrency(amount: number, decimals: number = 0): string {
  return `${formatNumber(amount, decimals)} ₺`;
}

/**
 * Format large currency amounts with M (million) or K (thousand) suffix
 * @param amount - Amount in TL
 * @returns Formatted string (e.g., "16.6M ₺")
 */
export function formatCurrencyCompact(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(1)}M ₺`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(1)}K ₺`;
  }
  return `${amount.toFixed(0)} ₺`;
}
