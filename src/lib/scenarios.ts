import { CalculationResults } from '../types';
import {
  calculateInflationAdjustedCosts,
  calculateFutureSalesPrice,
  DEFAULT_MONTHLY_DISCOUNT_RATE
} from '../utils/calculations';

export interface ScenarioConfig {
  name: 'optimistic' | 'realistic' | 'pessimistic';
  labelTR: string;

  // Cost adjustments
  costVariance: number;              // Multiplier: 0.9 = 10% under budget
  inflationRateAdjustment: number;   // Additive: -0.005 = 0.5% lower monthly

  // Sales adjustments
  salesVariance: number;             // Multiplier: 1.1 = 10% higher prices
  appreciationRateAdjustment: number; // Additive

  // Timeline adjustments
  timelineVariance: number;          // Multiplier: 1.2 = 20% longer

  description: string;
  descriptionTR: string;
}

export interface ScenarioResult {
  scenario: string;
  labelTR: string;
  totalCostTL: number;
  totalSalesTL: number;
  npvSalesTL: number;
  profitTL: number;
  roiPercent: number;
  marginPercent: number;
  timelineMonths: number;
  assumptions: {
    costVariance: string;
    salesVariance: string;
    inflationRate: string;
    appreciationRate: string;
    timelineChange: string;
  };
}

export const SCENARIO_CONFIGS: ScenarioConfig[] = [
  {
    name: 'optimistic',
    labelTR: 'İyimser',
    costVariance: 0.92,              // 8% under budget
    inflationRateAdjustment: -0.005, // Lower inflation (2.0% instead of 2.5%)
    salesVariance: 1.08,             // 8% higher prices
    appreciationRateAdjustment: 0.005, // Faster appreciation (2.0% instead of 1.5%)
    timelineVariance: 0.9,           // 10% faster
    description: 'Best case: efficient execution, strong market',
    descriptionTR: 'En iyi durum: verimli uygulama, güçlü piyasa',
  },
  {
    name: 'realistic',
    labelTR: 'Gerçekçi',
    costVariance: 1.0,               // Base case
    inflationRateAdjustment: 0,
    salesVariance: 1.0,
    appreciationRateAdjustment: 0,
    timelineVariance: 1.0,
    description: 'Expected case: normal conditions',
    descriptionTR: 'Beklenen durum: normal koşullar',
  },
  {
    name: 'pessimistic',
    labelTR: 'Kötümser',
    costVariance: 1.15,              // 15% over budget
    inflationRateAdjustment: 0.01,   // Higher inflation (3.5% instead of 2.5%)
    salesVariance: 0.92,             // 8% lower prices
    appreciationRateAdjustment: -0.01, // Slower appreciation (0.5% instead of 1.5%)
    timelineVariance: 1.20,          // 20% delays
    description: 'Worst case: delays, cost overruns, weak market',
    descriptionTR: 'Kötü durum: gecikmeler, maliyet aşımı, zayıf piyasa',
  },
];

/**
 * Calculate a scenario by properly recalculating with adjusted parameters
 * This ensures inflation curves and NPV are correctly computed
 */
export function calculateScenario(
  baseResult: CalculationResults,
  scenario: ScenarioConfig
): ScenarioResult {
  const { inputs, timeline } = baseResult;
  
  // Adjust timeline
  const adjustedConstructionMonths = Math.round(
    timeline.constructionMonths * scenario.timelineVariance
  );
  const adjustedMonthsToSell = timeline.monthsToSell || 6;
  const totalMonths = adjustedConstructionMonths + adjustedMonthsToSell;

  // Adjust rates
  const adjustedInflation = Math.max(0, timeline.monthlyInflationRate + scenario.inflationRateAdjustment);
  const adjustedAppreciation = timeline.monthlyAppreciationRate + scenario.appreciationRateAdjustment;
  const discountRate = timeline.monthlyDiscountRate || DEFAULT_MONTHLY_DISCOUNT_RATE;

  // PROPERLY RECALCULATE COSTS with adjusted inflation and timeline
  // Start with nominal cost (before inflation)
  const nominalConstructionCost = baseResult.costs.totalNominalCost - baseResult.costs.landCost;
  
  // Apply cost variance (under/over budget)
  const adjustedNominalCost = nominalConstructionCost * scenario.costVariance;
  
  // Recalculate inflation impact with adjusted rate and timeline
  const inflationResult = calculateInflationAdjustedCosts(
    adjustedNominalCost,
    adjustedConstructionMonths,
    adjustedInflation,
    timeline.costDistribution
  );
  
  // Total adjusted cost = land (upfront) + inflated construction costs
  const totalAdjustedCost = baseResult.costs.landCost + inflationResult.totalInflatedCost;

  // PROPERLY RECALCULATE SALES with adjusted appreciation and timeline
  // Start with current price per sqm
  const currentPricePerSqm = baseResult.sales.currentPricePerSqm * scenario.salesVariance;
  
  // Recalculate future sales with adjusted appreciation and NPV
  const salesResult = calculateFutureSalesPrice(
    currentPricePerSqm,
    inputs.totalSqm,
    adjustedConstructionMonths,
    adjustedMonthsToSell,
    adjustedAppreciation,
    discountRate
  );

  // Calculate profit using NPV-adjusted sales (realistic)
  const profit = salesResult.npvAdjustedSales - totalAdjustedCost;

  return {
    scenario: scenario.name,
    labelTR: scenario.labelTR,
    totalCostTL: totalAdjustedCost,
    totalSalesTL: salesResult.projectedTotalSales,
    npvSalesTL: salesResult.npvAdjustedSales,
    profitTL: profit,
    roiPercent: totalAdjustedCost > 0 ? (profit / totalAdjustedCost) * 100 : 0,
    marginPercent: salesResult.npvAdjustedSales > 0 ? (profit / salesResult.npvAdjustedSales) * 100 : 0,
    timelineMonths: totalMonths,
    assumptions: {
      costVariance: `${((scenario.costVariance - 1) * 100).toFixed(0)}%`,
      salesVariance: `${((scenario.salesVariance - 1) * 100).toFixed(0)}%`,
      inflationRate: `${(adjustedInflation * 100).toFixed(1)}%/ay`,
      appreciationRate: `${(adjustedAppreciation * 100).toFixed(1)}%/ay`,
      timelineChange: `${((scenario.timelineVariance - 1) * 100).toFixed(0)}%`,
    },
  };
}

/**
 * Calculate all three scenarios
 */
export function calculateAllScenarios(baseResult: CalculationResults): ScenarioResult[] {
  return SCENARIO_CONFIGS.map(config => calculateScenario(baseResult, config));
}

/**
 * Get scenario by name
 */
export function getScenarioByName(name: 'optimistic' | 'realistic' | 'pessimistic'): ScenarioConfig {
  return SCENARIO_CONFIGS.find(c => c.name === name) || SCENARIO_CONFIGS[1]; // Default to realistic
}
