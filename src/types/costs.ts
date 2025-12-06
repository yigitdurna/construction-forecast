/**
 * USD-Indexed Cost Types
 *
 * Phase 3.2 - Store costs in USD to handle TL currency volatility
 * Costs are stored in USD base and converted to TL using exchange rates
 */

/**
 * Single cost item with USD base price
 */
export interface CostItemUSD {
  id: string;
  name: string;           // English name
  nameTR: string;         // Turkish name
  perM2USD: number;       // Base cost in USD per m²
  perM2EUR?: number;      // Optional EUR base price
  laborRatio: number;     // 0.0-1.0, portion that's labor cost
  description?: string;   // Optional description
}

/**
 * Cost category containing multiple items
 */
export interface CostCategoryUSD {
  id: string;
  name: string;           // English name
  nameTR: string;         // Turkish name
  items: CostItemUSD[];
}

/**
 * Exchange rates for currency conversion
 */
export interface ExchangeRates {
  USDTRY: number;         // USD to TRY exchange rate
  EURTRY: number;         // EUR to TRY exchange rate
  lastUpdated: Date;      // When rates were last updated
  source: 'manual' | 'tcmb' | 'api';  // Where rates came from
}

/**
 * Cost calculation result in both USD and TL
 */
export interface CostCalculation {
  perM2USD: number;       // Cost in USD/m²
  perM2TL: number;        // Cost in TL/m² (converted)
  totalUSD: number;       // Total cost in USD
  totalTL: number;        // Total cost in TL
  materialCostTL: number; // Material portion in TL
  laborCostTL: number;    // Labor portion in TL
}

/**
 * Complete cost breakdown with USD base
 */
export interface CostBreakdownUSD {
  categories: CostCategoryUSD[];
  exchangeRates: ExchangeRates;
  laborInflationFactor: number;  // Additional inflation factor for labor (1.0 = no extra inflation)
  totalPerM2USD: number;          // Sum of all items in USD
  totalPerM2TL: number;           // Total converted to TL
}

/**
 * Default exchange rates (as of December 2025)
 */
export const DEFAULT_EXCHANGE_RATES: ExchangeRates = {
  USDTRY: 34.50,
  EURTRY: 36.50,
  lastUpdated: new Date(),
  source: 'manual',
};

/**
 * localStorage key for exchange rates
 */
export const EXCHANGE_RATES_STORAGE_KEY = 'construction-forecast-exchange-rates';
