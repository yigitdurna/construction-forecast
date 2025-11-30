import {
  ProjectInputs,
  CalculationResults,
  CostBreakdown,
  SalesProjection,
  ProfitSummary,
  TimelineData,
  MonthlySpend,
  CostDistribution,
} from '../types'
import {
  getLandPrice,
  AVERAGE_UNIT_SIZES,
} from '../data/referenceData'
import { getDefaultParameters } from '../data/parameterDefaults'
import { getSalesParametersForLocation, calculateSalesPriceFromParameters } from '../data/salesParameterDefaults'
import { getCostParametersForQuality, calculateTotalCostFromParameters } from '../data/costParameterDefaults'

/**
 * Get default construction duration based on project type and size
 */
export function getDefaultConstructionDuration(projectType: string, totalSqm: number): number {
  if (projectType === 'villa') {
    return totalSqm < 500 ? 10 : 14
  }

  // Apartment building
  if (totalSqm < 3000) return 14
  if (totalSqm < 8000) return 18
  return 24
}

/**
 * Generate S-curve cost distribution
 * Returns array of percentages (sum = 1.0) for each month
 */
export function generateSCurveDistribution(totalMonths: number): number[] {
  const distribution: number[] = []

  for (let month = 1; month <= totalMonths; month++) {
    // Logistic S-curve: cumulative progress at this month
    const t = month / totalMonths
    const scurveValue = 1 / (1 + Math.exp(-10 * (t - 0.5)))

    // Get previous cumulative value
    const tPrev = (month - 1) / totalMonths
    const scurvePrev = month === 1 ? 0 : 1 / (1 + Math.exp(-10 * (tPrev - 0.5)))

    // Monthly increment is difference between cumulative values
    const monthlyPercent = scurveValue - scurvePrev
    distribution.push(monthlyPercent)
  }

  // Normalize to ensure sum = 1
  const sum = distribution.reduce((a, b) => a + b, 0)
  return distribution.map(d => d / sum)
}

/**
 * Generate linear cost distribution
 * Returns array of equal percentages for each month
 */
export function generateLinearDistribution(totalMonths: number): number[] {
  const monthlyPercent = 1 / totalMonths
  return Array(totalMonths).fill(monthlyPercent)
}

/**
 * Calculate inflation-adjusted costs with monthly breakdown
 */
export function calculateInflationAdjustedCosts(
  totalNominalCost: number,
  constructionMonths: number,
  monthlyInflationRate: number,
  distribution: CostDistribution = 'scurve'
): {
  monthlyBreakdown: MonthlySpend[]
  totalNominalCost: number
  totalInflatedCost: number
  inflationImpactTL: number
  inflationImpactPercent: number
} {
  const monthlyPercents = distribution === 'scurve'
    ? generateSCurveDistribution(constructionMonths)
    : generateLinearDistribution(constructionMonths)

  const monthlyBreakdown: MonthlySpend[] = []
  let totalInflated = 0
  let cumulative = 0

  for (let month = 1; month <= constructionMonths; month++) {
    const percent = monthlyPercents[month - 1]
    cumulative += percent
    const nominal = totalNominalCost * percent

    // Compound inflation for this month's spend
    const inflationMultiplier = Math.pow(1 + monthlyInflationRate, month - 1)
    const inflated = nominal * inflationMultiplier

    totalInflated += inflated

    monthlyBreakdown.push({
      month,
      percentOfTotal: percent * 100,
      cumulativePercent: cumulative * 100,
      nominalAmountTL: nominal,
      inflatedAmountTL: inflated,
    })
  }

  return {
    monthlyBreakdown,
    totalNominalCost,
    totalInflatedCost: totalInflated,
    inflationImpactTL: totalInflated - totalNominalCost,
    inflationImpactPercent: ((totalInflated - totalNominalCost) / totalNominalCost) * 100,
  }
}

/**
 * DEFAULT_MONTHLY_DISCOUNT_RATE
 * 
 * This is the opportunity cost of capital - what you could earn if you invested
 * the money elsewhere instead of waiting for construction to complete.
 * 
 * Using 1.0% monthly (~12.7% annual) is reasonable for Turkey because:
 * - Risk-free rate (TL deposits): ~40-50% annual
 * - But real estate is relatively safe, so lower discount
 * - This is more conservative than using full inflation (2.5%/month)
 * 
 * The discount rate should be LOWER than inflation because:
 * - Real estate provides inflation protection
 * - The asset appreciates while you wait
 */
export const DEFAULT_MONTHLY_DISCOUNT_RATE = 0.01; // 1.0% monthly = ~12.7% annual

/**
 * Calculate future sales price with appreciation AND time value of money
 * NOTE: Appreciation only applies AFTER construction is complete
 * CRITICAL: Includes NPV discount - money received later is worth less today
 * 
 * @param monthlyDiscountRate - Opportunity cost of capital (default: 1% monthly)
 *                              This should be LOWER than inflation since real estate
 *                              provides inflation protection
 */
export function calculateFutureSalesPrice(
  currentPricePerSqm: number,
  netSaleableSqm: number,
  constructionMonths: number,
  monthsToSellAfterCompletion: number,
  monthlyAppreciationRate: number,
  monthlyDiscountRate: number = DEFAULT_MONTHLY_DISCOUNT_RATE
): {
  currentPricePerSqm: number
  projectedPricePerSqm: number
  currentTotalSales: number
  projectedTotalSales: number
  npvAdjustedSales: number
  appreciationImpactTL: number
  appreciationImpactPercent: number
  timeValueLoss: number
  monthsUntilSale: number
} {
  // Appreciation only applies AFTER construction completes, not during construction
  const appreciationMonths = monthsToSellAfterCompletion;
  const appreciationMultiplier = Math.pow(1 + monthlyAppreciationRate, appreciationMonths);

  const projectedPrice = currentPricePerSqm * appreciationMultiplier;
  const currentTotal = netSaleableSqm * currentPricePerSqm;
  const projectedTotal = netSaleableSqm * projectedPrice;

  // NPV CALCULATION: Discount future revenue to present value
  // Total months from today until sale = construction + waiting period
  const totalMonthsUntilSale = constructionMonths + monthsToSellAfterCompletion;

  // Use the provided discount rate (opportunity cost of capital)
  // NOT inflation - that's too aggressive for real estate
  const npvMultiplier = 1 / Math.pow(1 + monthlyDiscountRate, totalMonthsUntilSale);

  // Present value of future sales (what that future money is worth TODAY)
  const npvAdjustedSales = projectedTotal * npvMultiplier;

  // Time value loss: How much purchasing power we lose by waiting
  const timeValueLoss = projectedTotal - npvAdjustedSales;

  return {
    currentPricePerSqm,
    projectedPricePerSqm: projectedPrice,
    currentTotalSales: currentTotal,
    projectedTotalSales: projectedTotal,
    npvAdjustedSales,
    appreciationImpactTL: projectedTotal - currentTotal,
    appreciationImpactPercent: currentTotal > 0 
      ? ((projectedTotal - currentTotal) / currentTotal) * 100 
      : 0,
    timeValueLoss,
    monthsUntilSale: totalMonthsUntilSale,
  };
}

/**
 * Calculate timeline data with dates
 */
function calculateTimeline(
  inputs: ProjectInputs,
  constructionMonths: number,
  costDistribution: CostDistribution,
  monthlyInflationRate: number,
  monthlyAppreciationRate: number,
  monthlyDiscountRate: number,
  monthsToSell: number
): TimelineData {
  const startDate = inputs.startDate || new Date().toISOString().split('T')[0];
  const start = new Date(startDate);

  const completion = new Date(start);
  completion.setMonth(completion.getMonth() + constructionMonths);

  const sale = new Date(completion);
  sale.setMonth(sale.getMonth() + monthsToSell);

  return {
    constructionMonths,
    startDate,
    completionDate: completion.toISOString().split('T')[0],
    saleDate: sale.toISOString().split('T')[0],
    costDistribution,
    monthlyBreakdown: [], // Will be populated by cost calculation
    monthlyInflationRate,
    monthlyAppreciationRate,
    monthlyDiscountRate,
    monthsToSell,
  };
}

/**
 * Calculate all project costs including construction, land, permits, design, and contingency
 * UNIFIED: Always uses the detailed parameter system for consistency
 */
function calculateCosts(
  inputs: ProjectInputs,
  constructionMonths: number,
  monthlyInflationRate: number,
  costDistribution: CostDistribution,
  costOverrides?: Record<string, number>
): CostBreakdown {
  // Always use the detailed parameter system
  const costParams = getCostParametersForQuality(inputs.qualityLevel, costOverrides || {});
  const netSqm = inputs.totalSqm * 0.85; // Assume 85% net-to-gross ratio
  const numUnits = Math.max(1, Math.floor(inputs.totalSqm / AVERAGE_UNIT_SIZES[inputs.projectType]));
  
  // Use land size from inputs for foundation/landscaping calculations
  // If landSize is 0, estimate from totalSqm (assume 2-story average)
  const effectiveLandSqm = inputs.landSize > 0 ? inputs.landSize : Math.ceil(inputs.totalSqm / 2);

  const result = calculateTotalCostFromParameters(
    costParams,
    inputs.totalSqm,
    netSqm,
    effectiveLandSqm,
    numUnits
  );

  // Extract individual cost components from breakdown
  // Construction cost = total from parameters MINUS soft costs (permits, design, contingency, contractor margin)
  const softCostIds = ['permits', 'design_fees', 'contingency', 'contractor_margin'];
  let softCostsTotal = 0;
  softCostIds.forEach(id => {
    softCostsTotal += result.breakdown[id] || 0;
  });
  
  const constructionCost = result.totalCost - softCostsTotal;
  const permitsAndFees = result.breakdown['permits'] || 0;
  const design = result.breakdown['design_fees'] || 0;
  const contingency = (result.breakdown['contingency'] || 0) + (result.breakdown['contractor_margin'] || 0);

  // Land cost calculation:
  // 1. If direct landCost is provided, use it (user override)
  // 2. Otherwise, calculate from landSize × landPrice
  // 3. If landSize is 0, land cost is 0 (land already owned)
  let landCost = 0;
  if (inputs.landCost !== undefined && inputs.landCost > 0) {
    // Direct land cost input takes priority
    landCost = inputs.landCost;
  } else if (inputs.landSize > 0) {
    // Calculate from land size
    const landPricePerSqm = getLandPrice(inputs.location);
    landCost = landPricePerSqm * inputs.landSize;
  }

  // Total nominal cost = construction (from parameters) + land
  const totalNominalCost = result.totalCost + landCost;

  // Apply inflation to construction-related costs only
  // (land cost is paid upfront, so no inflation)
  const constructionRelatedCosts = result.totalCost;
  const inflationResult = calculateInflationAdjustedCosts(
    constructionRelatedCosts,
    constructionMonths,
    monthlyInflationRate,
    costDistribution
  );

  const totalInflatedCost = landCost + inflationResult.totalInflatedCost;
  const inflationImpact = inflationResult.totalInflatedCost - constructionRelatedCosts;

  return {
    constructionCost,
    landCost,
    permitsAndFees,
    design,
    contingency,
    totalNominalCost,
    totalInflatedCost,
    inflationImpactTL: inflationImpact,
    inflationImpactPercent: constructionRelatedCosts > 0 
      ? (inflationImpact / constructionRelatedCosts) * 100 
      : 0,
    totalCost: totalInflatedCost, // Legacy field
  };
}

/**
 * Calculate sales projections based on project type and quality
 * UNIFIED: Always uses location-aware sales parameters
 */
function calculateSales(
  inputs: ProjectInputs,
  constructionMonths: number,
  monthsToSell: number,
  monthlyAppreciationRate: number,
  monthlyDiscountRate: number, // NPV discount rate (separate from inflation)
  salesOverrides?: Record<string, number>
): SalesProjection {
  // Always use location-aware sales parameters
  const salesParams = getSalesParametersForLocation(
    inputs.location,
    inputs.projectType,
    inputs.qualityLevel,
    salesOverrides || {}
  );
  
  // Calculate price from parameters (which now include location intelligence)
  const priceResult = calculateSalesPriceFromParameters(salesParams, inputs.totalSqm);
  const currentPricePerSqm = priceResult.finalPricePerSqm;

  // Estimate number of units based on average unit size
  const averageUnitSize = AVERAGE_UNIT_SIZES[inputs.projectType];
  const estimatedUnits = Math.max(1, Math.floor(inputs.totalSqm / averageUnitSize));

  // Calculate future sales with appreciation AND NPV discount
  const futurePrice = calculateFutureSalesPrice(
    currentPricePerSqm,
    inputs.totalSqm,
    constructionMonths,
    monthsToSell,
    monthlyAppreciationRate,
    monthlyDiscountRate
  );

  return {
    averagePricePerSqm: currentPricePerSqm,
    totalRevenue: futurePrice.projectedTotalSales,
    estimatedUnits,
    ...futurePrice,
  };
}

/**
 * Calculate profit metrics (gross profit, margin, ROI)
 */
function calculateProfit(costs: CostBreakdown, sales: SalesProjection): ProfitSummary {
  // Scenario 1: Nominal (no time value - instant build and sell)
  const nominalProfit = sales.currentTotalSales - costs.totalNominalCost
  const nominalROI = (nominalProfit / costs.totalNominalCost) * 100
  const nominalMargin = (nominalProfit / sales.currentTotalSales) * 100

  // Scenario 2: Time-adjusted NPV (realistic - inflated costs, NPV-adjusted sales)
  // CRITICAL FIX: Use npvAdjustedSales instead of projectedTotalSales
  // This accounts for time value of money - longer waits now correctly reduce profit
  const projectedProfit = sales.npvAdjustedSales - costs.totalInflatedCost
  const projectedROI = (projectedProfit / costs.totalInflatedCost) * 100
  const projectedMargin = (projectedProfit / sales.npvAdjustedSales) * 100

  // Scenario 3: Pessimistic (inflated costs, no appreciation)
  const pessimisticProfit = sales.currentTotalSales - costs.totalInflatedCost
  const pessimisticROI = (pessimisticProfit / costs.totalInflatedCost) * 100
  const pessimisticMargin = (pessimisticProfit / sales.currentTotalSales) * 100

  return {
    nominalProfit,
    nominalROI,
    nominalMargin,
    projectedProfit,
    projectedROI,
    projectedMargin,
    pessimisticProfit,
    pessimisticROI,
    pessimisticMargin,
    // Legacy fields (use projected as default)
    grossProfit: projectedProfit,
    profitMargin: projectedMargin,
    roi: projectedROI,
  }
}

/**
 * Main calculation function that combines all calculations
 */
export function calculateProjectCosts(
  inputs: ProjectInputs,
  parameterOverrides?: {
    cost?: Record<string, number>;
    sales?: Record<string, number>;
  }
): CalculationResults {
  // Get defaults for optional inputs
  const constructionMonths = inputs.constructionMonths ??
    getDefaultConstructionDuration(inputs.projectType, inputs.totalSqm);
  const costDistribution = inputs.costDistribution ?? 'scurve';
  const monthlyInflationRate = inputs.monthlyInflationRate ?? 0.025; // 2.5% default
  const monthlyAppreciationRate = inputs.monthlyAppreciationRate ?? 0.015; // 1.5% default
  const monthsToSell = inputs.monthsToSellAfterCompletion ?? 6; // 6 months default
  
  // NPV discount rate - opportunity cost of capital
  // Default: 1% monthly (~12.7% annual) - lower than inflation because real estate provides inflation protection
  const monthlyDiscountRate = inputs.monthlyDiscountRate ?? DEFAULT_MONTHLY_DISCOUNT_RATE;

  // Generate parameters for transparency
  const parameters = getDefaultParameters(inputs, {
    constructionMonths,
    costDistribution,
    monthlyInflationRate,
    monthlyAppreciationRate,
    monthsToSell,
  });

  // Calculate timeline
  const timeline = calculateTimeline(
    inputs,
    constructionMonths,
    costDistribution,
    monthlyInflationRate,
    monthlyAppreciationRate,
    monthlyDiscountRate,
    monthsToSell
  );

  // Calculate costs, sales, and profit
  const costs = calculateCosts(inputs, constructionMonths, monthlyInflationRate, costDistribution, parameterOverrides?.cost);
  const sales = calculateSales(inputs, constructionMonths, monthsToSell, monthlyAppreciationRate, monthlyDiscountRate, parameterOverrides?.sales);
  const profit = calculateProfit(costs, sales);

  // Add monthly breakdown to timeline
  // Note: We use costs from the detailed parameter system now, so use totalNominalCost - landCost
  const constructionRelatedCosts = costs.totalNominalCost - costs.landCost;
  const inflationResult = calculateInflationAdjustedCosts(
    constructionRelatedCosts,
    constructionMonths,
    monthlyInflationRate,
    costDistribution
  );
  timeline.monthlyBreakdown = inflationResult.monthlyBreakdown;

  return {
    inputs,
    timeline,
    costs,
    sales,
    profit,
    parameters,
  };
}

/**
 * Format number as Turkish Lira currency
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100)
}

/**
 * Format number with thousand separators
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('tr-TR').format(value)
}
