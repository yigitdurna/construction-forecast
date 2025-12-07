/**
 * Application Constants
 *
 * This file centralizes all magic numbers used throughout the application
 * for easier maintenance and configuration.
 */

// ============ CALCULATION CONSTANTS ============

/**
 * Net to Gross Ratio: Percentage of total area that is saleable
 * CORRECTED: Real project data (ÖZGÜNTUR RELIFE UNIQUE) shows 76.9%
 * Previously assumed 85%, but actual measurement from DXF files shows ~77%
 * This accounts for common areas, walls, corridors, and mechanical spaces
 */
export const NET_TO_GROSS_RATIO = 0.77

/**
 * S-Curve Distribution Parameters
 * These control the shape of the logistic S-curve for cost distribution
 */
export const S_CURVE_STEEPNESS = 10  // Higher = steeper curve
export const S_CURVE_MIDPOINT = 0.5  // 50% of timeline

/**
 * Default Economic Parameters (November 2025)
 */
export const DEFAULT_MONTHLY_INFLATION_RATE = 0.025  // 2.5% monthly (~34% annual)
export const DEFAULT_MONTHLY_APPRECIATION_RATE = 0.015  // 1.5% monthly (~20% annual)
export const DEFAULT_MONTHLY_DISCOUNT_RATE = 0.01  // 1% monthly (~12.7% annual)
export const DEFAULT_MONTHS_TO_SELL = 6  // Months after completion to sell units

/**
 * Construction Duration Defaults (months)
 */
export const CONSTRUCTION_DURATION = {
  VILLA_SMALL: 10,          // < 500 m²
  VILLA_LARGE: 14,          // >= 500 m²
  APARTMENT_SMALL: 14,      // < 3000 m²
  APARTMENT_MEDIUM: 18,     // 3000-8000 m²
  APARTMENT_LARGE: 24,      // > 8000 m²
} as const

/**
 * Size Thresholds for Duration Calculation (m²)
 */
export const SIZE_THRESHOLDS = {
  VILLA_SMALL_MAX: 500,
  APARTMENT_SMALL_MAX: 3000,
  APARTMENT_MEDIUM_MAX: 8000,
} as const

// ============ VALIDATION CONSTANTS ============

/**
 * Validation Limits
 */
export const VALIDATION_LIMITS = {
  // Economic rates (as decimals)
  MIN_MONTHLY_INFLATION: -0.05,    // -5% monthly (deflation)
  MAX_MONTHLY_INFLATION: 0.20,     // 20% monthly (hyperinflation)
  MIN_MONTHLY_APPRECIATION: -0.10, // -10% monthly
  MAX_MONTHLY_APPRECIATION: 0.30,  // 30% monthly
  MAX_MONTHLY_DISCOUNT: 0.30,      // 30% monthly

  // Construction duration (months)
  MIN_CONSTRUCTION_MONTHS: 3,
  MAX_CONSTRUCTION_MONTHS: 60,

  // Selling period (months)
  MAX_MONTHS_TO_SELL: 48,

  // EMSAL (Floor Area Ratio)
  MAX_REALISTIC_EMSAL: 10,

  // Total area (m²)
  MAX_REALISTIC_TOTAL_SQM: 1000000,

  // EMSAL constraint tolerance (%)
  EMSAL_TOLERANCE: 0.10,  // 10% over limit allowed for rounding
} as const

// ============ UI CONSTANTS ============

/**
 * Number Formatting
 */
export const NUMBER_FORMAT = {
  LOCALE: 'tr-TR',
  CURRENCY: 'TL',
  MAX_DECIMAL_PLACES: 1,
} as const

/**
 * Form Validation Messages
 */
export const VALIDATION_MESSAGES = {
  REQUIRED_FIELD: 'Bu alan zorunludur',
  INVALID_NUMBER: 'Geçerli bir sayı giriniz',
  NEGATIVE_NUMBER: 'Değer negatif olamaz',
  OUT_OF_RANGE: 'Değer geçerli aralıkta değil',
} as const

// ============ SCENARIO ANALYSIS CONSTANTS ============

/**
 * Three-Scenario Analysis Parameters
 */
export const SCENARIO_ADJUSTMENTS = {
  OPTIMISTIC: {
    COST_VARIANCE: -0.08,           // 8% under budget
    SALES_VARIANCE: 0.08,            // 8% higher prices
    INFLATION_DELTA: -0.005,         // -0.5% monthly (2.0% instead of 2.5%)
    APPRECIATION_DELTA: 0.005,       // +0.5% monthly (2.0% instead of 1.5%)
    TIMELINE_FACTOR: 0.90,           // 10% faster (0.9x)
  },
  REALISTIC: {
    COST_VARIANCE: 0,                // Base case
    SALES_VARIANCE: 0,               // Base case
    INFLATION_DELTA: 0,              // Base case
    APPRECIATION_DELTA: 0,           // Base case
    TIMELINE_FACTOR: 1.0,            // Normal timeline
  },
  PESSIMISTIC: {
    COST_VARIANCE: 0.15,             // 15% over budget
    SALES_VARIANCE: -0.08,           // 8% lower prices
    INFLATION_DELTA: 0.010,          // +1.0% monthly (3.5% instead of 2.5%)
    APPRECIATION_DELTA: -0.010,      // -1.0% monthly (0.5% instead of 1.5%)
    TIMELINE_FACTOR: 1.20,           // 20% delays (1.2x)
  },
} as const

// ============ DATA QUALITY CONSTANTS ============

/**
 * Data Staleness Thresholds
 */
export const DATA_QUALITY = {
  FRESH_DAYS: 30,      // Data updated within 30 days = fresh
  STALE_DAYS: 90,      // Data older than 90 days = stale
  OUTDATED_DAYS: 180,  // Data older than 180 days = outdated
} as const

/**
 * Confidence Level Scores
 */
export const CONFIDENCE_LEVELS = {
  HIGH: 'high',     // Real market data, recently updated
  MEDIUM: 'medium', // Estimated data or moderately old
  LOW: 'low',       // Fallback defaults or very old data
} as const

// ============ COST BREAKDOWN PERCENTAGES ============

/**
 * Legacy Cost Multipliers (from referenceData.ts)
 * These are kept for backwards compatibility
 */
export const COST_MULTIPLIERS = {
  PERMITS_AND_FEES: 0.08,  // 8% of construction cost
  DESIGN: 0.05,            // 5% of construction cost
  CONTINGENCY: 0.10,       // 10% of total costs (buffer)
} as const

// ============ EXPORT HELPERS ============

/**
 * Helper to check if a value is a valid percentage (0-1)
 */
export function isValidPercentage(value: number): boolean {
  return isFinite(value) && value >= -1 && value <= 2
}

/**
 * Helper to check if a value is a valid monetary amount
 */
export function isValidMonetaryAmount(value: number): boolean {
  return isFinite(value) && value >= 0
}

/**
 * Helper to check if inflation rate is within safe bounds
 */
export function isSafeInflationRate(rate: number): boolean {
  return (
    rate >= VALIDATION_LIMITS.MIN_MONTHLY_INFLATION &&
    rate <= VALIDATION_LIMITS.MAX_MONTHLY_INFLATION
  )
}
