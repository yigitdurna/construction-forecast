/**
 * İmar Calculations for Emsal Harici (Exempt Areas)
 *
 * Phase 3.2 - Handle bodrum kat (basement) and other emsal-excluded areas
 * per Turkish zoning regulations
 */

import type { ZoningResult } from '../types/zoning';

/**
 * Bodrum kat (basement) usage types
 */
export type BodrumUsage = 'otopark' | 'depo' | 'ticaret' | 'konut';

/**
 * Bodrum kat configuration
 */
export interface BodrumConfig {
  enabled: boolean;
  usage: BodrumUsage;
  area?: number; // Optional custom area, defaults to tabanAlani
}

/**
 * Complete area breakdown including emsal harici
 */
export interface AreaBreakdown {
  // Base İmar calculations
  parselAlani: number;      // Parcel area
  tabanAlani: number;       // Ground floor coverage (TAKS)
  toplamEmsal: number;      // Total emsal area (KAKS)

  // Emsal harici areas (NOT counted in KAKS)
  emsalHariciMax: number;   // Maximum 30% of toplamEmsal
  emsalHariciItems: {
    asansor: number;        // Elevator shafts
    merdiven: number;       // Stairwells
    otopark: number;        // Parking (if bodrum=otopark)
    depo: number;           // Storage (if bodrum=depo)
    siginaklar: number;     // Bomb shelters
  };
  emsalHariciTotal: number; // Sum of all emsal harici

  // Bodrum kat (basement)
  bodrumKat: {
    enabled: boolean;
    usage: BodrumUsage;
    area: number;           // Area of basement (usually = tabanAlani)
    sellable: boolean;      // True if usage='konut' or 'ticaret'
    sellableArea: number;   // Net sellable area if applicable
  };

  // Final usable areas
  brutInsaat: number;       // Gross construction (emsal + emsal harici)
  netKullanim: number;      // Net usable for apartments (excl. emsal harici)
  toplamSatilabilir: number; // Total sellable (netKullanim + bodrumSellable)

  // Utilization metrics
  emsalHariciRatio: number; // % of toplamEmsal used for emsal harici
  emsalHariciRemaining: number; // Remaining emsal harici capacity
}

/**
 * Calculate emsal harici (exempt) areas
 *
 * Turkish regulations allow up to 30% of emsal area for:
 * - Elevators (asansör)
 * - Stairwells (merdiven)
 * - Parking (otopark)
 * - Storage (depo)
 * - Bomb shelters (sığınak)
 *
 * @param toplamEmsal - Total emsal area (KAKS × parsel)
 * @param katAdedi - Number of floors
 * @param tabanAlani - Ground floor area
 * @param bodrumConfig - Bodrum kat configuration
 * @returns Breakdown of emsal harici areas
 */
export function calculateEmsalHarici(
  toplamEmsal: number,
  katAdedi: number,
  tabanAlani: number,
  bodrumConfig?: BodrumConfig
): AreaBreakdown['emsalHariciItems'] {
  const emsalHariciMax = toplamEmsal * 0.30; // 30% maximum

  // Estimate elevator area (2-3 elevators for multi-story buildings)
  const asansorCount = katAdedi >= 5 ? 2 : 1;
  const asansorPerFloor = 8; // m² per elevator per floor (shaft + lobby)
  const asansor = asansorCount * asansorPerFloor * katAdedi;

  // Estimate stairwell area (2 staircases for fire safety)
  const merdivenCount = katAdedi >= 5 ? 2 : 1;
  const merdivenPerFloor = 12; // m² per staircase per floor
  const merdiven = merdivenCount * merdivenPerFloor * katAdedi;

  // Estimate bomb shelter (sığınak) - required by Turkish law
  const siginaklar = Math.min(tabanAlani * 0.15, 100); // ~15% of taban, max 100m²

  // Bodrum-based emsal harici (if enabled and NOT konut)
  let otopark = 0;
  let depo = 0;

  if (bodrumConfig?.enabled && bodrumConfig.area) {
    const bodrumArea = bodrumConfig.area || tabanAlani;

    if (bodrumConfig.usage === 'otopark') {
      otopark = bodrumArea;
    } else if (bodrumConfig.usage === 'depo') {
      depo = bodrumArea;
    }
    // 'konut' and 'ticaret' are sellable, NOT emsal harici
  }

  // Total emsal harici (capped at 30% max)
  const total = Math.min(
    asansor + merdiven + otopark + depo + siginaklar,
    emsalHariciMax
  );

  return {
    asansor: Math.min(asansor, total),
    merdiven: Math.min(merdiven, total - asansor),
    otopark: Math.min(otopark, total - asansor - merdiven),
    depo: Math.min(depo, total - asansor - merdiven - otopark),
    siginaklar: Math.min(siginaklar, total - asansor - merdiven - otopark - depo),
  };
}

/**
 * Calculate complete area breakdown with bodrum kat support
 *
 * This is the main function for Phase 3.2 area calculations
 *
 * @param zoningResult - Base zoning calculation from Phase 2.1
 * @param bodrumConfig - Bodrum kat configuration
 * @param netGrossRatio - Net to gross ratio (default: 0.85)
 * @returns Complete area breakdown
 */
export function calculateAreaBreakdown(
  zoningResult: ZoningResult,
  bodrumConfig?: BodrumConfig,
  netGrossRatio: number = 0.85
): AreaBreakdown {
  const {
    parselAlani,
    tabanAlani,
    toplamInsaatAlani,
    katAdedi,
  } = zoningResult;

  // Calculate emsal harici items
  const emsalHariciMax = toplamInsaatAlani * 0.30;
  const emsalHariciItems = calculateEmsalHarici(
    toplamInsaatAlani,
    katAdedi,
    tabanAlani,
    bodrumConfig
  );

  const emsalHariciTotal = Object.values(emsalHariciItems).reduce(
    (sum, val) => sum + val,
    0
  );

  // Calculate bodrum kat details
  const bodrumArea = bodrumConfig?.enabled
    ? bodrumConfig.area || tabanAlani
    : 0;

  const bodrumSellable =
    bodrumConfig?.enabled &&
    (bodrumConfig.usage === 'konut' || bodrumConfig.usage === 'ticaret');

  const bodrumSellableArea = bodrumSellable ? bodrumArea * netGrossRatio : 0;

  // Final area calculations
  const brutInsaat = toplamInsaatAlani + emsalHariciTotal;

  // Net kullanım = Emsal area (excluding emsal harici) × net/gross ratio
  const netKullanim = (toplamInsaatAlani - emsalHariciTotal) * netGrossRatio;

  // Total sellable = apartment area + bodrum (if konut/ticaret)
  const toplamSatilabilir = netKullanim + bodrumSellableArea;

  return {
    // Base İmar
    parselAlani,
    tabanAlani,
    toplamEmsal: toplamInsaatAlani,

    // Emsal harici
    emsalHariciMax,
    emsalHariciItems,
    emsalHariciTotal,

    // Bodrum kat
    bodrumKat: {
      enabled: bodrumConfig?.enabled || false,
      usage: bodrumConfig?.usage || 'otopark',
      area: bodrumArea,
      sellable: bodrumSellable || false,
      sellableArea: bodrumSellableArea,
    },

    // Final areas
    brutInsaat,
    netKullanim,
    toplamSatilabilir,

    // Metrics
    emsalHariciRatio: toplamInsaatAlani > 0
      ? emsalHariciTotal / toplamInsaatAlani
      : 0,
    emsalHariciRemaining: emsalHariciMax - emsalHariciTotal,
  };
}

/**
 * Format emsal harici items for display
 *
 * @param items - Emsal harici items
 * @returns Array of formatted strings
 */
export function formatEmsalHariciItems(
  items: AreaBreakdown['emsalHariciItems']
): Array<{ label: string; labelTR: string; area: number }> {
  return [
    { label: 'Elevator Shafts', labelTR: 'Asansör Boşlukları', area: items.asansor },
    { label: 'Stairwells', labelTR: 'Merdiven Boşlukları', area: items.merdiven },
    { label: 'Parking (Basement)', labelTR: 'Otopark (Bodrum)', area: items.otopark },
    { label: 'Storage (Basement)', labelTR: 'Depo (Bodrum)', area: items.depo },
    { label: 'Bomb Shelters', labelTR: 'Sığınaklar', area: items.siginaklar },
  ].filter((item) => item.area > 0); // Only show non-zero items
}

/**
 * Get bodrum usage label in Turkish
 */
export function getBodrumUsageLabel(usage: BodrumUsage): string {
  const labels: Record<BodrumUsage, string> = {
    otopark: '🚗 Otopark (Parking)',
    depo: '📦 Depo (Storage)',
    ticaret: '🏪 Ticari Alan (Commercial)',
    konut: '🏠 Konut (Residential)',
  };
  return labels[usage];
}

/**
 * Calculate maximum units possible with bodrum as konut
 *
 * This helps show users the potential increase in unit count
 *
 * @param breakdown - Area breakdown
 * @param averageUnitSize - Average net unit size (m²)
 * @returns Maximum units possible
 */
export function calculateMaxUnitsWithBodrum(
  breakdown: AreaBreakdown,
  averageUnitSize: number
): {
  withoutBodrum: number;
  withBodrum: number;
  increase: number;
  increasePercent: number;
} {
  const withoutBodrum = Math.floor(breakdown.netKullanim / averageUnitSize);
  const withBodrum = Math.floor(breakdown.toplamSatilabilir / averageUnitSize);
  const increase = withBodrum - withoutBodrum;
  const increasePercent = withoutBodrum > 0
    ? (increase / withoutBodrum) * 100
    : 0;

  return {
    withoutBodrum,
    withBodrum,
    increase,
    increasePercent,
  };
}
