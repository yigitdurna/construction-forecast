/**
 * Feasibility Wizard Type Definitions
 *
 * Phase 2.3 - Complete feasibility analysis workflow
 */

import type { ZoningResult, UnitTypeCode } from './zoning';
import type { ManualImarParams } from '../utils/imarValidation';

// Re-export types from other modules for convenience
export type { UnitTypeCode, ZoningResult, ManualImarParams };

// ============================================================================
// Wizard Step Types
// ============================================================================

/**
 * Wizard step numbers
 */
export type WizardStep = 1 | 2 | 3 | 4;

/**
 * Step labels in Turkish
 */
export const WIZARD_STEP_LABELS: Record<WizardStep, string> = {
  1: 'Parsel & İmar',
  2: 'Daire Karışımı',
  3: 'Maliyet & Fiyat',
  4: 'Finansal Analiz',
};

// ============================================================================
// Step 1: Parsel + İmar Data
// ============================================================================

/**
 * TKGM Parcel Data (simplified from Phase 2.1)
 */
export interface TKGMParcelData {
  ilce: string;
  ada: string;
  parsel: string;
  parselAlani: number; // m²
  source: 'tkgm' | 'manual';
}

/**
 * Step 1 complete data
 */
export interface ParselImarData {
  parselData: TKGMParcelData;
  imarParams: ManualImarParams;
  zoningResult: ZoningResult;
}

// ============================================================================
// Step 2: Unit Mix
// ============================================================================

/**
 * Single unit type configuration
 */
export interface UnitConfig {
  type: UnitTypeCode;
  count: number; // Number of units
  netArea: number; // Net area per unit (m²)
  grossMultiplier: number; // Gross = net × multiplier (e.g., 1.20)
}

/**
 * Complete unit mix
 */
export interface UnitMix {
  units: UnitConfig[];
  totalUnits: number;
  totalNetArea: number; // m²
  totalGrossArea: number; // m²
  areaUtilization: number; // 0.0-1.0 (percentage of available area used)
  warnings: string[];
}

/**
 * Default unit sizes (net area in m²)
 */
export const DEFAULT_UNIT_SIZES: Record<UnitTypeCode, number> = {
  '1+1': 55,
  '2+1': 90,
  '3+1': 120,
  '4+1': 150,
  '5+1': 200,
};

/**
 * Default unit mix ratios (percentages)
 */
export const DEFAULT_MIX_RATIOS: Record<UnitTypeCode, number> = {
  '1+1': 0.15, // 15%
  '2+1': 0.35, // 35%
  '3+1': 0.40, // 40%
  '4+1': 0.10, // 10%
  '5+1': 0.00, // 0%
};

// ============================================================================
// Step 3: Cost & Pricing
// ============================================================================

/**
 * Construction quality tier
 */
export type ConstructionQuality = 'standard' | 'mid' | 'luxury';

/**
 * Quality tier configuration
 */
export interface QualityTier {
  name: string;
  costPerM2: number; // TL/m² construction cost
  multiplier: number; // Multiplier vs base (mid = 1.0)
  description: string;
}

/**
 * Quality tiers with costs
 */
export const QUALITY_TIERS: Record<ConstructionQuality, QualityTier> = {
  standard: {
    name: 'Standart',
    costPerM2: 18000, // Base: 18,000 TL/m²
    multiplier: 0.85,
    description: 'Ekonomik malzemeler, standart kalite',
  },
  mid: {
    name: 'Orta Kalite',
    costPerM2: 21500, // Mid: 21,500 TL/m²
    multiplier: 1.0,
    description: 'Orta düzey malzemeler, iyi kalite',
  },
  luxury: {
    name: 'Lüks',
    costPerM2: 28000, // Luxury: 28,000 TL/m²
    multiplier: 1.25,
    description: 'Yüksek kalite malzemeler, lüks bitirme',
  },
};

/**
 * Pricing configuration
 */
export interface PricingConfig {
  constructionQuality: ConstructionQuality;
  constructionCostPerM2: number;
  salePrices: Record<UnitTypeCode, number>; // TL/m² for each unit type
}

/**
 * Unit-specific pricing
 */
export interface UnitPricing {
  type: UnitTypeCode;
  count: number;
  netArea: number;
  pricePerM2: number;
  unitPrice: number;
  totalRevenue: number;
}

// ============================================================================
// Step 4: Financial Summary
// ============================================================================

/**
 * Financial analysis result
 */
export interface FinancialResult {
  // Costs
  totalConstructionCost: number; // TL
  landCost?: number; // TL (optional)
  totalCost: number; // TL

  // Revenue
  totalRevenue: number; // TL

  // Profit metrics
  grossProfit: number; // TL
  profitMargin: number; // 0.0-1.0
  roi: number; // Return on Investment (%)

  // NPV metrics
  npvAdjustedRevenue: number; // TL
  npvProfit: number; // TL
  npvROI: number; // %

  // Scenarios
  scenarios: {
    optimistic: ScenarioResult;
    base: ScenarioResult;
    pessimistic: ScenarioResult;
  };
}

/**
 * Single scenario result
 */
export interface ScenarioResult {
  name: string;
  totalCost: number;
  totalRevenue: number;
  profit: number;
  margin: number;
  roi: number;
  npvProfit: number;
  npvROI: number;
}

// ============================================================================
// Complete Wizard State
// ============================================================================

/**
 * Complete feasibility wizard state
 */
export interface FeasibilityState {
  // Current step
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;

  // Step 1: Parsel + İmar
  step1: ParselImarData | null;

  // Step 2: Unit Mix
  step2: UnitMix | null;

  // Step 3: Pricing
  step3: PricingConfig | null;

  // Step 4: Financial
  step4: FinancialResult | null;

  // Validation
  isStepValid: (step: WizardStep) => boolean;
}

/**
 * Wizard actions
 */
export type FeasibilityAction =
  | { type: 'SET_STEP'; step: WizardStep }
  | { type: 'SET_STEP1_DATA'; data: ParselImarData }
  | { type: 'SET_STEP2_DATA'; data: UnitMix }
  | { type: 'SET_STEP3_DATA'; data: PricingConfig }
  | { type: 'SET_STEP4_DATA'; data: FinancialResult }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
  | { type: 'RESET' }
  | { type: 'LOAD_STATE'; state: Partial<FeasibilityState> };

// ============================================================================
// UI Text Constants
// ============================================================================

/**
 * Turkish UI text
 */
export const WIZARD_TEXT = {
  steps: WIZARD_STEP_LABELS,

  buttons: {
    next: 'Sonraki Adım →',
    back: '← Geri',
    calculate: 'Hesapla',
    optimize: 'Otomatik Optimize Et',
    export: 'Raporu İndir 📄',
    reset: 'Yeniden Başla',
  },

  validation: {
    completeStep: 'Bu adımı tamamlayın',
    areaExceeded: 'Toplam alan kullanılabilir alanı aşıyor',
    invalidPrice: 'Geçerli bir fiyat giriniz',
    noUnits: 'En az bir daire tipi ekleyin',
    invalidUnitCount: 'Daire sayısı pozitif bir tam sayı olmalıdır',
  },

  step1: {
    title: 'Parsel ve İmar Bilgileri',
    description: 'Ada/Parsel sorgulayın ve İmar bilgilerini girin',
  },

  step2: {
    title: 'Daire Karışımı',
    description: 'Proje için daire tiplerini ve sayılarını belirleyin',
    availableArea: 'Kullanılabilir Alan',
    usedArea: 'Kullanılan Alan',
    remainingArea: 'Kalan Alan',
    utilization: 'Alan Kullanımı',
  },

  step3: {
    title: 'Maliyet ve Fiyatlandırma',
    description: 'İnşaat kalitesi ve satış fiyatlarını belirleyin',
    quality: 'İnşaat Kalitesi',
    constructionCost: 'İnşaat Maliyeti',
    salePrices: 'Satış Fiyatları',
    districtAverage: 'İlçe Ortalaması',
  },

  step4: {
    title: 'Finansal Analiz',
    description: 'Proje karlılığı ve NPV analizi',
    summary: 'Özet',
    scenarios: 'Senaryo Analizi',
    optimistic: 'İyimser',
    base: 'Baz',
    pessimistic: 'Kötümser',
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total construction cost
 */
export function calculateConstructionCost(
  totalArea: number,
  costPerM2: number
): number {
  return totalArea * costPerM2;
}

/**
 * Calculate total revenue from unit pricing
 */
export function calculateTotalRevenue(
  unitPricing: UnitPricing[]
): number {
  return unitPricing.reduce((sum, unit) => sum + unit.totalRevenue, 0);
}

/**
 * Calculate profit margin
 */
export function calculateProfitMargin(
  revenue: number,
  cost: number
): number {
  if (revenue === 0) return 0;
  return (revenue - cost) / revenue;
}

/**
 * Calculate ROI (Return on Investment)
 */
export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return ((revenue - cost) / cost) * 100;
}

/**
 * Validate step completion
 */
export function isStepComplete(
  step: WizardStep,
  state: FeasibilityState
): boolean {
  switch (step) {
    case 1:
      return state.step1 !== null;
    case 2:
      return state.step2 !== null && state.step2.units.length > 0;
    case 3:
      return state.step3 !== null;
    case 4:
      return state.step4 !== null;
    default:
      return false;
  }
}
