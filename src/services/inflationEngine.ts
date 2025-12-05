/**
 * Inflation Engine
 *
 * Turkish construction and real estate inflation modeling
 * Based on TCMB (Turkish Central Bank) data and construction sector trends
 *
 * Data sources:
 * - TCMB: General inflation (TÜFE - Consumer Price Index)
 * - TÜİK: Construction PPI (İnşaat Üretici Fiyat Endeksi)
 * - Market research: Material-specific inflation rates
 *
 * Last updated: December 2024
 */

/**
 * Inflation Configuration
 *
 * All rates are annual (decimal format)
 * Example: 0.45 = 45% annual inflation
 */
export interface InflationConfig {
  /**
   * General CPI - TÜFE (Tüketici Fiyat Endeksi)
   * Consumer price index used for general economic tracking
   */
  generalCPI: number;

  /**
   * Construction PPI - İnşaat PPI
   * Producer price index specific to construction sector
   * Typically higher than general CPI due to material volatility
   */
  constructionPPI: number;

  /**
   * Material-specific inflation rates
   * Different materials experience different inflation levels
   */
  materialInflation: {
    steel: number;      // Demir/Çelik - highly volatile, import-dependent
    cement: number;     // Çimento - domestic production
    labor: number;      // İşçilik - tracks minimum wage increases
    energy: number;     // Enerji - electricity, fuel for machinery
    imported: number;   // İthal malzeme - USD/TRY exchange rate dependent
  };

  /**
   * Property Appreciation - Konut değer artışı
   * Average real estate value increase
   * Typically lower than general inflation in mature markets
   */
  propertyAppreciation: number;

  /**
   * Interest Rate - Faiz oranı
   * Opportunity cost of capital
   * Could invest money elsewhere at this rate
   */
  interestRate: number;

  /**
   * Description of scenario
   */
  name: string;
  description: string;
}

/**
 * Turkish Economic Data (2024-2025 Estimates)
 *
 * Based on TCMB projections and construction industry reports
 * Updated quarterly
 */
export const TURKEY_INFLATION_2024: InflationConfig = {
  name: 'Türkiye 2024-2025 Baz Senaryo',
  description: 'TCMB ve TÜİK verilerine dayalı güncel enflasyon tahminleri',

  // General inflation: ~45% annual (TCMB target, actual may vary)
  generalCPI: 0.45,

  // Construction PPI: Higher than CPI due to input costs
  constructionPPI: 0.52,

  materialInflation: {
    // Steel: Very volatile, import-dependent, USD exposure
    steel: 0.55,

    // Cement: Domestic production, more stable
    cement: 0.40,

    // Labor: Follows minimum wage increases + demand
    labor: 0.50,

    // Energy: Electricity and fuel costs
    energy: 0.60,

    // Imported materials: Depends on USD/TRY exchange rate
    // Lower than you'd expect because TRY depreciation partially offset by global prices
    imported: 0.35,
  },

  // Property appreciation: Real estate value growth
  // Historically 30-40% in major Turkish cities
  propertyAppreciation: 0.35,

  // Interest rate: Opportunity cost (TCMB policy rate ~45%)
  interestRate: 0.45,
};

/**
 * Scenario Definitions
 *
 * Three scenarios for sensitivity analysis:
 * - Optimistic: Economy stabilizes, inflation decreases
 * - Base: Current trends continue
 * - Pessimistic: Economic deterioration, higher inflation
 */
export interface ScenarioMultipliers {
  name: string;
  description: string;
  multiplier: number; // Applied to base rates
}

export const INFLATION_SCENARIOS = {
  /**
   * Optimistic Scenario
   *
   * Assumptions:
   * - Successful disinflation policy
   * - TRY stabilization
   * - Economic reform progress
   */
  optimistic: {
    name: 'İyimser',
    description: 'Enflasyon düşüşü, ekonomik stabilizasyon',
    multiplier: 0.7, // 30% lower inflation than base
  } as ScenarioMultipliers,

  /**
   * Base Scenario
   *
   * Assumptions:
   * - Current economic trends continue
   * - No major shocks
   * - Gradual policy adjustments
   */
  base: {
    name: 'Gerçekçi (Baz)',
    description: 'Mevcut trend devam eder',
    multiplier: 1.0, // Use base rates as-is
  } as ScenarioMultipliers,

  /**
   * Pessimistic Scenario
   *
   * Assumptions:
   * - Inflation acceleration
   * - TRY depreciation continues
   * - Economic challenges persist
   */
  pessimistic: {
    name: 'Kötümser',
    description: 'Enflasyon artışı, TL değer kaybı',
    multiplier: 1.4, // 40% higher inflation than base
  } as ScenarioMultipliers,
};

/**
 * Apply scenario to base inflation config
 */
export function applyScenario(
  baseConfig: InflationConfig,
  scenario: ScenarioMultipliers
): InflationConfig {
  return {
    ...baseConfig,
    name: `${baseConfig.name} - ${scenario.name}`,
    description: scenario.description,
    generalCPI: baseConfig.generalCPI * scenario.multiplier,
    constructionPPI: baseConfig.constructionPPI * scenario.multiplier,
    materialInflation: {
      steel: baseConfig.materialInflation.steel * scenario.multiplier,
      cement: baseConfig.materialInflation.cement * scenario.multiplier,
      labor: baseConfig.materialInflation.labor * scenario.multiplier,
      energy: baseConfig.materialInflation.energy * scenario.multiplier,
      imported: baseConfig.materialInflation.imported * scenario.multiplier,
    },
    propertyAppreciation: baseConfig.propertyAppreciation * (1 + (scenario.multiplier - 1) * 0.7),
    interestRate: baseConfig.interestRate * scenario.multiplier,
  };
}

/**
 * Convert annual rate to monthly rate
 *
 * Uses compound interest formula: (1 + annual)^(1/12) - 1
 */
export function annualToMonthly(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / 12) - 1;
}

/**
 * Convert monthly rate to annual rate
 *
 * Uses compound interest formula: (1 + monthly)^12 - 1
 */
export function monthlyToAnnual(monthlyRate: number): number {
  return Math.pow(1 + monthlyRate, 12) - 1;
}

/**
 * Calculate compound inflation over multiple months
 *
 * @param baseAmount - Starting amount
 * @param monthlyRate - Monthly inflation rate (decimal)
 * @param months - Number of months
 * @returns Inflated amount
 */
export function applyCompoundInflation(
  baseAmount: number,
  monthlyRate: number,
  months: number
): number {
  return baseAmount * Math.pow(1 + monthlyRate, months);
}

/**
 * Calculate inflation-adjusted cost distribution
 *
 * Distributes total cost over timeline with inflation applied
 *
 * @param totalBaseCost - Base cost (today's prices)
 * @param distribution - Percentage distribution by month (must sum to 1.0)
 * @param monthlyInflation - Monthly inflation rate
 * @returns Array of inflated costs per month
 */
export function calculateInflatedCosts(
  totalBaseCost: number,
  distribution: number[],
  monthlyInflation: number
): number[] {
  return distribution.map((percent, month) => {
    const baseCost = totalBaseCost * percent;
    return applyCompoundInflation(baseCost, monthlyInflation, month);
  });
}

/**
 * Get monthly inflation rate for specific material category
 */
export function getMaterialMonthlyInflation(
  config: InflationConfig,
  category: keyof InflationConfig['materialInflation']
): number {
  return annualToMonthly(config.materialInflation[category]);
}

/**
 * Historical data for reference (optional)
 *
 * This can be expanded to include historical Turkish inflation data
 * for backtesting and model validation
 */
export const HISTORICAL_DATA = {
  '2023': {
    generalCPI: 0.64, // 64% annual in 2023
    constructionPPI: 0.68,
  },
  '2024-Q1': {
    generalCPI: 0.68, // Peak inflation
    constructionPPI: 0.72,
  },
  '2024-Q4': {
    generalCPI: 0.47, // Disinflation progress
    constructionPPI: 0.52,
  },
};

/**
 * Regional adjustments (optional enhancement)
 *
 * Different Turkish regions may experience different inflation rates
 * especially for labor and local materials
 */
export const REGIONAL_MULTIPLIERS = {
  istanbul: 1.05, // Higher costs in major metro
  ankara: 1.02,
  izmir: 1.00,
  antalya: 0.98, // Slightly lower than national average
  other: 0.95,
};

/**
 * Get full inflation configuration for a scenario
 */
export function getInflationConfig(
  scenarioName: keyof typeof INFLATION_SCENARIOS = 'base'
): InflationConfig {
  const scenario = INFLATION_SCENARIOS[scenarioName];
  return applyScenario(TURKEY_INFLATION_2024, scenario);
}

/**
 * Calculate effective annual rate from monthly compounding
 *
 * Helper for displaying annual equivalents
 */
export function effectiveAnnualRate(monthlyRate: number): number {
  return monthlyToAnnual(monthlyRate);
}

/**
 * Format inflation rate for display
 */
export function formatInflationRate(rate: number, asAnnual = true): string {
  const displayRate = asAnnual ? rate : monthlyToAnnual(rate);
  return `%${(displayRate * 100).toFixed(1)}`;
}

export default {
  TURKEY_INFLATION_2024,
  INFLATION_SCENARIOS,
  applyScenario,
  annualToMonthly,
  monthlyToAnnual,
  applyCompoundInflation,
  calculateInflatedCosts,
  getMaterialMonthlyInflation,
  getInflationConfig,
  effectiveAnnualRate,
  formatInflationRate,
};
