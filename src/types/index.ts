export type ProjectType =
  | 'apartment'
  | 'apartment_with_pool'
  | 'villa'
  | 'villa_with_pool'
  | 'mixed'
  | 'commercial'
  | 'mixed_use' // Commercial + Residential

export type QualityLevel = 'standard' | 'mid' | 'luxury'

export type CostDistribution = 'linear' | 'scurve'

export type ParameterSource = 'default' | 'user_input' | 'user' | 'calculated' | 'district_data'

export interface ProjectInputs {
  location: string
  landSize: number // m² - used to calculate land cost if landCost is not provided
  emsal: number // Floor Area Ratio
  projectType: ProjectType
  qualityLevel: QualityLevel
  totalSqm: number // Total construction area m²
  // Land cost can be provided directly (optional)
  // If provided, it overrides the calculated land cost from landSize × landPrice
  landCost?: number // TL - direct land cost input
  // Timeline inputs (optional, will use defaults if not provided)
  constructionMonths?: number
  startDate?: string
  costDistribution?: CostDistribution
  monthlyInflationRate?: number
  monthlyAppreciationRate?: number
  monthsToSellAfterCompletion?: number
  // NPV discount rate (opportunity cost of capital)
  // Default: 1% monthly (~12.7% annual) - lower than inflation because real estate provides inflation protection
  monthlyDiscountRate?: number
}

export interface MonthlySpend {
  month: number
  percentOfTotal: number
  cumulativePercent: number
  nominalAmountTL: number      // Without inflation
  inflatedAmountTL: number     // With inflation applied
}

export interface TimelineData {
  constructionMonths: number
  startDate: string
  completionDate: string
  saleDate: string
  costDistribution: CostDistribution
  monthlyBreakdown: MonthlySpend[]
  monthlyInflationRate: number
  monthlyAppreciationRate: number
  monthlyDiscountRate: number // NPV discount rate for time value of money
  monthsToSell?: number
}

export interface CostBreakdown {
  constructionCost: number
  landCost: number
  permitsAndFees: number
  design: number
  contingency: number
  totalNominalCost: number        // Before inflation
  totalInflatedCost: number       // After inflation (real cost)
  inflationImpactTL: number
  inflationImpactPercent: number
  // Legacy field for backwards compatibility
  totalCost: number  // Same as totalInflatedCost
}

export interface SalesProjection {
  averagePricePerSqm: number
  totalRevenue: number
  estimatedUnits: number
  // New fields for timeline modeling
  currentPricePerSqm: number
  projectedPricePerSqm: number
  currentTotalSales: number
  projectedTotalSales: number
  npvAdjustedSales: number // NPV: Present value of future sales
  appreciationImpactTL: number
  appreciationImpactPercent: number
  timeValueLoss: number // NPV: Loss due to time value of money
  monthsUntilSale: number
}

export interface ProfitSummary {
  // Scenario 1: Nominal (no time value)
  nominalProfit: number
  nominalROI: number
  nominalMargin: number

  // Scenario 2: Time-adjusted (realistic)
  projectedProfit: number
  projectedROI: number
  projectedMargin: number

  // Scenario 3: Pessimistic (high inflation, flat sales)
  pessimisticProfit: number
  pessimisticROI: number
  pessimisticMargin: number

  // Legacy fields for backwards compatibility
  grossProfit: number
  profitMargin: number
  roi: number
}

export interface CalculationResults {
  inputs: ProjectInputs
  timeline: TimelineData
  costs: CostBreakdown
  sales: SalesProjection
  profit: ProfitSummary
  parameters: AllParameters
}

// Parameter transparency types
export interface Parameter {
  key: string
  label: string
  labelTR: string
  value: number | string | boolean
  unit: string
  source: ParameterSource
  editable: boolean
  description: string
  descriptionTR: string
  min?: number
  max?: number
  step?: number
}

export interface ParameterGroup {
  groupKey: string
  groupLabel: string
  groupLabelTR: string
  parameters: Parameter[]
}

export interface AllParameters {
  location: ParameterGroup
  constructionCosts: ParameterGroup
  timeline: ParameterGroup
  salesMarket: ParameterGroup
  financial: ParameterGroup
}

// Unit Mix Types for optimal profitability calculation
export interface UnitType {
  id: string
  label: string           // "1+1", "2+1", "3+1", "Villa"
  labelTR: string         // Turkish label
  avgSize: number         // Average m² per unit
  priceMultiplier: number // Smaller units often have higher per-m² price
  demandLevel: number     // 1-10 market demand score
}

export interface UnitMix {
  unitTypeId: string
  label: string
  count: number
  sizePerUnit: number
  totalSqm: number
  pricePerSqm: number
  estimatedRevenue: number
}

export interface UnitMixConfig {
  isAutoOptimized: boolean
  units: UnitMix[]
  totalUnits: number
  totalSqm: number
  averageUnitSize: number
  totalEstimatedRevenue: number
}

// Parameter override types for type-safe parameter management
export interface TimelineOverrides {
  startDate?: string
  landSize?: number
  landCost?: number
  constructionMonths?: number
  monthsToSell?: number
  monthlyInflationRate?: number
  monthlyAppreciationRate?: number
  costDistribution?: CostDistribution
  // Allow dynamic indexing for flexibility (null for clearing values)
  [key: string]: string | number | CostDistribution | undefined | null
}

export interface ParameterOverrides {
  timeline?: TimelineOverrides
  cost?: Record<string, number>
  sales?: Record<string, number>
}

// Calculation result types (success or error)
export interface CalculationSuccess {
  success: true
  data: CalculationResults
}

export interface CalculationError {
  success: false
  error: string
  errorTR: string
  details?: string[]
}

export type CalculationResult = CalculationSuccess | CalculationError
