/**
 * Timeline Calculator
 *
 * Calculates month-by-month project evolution including:
 * - Construction progress
 * - Cost accumulation with inflation
 * - Property value appreciation
 * - Profit/loss at each point
 * - Optimal sale timing
 * - Break-even analysis
 *
 * Phase 3.2 - Economic Engine
 */

import {
  type InflationConfig,
  annualToMonthly,
  applyCompoundInflation,
} from './inflationEngine';

/**
 * Construction Phases
 *
 * Based on typical Turkish construction project phases
 */
export type ConstructionPhase =
  | 'planning'      // Planlama: Permits, design, preparation
  | 'foundation'    // Temel: Excavation, foundation work
  | 'structure'     // Kaba İnşaat: Structural frame, walls
  | 'finishing'     // İnce İşler: Interior finishes, MEP
  | 'complete';     // Tamamlandı: Construction finished

/**
 * Monthly Project Snapshot
 *
 * Complete state of project at a specific month
 */
export interface MonthlyProjection {
  month: number;              // Month number (0 = start)
  date: Date;                 // Calendar date

  // Construction Progress
  constructionProgress: number; // 0-100%
  phase: ConstructionPhase;

  // Costs (cumulative)
  cumulativeCost: number;          // Total spent so far
  costThisMonth: number;           // Spent this month
  inflationAdjustedCost: number;   // With inflation applied

  // Revenue Potential
  estimatedSaleValue: number;      // If sold now (base value × progress)
  inflationAdjustedValue: number;  // Future value with appreciation

  // Profit/Loss
  grossProfit: number;       // Revenue - Cost
  netProfit: number;         // After opportunity cost
  profitMargin: number;      // Gross profit / Revenue
  roi: number;               // Return on investment

  // Financing
  interestCost: number;          // Opportunity cost this month
  cumulativeInterest: number;    // Total opportunity cost
}

/**
 * Phase Configuration
 *
 * Timeline and cost distribution for each construction phase
 */
export interface PhaseConfig {
  start: number;        // Starting month
  end: number;          // Ending month
  costPercent: number;  // % of total cost in this phase
}

/**
 * Project Timeline Configuration
 */
export interface TimelineConfig {
  constructionMonths: number;
  salesMonths: number;
  startDate?: Date;
}

/**
 * Complete Project Timeline
 */
export interface ProjectTimeline {
  totalMonths: number;
  constructionMonths: number;
  salesMonths: number;

  phases: {
    planning: PhaseConfig;
    foundation: PhaseConfig;
    structure: PhaseConfig;
    finishing: PhaseConfig;
    sales: { start: number; end: number };
  };

  monthlyProjections: MonthlyProjection[];
  optimalSaleMonth: number;    // Best month to sell for max ROI
  breakEvenMonth: number;       // First month with positive gross profit
  completionMonth: number;      // Construction completion
}

/**
 * Standard Turkish Construction Phase Distribution
 *
 * Based on industry averages for residential projects
 */
const STANDARD_PHASE_DISTRIBUTION = {
  planning: 0.05,     // 5% - Permits, design, site prep
  foundation: 0.20,   // 20% - Excavation, foundation, basement
  structure: 0.45,    // 45% - Frame, walls, roof (kaba inşaat)
  finishing: 0.30,    // 30% - Interior, MEP, final touches (ince işler)
};

/**
 * Calculate construction phase boundaries
 */
function calculatePhaseBoundaries(constructionMonths: number): {
  planning: PhaseConfig;
  foundation: PhaseConfig;
  structure: PhaseConfig;
  finishing: PhaseConfig;
} {
  return {
    planning: {
      start: 0,
      end: Math.ceil(constructionMonths * 0.1),
      costPercent: STANDARD_PHASE_DISTRIBUTION.planning,
    },
    foundation: {
      start: Math.ceil(constructionMonths * 0.1),
      end: Math.ceil(constructionMonths * 0.3),
      costPercent: STANDARD_PHASE_DISTRIBUTION.foundation,
    },
    structure: {
      start: Math.ceil(constructionMonths * 0.3),
      end: Math.ceil(constructionMonths * 0.75),
      costPercent: STANDARD_PHASE_DISTRIBUTION.structure,
    },
    finishing: {
      start: Math.ceil(constructionMonths * 0.75),
      end: constructionMonths,
      costPercent: STANDARD_PHASE_DISTRIBUTION.finishing,
    },
  };
}

/**
 * Determine current phase based on month
 */
function getCurrentPhase(
  month: number,
  phases: ReturnType<typeof calculatePhaseBoundaries>,
  constructionMonths: number
): ConstructionPhase {
  if (month >= constructionMonths) {
    return 'complete';
  }
  if (month < phases.planning.end) {
    return 'planning';
  }
  if (month < phases.foundation.end) {
    return 'foundation';
  }
  if (month < phases.structure.end) {
    return 'structure';
  }
  return 'finishing';
}

/**
 * Calculate construction progress percentage
 *
 * Uses S-curve for realistic progress modeling
 */
function calculateProgress(month: number, totalMonths: number): number {
  if (month >= totalMonths) return 100;
  if (month <= 0) return 0;

  // S-curve formula: slow start, fast middle, slow end
  const t = month / totalMonths;
  const sCurve = 1 / (1 + Math.exp(-10 * (t - 0.5)));

  return Math.min(100, sCurve * 100);
}

/**
 * Calculate monthly cost distribution
 *
 * Uses S-curve weighted by phase percentages
 */
function calculateMonthlyCostDistribution(
  totalCost: number,
  phases: ReturnType<typeof calculatePhaseBoundaries>,
  constructionMonths: number
): number[] {
  const distribution: number[] = [];

  for (let month = 0; month < constructionMonths; month++) {
    const phase = getCurrentPhase(month, phases, constructionMonths);

    let monthCost = 0;

    if (phase !== 'complete') {
      // Find which phase we're in
      const phaseConfig = phases[phase];
      const phaseDuration = phaseConfig.end - phaseConfig.start;
      const monthInPhase = month - phaseConfig.start;

      // Use S-curve within phase
      const phaseProgress = calculateProgress(monthInPhase + 1, phaseDuration) -
                           calculateProgress(monthInPhase, phaseDuration);

      // Multiply by phase cost percentage
      monthCost = (phaseProgress / 100) * phaseConfig.costPercent * totalCost;
    }

    distribution.push(monthCost);
  }

  // Normalize to ensure sum = totalCost
  const sum = distribution.reduce((a, b) => a + b, 0);
  const normalized = distribution.map((cost) => (cost / sum) * totalCost);

  return normalized;
}

/**
 * Calculate complete project timeline
 *
 * Main function that generates all monthly projections
 */
export function calculateTimeline(
  totalBaseCost: number,
  estimatedRevenue: number,
  config: TimelineConfig,
  inflation: InflationConfig
): ProjectTimeline {
  const { constructionMonths, salesMonths, startDate = new Date() } = config;
  const totalMonths = constructionMonths + salesMonths;

  // Convert annual rates to monthly
  const monthlyInflation = annualToMonthly(inflation.constructionPPI);
  const monthlyAppreciation = annualToMonthly(inflation.propertyAppreciation);
  const monthlyInterestRate = annualToMonthly(inflation.interestRate);

  // Calculate phase boundaries
  const phases = calculatePhaseBoundaries(constructionMonths);

  // Calculate monthly cost distribution
  const costDistribution = calculateMonthlyCostDistribution(
    totalBaseCost,
    phases,
    constructionMonths
  );

  // Generate monthly projections
  const monthlyProjections: MonthlyProjection[] = [];
  let cumulativeCost = 0;
  let cumulativeInterest = 0;

  for (let month = 0; month <= totalMonths; month++) {
    // Calculate date
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + month);

    // Determine phase and progress
    const phase = getCurrentPhase(month, phases, constructionMonths);
    const constructionProgress = calculateProgress(
      Math.min(month, constructionMonths),
      constructionMonths
    );

    // Calculate cost this month (with inflation)
    let costThisMonth = 0;
    if (month < constructionMonths) {
      const baseCost = costDistribution[month];
      // Apply inflation from start of project
      costThisMonth = applyCompoundInflation(baseCost, monthlyInflation, month);
    }

    cumulativeCost += costThisMonth;

    // Calculate opportunity cost (interest on deployed capital)
    const interestCost = month > 0 ? cumulativeCost * monthlyInterestRate : 0;
    cumulativeInterest += interestCost;

    // Calculate property value
    // Base value increases with construction progress
    const baseValue = estimatedRevenue * (constructionProgress / 100);

    // Apply appreciation from current month forward
    // (property appreciates even during construction)
    const monthsFromNow = month;
    const appreciatedValue = applyCompoundInflation(
      baseValue,
      monthlyAppreciation,
      monthsFromNow
    );

    // Calculate profits
    const grossProfit = appreciatedValue - cumulativeCost;
    const netProfit = grossProfit - cumulativeInterest;
    const profitMargin = appreciatedValue > 0 ? grossProfit / appreciatedValue : 0;
    const roi = cumulativeCost > 0 ? netProfit / cumulativeCost : 0;

    monthlyProjections.push({
      month,
      date,
      constructionProgress: Math.min(100, constructionProgress),
      phase,
      cumulativeCost,
      costThisMonth,
      inflationAdjustedCost: cumulativeCost,
      estimatedSaleValue: appreciatedValue,
      inflationAdjustedValue: appreciatedValue,
      grossProfit,
      netProfit,
      profitMargin,
      roi,
      interestCost,
      cumulativeInterest,
    });
  }

  // Find optimal sale month (highest ROI after construction complete)
  const completedProjections = monthlyProjections.filter(
    (p) => p.constructionProgress >= 100
  );

  const optimalSaleMonth = completedProjections.reduce(
    (best, current) => {
      const bestROI = monthlyProjections[best]?.roi ?? -Infinity;
      return current.roi > bestROI ? current.month : best;
    },
    constructionMonths
  );

  // Find break-even month (first month with positive gross profit)
  const breakEvenMonth = monthlyProjections.findIndex((p) => p.grossProfit > 0);

  return {
    totalMonths,
    constructionMonths,
    salesMonths,
    phases: {
      ...phases,
      sales: {
        start: Math.ceil(constructionMonths * 0.8), // Pre-sales can start
        end: totalMonths,
      },
    },
    monthlyProjections,
    optimalSaleMonth,
    breakEvenMonth: breakEvenMonth === -1 ? totalMonths : breakEvenMonth,
    completionMonth: constructionMonths,
  };
}

/**
 * Calculate recommended construction duration
 *
 * Based on project size and type
 */
export function calculateRecommendedDuration(
  totalArea: number,
  projectType: 'villa' | 'apartment'
): number {
  if (projectType === 'villa') {
    if (totalArea < 500) return 10;
    if (totalArea < 1000) return 14;
    return 18;
  }

  // Apartment
  if (totalArea < 3000) return 14;
  if (totalArea < 8000) return 18;
  if (totalArea < 15000) return 24;
  return 30;
}

/**
 * Get phase name in Turkish
 */
export function getPhaseNameTurkish(phase: ConstructionPhase): string {
  const names: Record<ConstructionPhase, string> = {
    planning: 'Planlama',
    foundation: 'Temel',
    structure: 'Kaba İnşaat',
    finishing: 'İnce İşler',
    complete: 'Tamamlandı',
  };
  return names[phase];
}

/**
 * Get phase color for UI
 */
export function getPhaseColor(phase: ConstructionPhase): string {
  const colors: Record<ConstructionPhase, string> = {
    planning: '#a855f7',    // purple-500
    foundation: '#f97316',  // orange-500
    structure: '#3b82f6',   // blue-500
    finishing: '#10b981',   // emerald-500
    complete: '#22c55e',    // green-500
  };
  return colors[phase];
}

export default {
  calculateTimeline,
  calculateRecommendedDuration,
  getPhaseNameTurkish,
  getPhaseColor,
};
