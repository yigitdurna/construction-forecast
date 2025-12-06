/**
 * Currency Calculations for USD-Indexed Costs
 *
 * Phase 3.2 - Handle USD→TL conversion with labor inflation factors
 * Provides localStorage persistence for exchange rates
 */

import type {
  CostItemUSD,
  CostCategoryUSD,
  ExchangeRates,
  CostCalculation,
  CostBreakdownUSD,
} from '../types/costs';
import { DEFAULT_EXCHANGE_RATES, EXCHANGE_RATES_STORAGE_KEY } from '../types/costs';

/**
 * Calculate TL cost from USD base with separate labor inflation
 *
 * @param item - Cost item with USD base price and labor ratio
 * @param rates - Current exchange rates
 * @param laborInflationFactor - Additional inflation for labor (1.0 = no extra inflation)
 * @returns Cost in TL
 *
 * @example
 * const item = { perM2USD: 100, laborRatio: 0.3 }; // $100/m², 30% labor
 * const rates = { USDTRY: 34.50 };
 * const cost = calculateCostTL(item, rates, 1.2); // 20% extra labor inflation
 * // Material: $70 × 34.50 = 2,415 TL
 * // Labor: $30 × 34.50 × 1.2 = 1,242 TL
 * // Total: 3,657 TL
 */
export function calculateCostTL(
  item: CostItemUSD,
  rates: ExchangeRates,
  laborInflationFactor: number = 1.0
): number {
  const materialPortion = item.perM2USD * (1 - item.laborRatio);
  const laborPortion = item.perM2USD * item.laborRatio;

  // Materials follow USD closely (imported materials, commodities)
  const materialTL = materialPortion * rates.USDTRY;

  // Labor can be adjusted separately for local inflation
  const laborTL = laborPortion * rates.USDTRY * laborInflationFactor;

  return materialTL + laborTL;
}

/**
 * Calculate detailed cost breakdown (material vs labor)
 *
 * @param item - Cost item with USD base
 * @param rates - Exchange rates
 * @param laborInflationFactor - Labor inflation multiplier
 * @returns Detailed breakdown with material and labor portions
 */
export function calculateDetailedCost(
  item: CostItemUSD,
  rates: ExchangeRates,
  laborInflationFactor: number = 1.0
): {
  usd: number;
  tl: number;
  materialUSD: number;
  laborUSD: number;
  materialTL: number;
  laborTL: number;
} {
  const materialUSD = item.perM2USD * (1 - item.laborRatio);
  const laborUSD = item.perM2USD * item.laborRatio;

  const materialTL = materialUSD * rates.USDTRY;
  const laborTL = laborUSD * rates.USDTRY * laborInflationFactor;

  return {
    usd: item.perM2USD,
    tl: materialTL + laborTL,
    materialUSD,
    laborUSD,
    materialTL,
    laborTL,
  };
}

/**
 * Calculate total cost for a category
 *
 * @param category - Cost category with multiple items
 * @param rates - Exchange rates
 * @param laborInflationFactor - Labor inflation multiplier
 * @returns Total cost in both USD and TL
 */
export function calculateCategoryCost(
  category: CostCategoryUSD,
  rates: ExchangeRates,
  laborInflationFactor: number = 1.0
): CostCalculation {
  let totalUSD = 0;
  let totalTL = 0;
  let materialCostTL = 0;
  let laborCostTL = 0;

  category.items.forEach((item) => {
    const detailed = calculateDetailedCost(item, rates, laborInflationFactor);
    totalUSD += detailed.usd;
    totalTL += detailed.tl;
    materialCostTL += detailed.materialTL;
    laborCostTL += detailed.laborTL;
  });

  return {
    perM2USD: totalUSD,
    perM2TL: totalTL,
    totalUSD,
    totalTL,
    materialCostTL,
    laborCostTL,
  };
}

/**
 * Calculate complete cost breakdown for all categories
 *
 * @param categories - All cost categories
 * @param rates - Exchange rates
 * @param laborInflationFactor - Labor inflation multiplier
 * @returns Complete breakdown with totals
 */
export function calculateFullBreakdown(
  categories: CostCategoryUSD[],
  rates: ExchangeRates,
  laborInflationFactor: number = 1.0
): CostBreakdownUSD {
  let totalPerM2USD = 0;
  let totalPerM2TL = 0;

  categories.forEach((category) => {
    const categoryCalc = calculateCategoryCost(category, rates, laborInflationFactor);
    totalPerM2USD += categoryCalc.perM2USD;
    totalPerM2TL += categoryCalc.perM2TL;
  });

  return {
    categories,
    exchangeRates: rates,
    laborInflationFactor,
    totalPerM2USD,
    totalPerM2TL,
  };
}

/**
 * Calculate project total costs
 *
 * @param categories - Cost categories
 * @param totalAreaM2 - Total construction area in m²
 * @param rates - Exchange rates
 * @param laborInflationFactor - Labor inflation multiplier
 * @returns Total project cost in USD and TL
 */
export function calculateProjectTotalCost(
  categories: CostCategoryUSD[],
  totalAreaM2: number,
  rates: ExchangeRates,
  laborInflationFactor: number = 1.0
): CostCalculation {
  const breakdown = calculateFullBreakdown(categories, rates, laborInflationFactor);

  let totalMaterialCostTL = 0;
  let totalLaborCostTL = 0;

  categories.forEach((category) => {
    const categoryCalc = calculateCategoryCost(category, rates, laborInflationFactor);
    totalMaterialCostTL += categoryCalc.materialCostTL;
    totalLaborCostTL += categoryCalc.laborCostTL;
  });

  return {
    perM2USD: breakdown.totalPerM2USD,
    perM2TL: breakdown.totalPerM2TL,
    totalUSD: breakdown.totalPerM2USD * totalAreaM2,
    totalTL: breakdown.totalPerM2TL * totalAreaM2,
    materialCostTL: totalMaterialCostTL * totalAreaM2,
    laborCostTL: totalLaborCostTL * totalAreaM2,
  };
}

/**
 * Load exchange rates from localStorage
 *
 * @returns Saved exchange rates or default if none found
 */
export function loadExchangeRates(): ExchangeRates {
  try {
    const stored = localStorage.getItem(EXCHANGE_RATES_STORAGE_KEY);
    if (!stored) {
      return DEFAULT_EXCHANGE_RATES;
    }

    const parsed = JSON.parse(stored);

    // Convert lastUpdated string back to Date
    if (parsed.lastUpdated) {
      parsed.lastUpdated = new Date(parsed.lastUpdated);
    }

    // Validate required fields
    if (
      typeof parsed.USDTRY === 'number' &&
      typeof parsed.EURTRY === 'number' &&
      parsed.lastUpdated instanceof Date
    ) {
      return parsed as ExchangeRates;
    }

    return DEFAULT_EXCHANGE_RATES;
  } catch (error) {
    console.error('Failed to load exchange rates from localStorage:', error);
    return DEFAULT_EXCHANGE_RATES;
  }
}

/**
 * Save exchange rates to localStorage
 *
 * @param rates - Exchange rates to save
 */
export function saveExchangeRates(rates: ExchangeRates): void {
  try {
    localStorage.setItem(EXCHANGE_RATES_STORAGE_KEY, JSON.stringify(rates));
  } catch (error) {
    console.error('Failed to save exchange rates to localStorage:', error);
  }
}

/**
 * Fetch current exchange rates from TCMB (Turkish Central Bank)
 *
 * NOTE: This is an on-click operation, not auto-fetched on page load
 *
 * @returns Promise with latest exchange rates or null if failed
 */
export async function fetchTCMBRates(): Promise<ExchangeRates | null> {
  try {
    // TCMB XML endpoint (updated daily around 15:30 Istanbul time)
    const response = await fetch('https://www.tcmb.gov.tr/kurlar/today.xml');

    if (!response.ok) {
      throw new Error(`TCMB API error: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

    // Extract USD/TRY rate
    const usdNode = xmlDoc.querySelector('Currency[CurrencyCode="USD"] ForexSelling');
    const usdRate = usdNode ? parseFloat(usdNode.textContent || '0') : null;

    // Extract EUR/TRY rate
    const eurNode = xmlDoc.querySelector('Currency[CurrencyCode="EUR"] ForexSelling');
    const eurRate = eurNode ? parseFloat(eurNode.textContent || '0') : null;

    if (!usdRate || !eurRate) {
      throw new Error('Could not parse TCMB rates');
    }

    const rates: ExchangeRates = {
      USDTRY: usdRate,
      EURTRY: eurRate,
      lastUpdated: new Date(),
      source: 'tcmb',
    };

    // Save to localStorage
    saveExchangeRates(rates);

    return rates;
  } catch (error) {
    console.error('Failed to fetch TCMB rates:', error);
    return null;
  }
}

/**
 * Get age of stored exchange rates in hours
 *
 * @returns Number of hours since last update, or null if no stored rates
 */
export function getExchangeRateAge(): number | null {
  const rates = loadExchangeRates();

  if (!rates.lastUpdated) {
    return null;
  }

  const now = new Date();
  const ageMs = now.getTime() - rates.lastUpdated.getTime();
  return ageMs / (1000 * 60 * 60); // Convert to hours
}

/**
 * Check if stored exchange rates are outdated (> 24 hours)
 *
 * @returns True if rates should be refreshed
 */
export function areRatesOutdated(): boolean {
  const age = getExchangeRateAge();
  return age === null || age > 24;
}

/**
 * Format exchange rate for display
 *
 * @param rate - Exchange rate value
 * @returns Formatted string (e.g., "34.50")
 */
export function formatExchangeRate(rate: number): string {
  return rate.toFixed(2);
}

/**
 * Create manual exchange rates entry
 *
 * @param usdTry - USD to TRY rate
 * @param eurTry - EUR to TRY rate
 * @returns Exchange rates object
 */
export function createManualRates(usdTry: number, eurTry: number): ExchangeRates {
  return {
    USDTRY: usdTry,
    EURTRY: eurTry,
    lastUpdated: new Date(),
    source: 'manual',
  };
}
