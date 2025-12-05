/**
 * Zoning Calculator Service
 *
 * Calculates buildable areas based on Turkish zoning regulations (İmar Mevzuatı)
 *
 * Key concepts:
 * - TAKS (Taban Alanı Kat Sayısı): Building Coverage Ratio - % of land covered by ground floor
 * - KAKS (Kat Alanı Kat Sayısı) = EMSAL: Floor Area Ratio - total buildable area ÷ land area
 * - Çıkma Katsayısı: Projection coefficient for balconies, bay windows
 * - Emsal Dışı: Areas exempt from EMSAL (elevators, stairs, parking, shelters) - max 30%
 */

import type {
  ZoningParams,
  ZoningResult,
  ZoningError,
  ZoningErrorType,
} from '../types/zoning';
import { ZONING_LIMITS } from '../types/zoning';

/**
 * Validates zoning parameters
 *
 * @param params - Zoning parameters to validate
 * @returns Array of errors (empty if valid)
 */
export function validateZoningParams(params: ZoningParams): ZoningError[] {
  const errors: ZoningError[] = [];

  // Validate parsel alanı (land area)
  if (
    params.parselAlani < ZONING_LIMITS.MIN_PARSEL_AREA ||
    params.parselAlani > ZONING_LIMITS.MAX_PARSEL_AREA
  ) {
    errors.push({
      type: 'invalid_parsel_area',
      message: `Parsel alanı ${ZONING_LIMITS.MIN_PARSEL_AREA}-${ZONING_LIMITS.MAX_PARSEL_AREA} m² arasında olmalıdır`,
      field: 'parselAlani',
      value: params.parselAlani,
    });
  }

  if (params.parselAlani <= 0 || !isFinite(params.parselAlani)) {
    errors.push({
      type: 'invalid_parsel_area',
      message: 'Parsel alanı pozitif bir sayı olmalıdır',
      field: 'parselAlani',
      value: params.parselAlani,
    });
  }

  // Validate TAKS (Building Coverage Ratio)
  if (params.taks < ZONING_LIMITS.MIN_TAKS || params.taks > ZONING_LIMITS.MAX_TAKS) {
    errors.push({
      type: 'invalid_taks',
      message: `TAKS ${ZONING_LIMITS.MIN_TAKS}-${ZONING_LIMITS.MAX_TAKS} arasında olmalıdır`,
      field: 'taks',
      value: params.taks,
    });
  }

  if (!isFinite(params.taks) || params.taks < 0) {
    errors.push({
      type: 'invalid_taks',
      message: 'TAKS geçerli bir sayı olmalıdır',
      field: 'taks',
      value: params.taks,
    });
  }

  // Validate KAKS/EMSAL (Floor Area Ratio)
  if (params.kaks < ZONING_LIMITS.MIN_KAKS || params.kaks > ZONING_LIMITS.MAX_KAKS) {
    errors.push({
      type: 'invalid_kaks',
      message: `KAKS/EMSAL ${ZONING_LIMITS.MIN_KAKS}-${ZONING_LIMITS.MAX_KAKS} arasında olmalıdır`,
      field: 'kaks',
      value: params.kaks,
    });
  }

  if (!isFinite(params.kaks) || params.kaks < 0) {
    errors.push({
      type: 'invalid_kaks',
      message: 'KAKS/EMSAL geçerli bir sayı olmalıdır',
      field: 'kaks',
      value: params.kaks,
    });
  }

  // Validate Çıkma Katsayısı (Projection coefficient)
  if (
    params.cikmaKatsayisi < ZONING_LIMITS.MIN_CIKMA ||
    params.cikmaKatsayisi > ZONING_LIMITS.MAX_CIKMA
  ) {
    errors.push({
      type: 'invalid_cikma',
      message: `Çıkma katsayısı ${ZONING_LIMITS.MIN_CIKMA}-${ZONING_LIMITS.MAX_CIKMA} arasında olmalıdır`,
      field: 'cikmaKatsayisi',
      value: params.cikmaKatsayisi,
    });
  }

  if (!isFinite(params.cikmaKatsayisi) || params.cikmaKatsayisi < 1.0) {
    errors.push({
      type: 'invalid_cikma',
      message: 'Çıkma katsayısı en az 1.0 olmalıdır',
      field: 'cikmaKatsayisi',
      value: params.cikmaKatsayisi,
    });
  }

  // Validate height if provided
  if (params.maxYukseklik !== undefined) {
    if (params.maxYukseklik <= 0 || !isFinite(params.maxYukseklik)) {
      errors.push({
        type: 'invalid_height',
        message: 'Maksimum yükseklik pozitif bir sayı olmalıdır',
        field: 'maxYukseklik',
        value: params.maxYukseklik,
      });
    }
  }

  // Validate floor count if provided
  if (params.maxKatAdedi !== undefined) {
    if (params.maxKatAdedi <= 0 || !isFinite(params.maxKatAdedi)) {
      errors.push({
        type: 'invalid_height',
        message: 'Maksimum kat adedi pozitif bir sayı olmalıdır',
        field: 'maxKatAdedi',
        value: params.maxKatAdedi,
      });
    }
  }

  // TAKS cannot exceed 1.0 (100% coverage)
  if (params.taks > 1.0) {
    errors.push({
      type: 'taks_exceeds_limit',
      message: 'TAKS 1.0\'ı aşamaz (parsel alanının %100\'ü)',
      field: 'taks',
      value: params.taks,
    });
  }

  // KAKS should typically be >= TAKS (sanity check)
  if (params.kaks < params.taks && params.kaks > 0) {
    // This is a warning, not a hard error - single story buildings can have KAKS < TAKS
    // But it's unusual, so we'll note it
  }

  return errors;
}

/**
 * Calculate number of floors based on KAKS, TAKS, and height restrictions
 *
 * @param params - Zoning parameters
 * @returns Object with floor count and which limit was applied
 */
function calculateFloorCount(params: ZoningParams): {
  katAdedi: number;
  isHeightLimited: boolean;
  isFloorLimited: boolean;
} {
  // Base calculation: KAKS / TAKS
  // This gives the theoretical number of floors needed to achieve the KAKS
  const kaksBasedFloors = params.taks > 0 ? params.kaks / params.taks : 0;

  // Calculate floors from height restriction
  const floorHeight = ZONING_LIMITS.TYPICAL_FLOOR_HEIGHT; // 3.0 meters per floor
  const heightBasedFloors = params.maxYukseklik
    ? Math.floor(params.maxYukseklik / floorHeight)
    : Infinity;

  // Get explicit floor limit
  const explicitFloorLimit = params.maxKatAdedi ?? Infinity;

  // Apply the most restrictive limit
  let finalFloors = Math.floor(kaksBasedFloors);
  let isHeightLimited = false;
  let isFloorLimited = false;

  if (heightBasedFloors < finalFloors) {
    finalFloors = heightBasedFloors;
    isHeightLimited = true;
  }

  if (explicitFloorLimit < finalFloors) {
    finalFloors = explicitFloorLimit;
    isFloorLimited = true;
  }

  return {
    katAdedi: finalFloors,
    isHeightLimited,
    isFloorLimited,
  };
}

/**
 * Calculate zoning parameters for a parcel
 *
 * This implements all Turkish zoning calculations:
 * 1. Taban Alanı (Ground Coverage) = Parsel × TAKS
 * 2. Toplam İnşaat Alanı (Total Construction) = Parsel × KAKS × Çıkma
 * 3. Kat Adedi (Floors) = KAKS / TAKS (limited by height)
 * 4. Emsal Dışı (Exempt Areas) = Max 30% of total
 * 5. Net Kullanım (Net Usable) = Brüt × Net/Gross Ratio
 *
 * @param params - Zoning parameters
 * @returns Complete zoning calculation results
 * @throws {Error} If validation fails
 */
export function calculateZoning(params: ZoningParams): ZoningResult {
  // Validate inputs
  const errors = validateZoningParams(params);
  if (errors.length > 0) {
    const errorMessages = errors.map((e) => e.message).join('; ');
    throw new Error(`İmar parametreleri geçersiz: ${errorMessages}`);
  }

  // Apply defaults for optional parameters
  const netGrossRatio = params.netGrossRatio ?? ZONING_LIMITS.TYPICAL_NET_GROSS;
  const emsalDisiOran = params.emsalDisiOran ?? ZONING_LIMITS.MAX_EMSAL_DISI_RATIO;

  // 1. Calculate Taban Alanı (Ground Floor Coverage)
  // Formula: Taban Alanı = Parsel Alanı × TAKS
  const tabanAlani = params.parselAlani * params.taks;

  // 2. Calculate Toplam İnşaat Alanı (Total Construction Area)
  // Formula: Toplam = Parsel Alanı × KAKS × Çıkma Katsayısı
  // KAKS (also called EMSAL) determines total buildable area
  // Çıkma katsayısı adds extra area for projections (balconies, bay windows)
  const toplamInsaatAlani = params.parselAlani * params.kaks * params.cikmaKatsayisi;

  // 3. Calculate Kat Adedi (Number of Floors)
  const floorCalc = calculateFloorCount(params);
  const katAdedi = floorCalc.katAdedi;
  const isHeightLimited = floorCalc.isHeightLimited;
  const isFloorLimited = floorCalc.isFloorLimited;

  // 4. Calculate Kat Başına Alan (Area per Floor)
  // This is simply the ground floor area (taban alanı)
  const katBasinaAlan = tabanAlani;

  // 5. Calculate Emsal Dışı Maximum (Exempt Areas)
  // Exempt areas (elevators, stairs, basement parking, shelters)
  // Maximum 30% of total construction area
  const emsalDisiMax = toplamInsaatAlani * emsalDisiOran;

  // 6. Calculate Usable Areas
  // Brüt Kullanım Alanı = Total construction minus exempt areas
  // (assuming we use the maximum allowed exempt area)
  const brutKullanimAlani = toplamInsaatAlani - emsalDisiMax;

  // Net Kullanım Alanı = Brüt × Net/Gross Ratio
  // Typically 85% (15% for walls, corridors, mechanical spaces)
  const netKullanimAlani = brutKullanimAlani * netGrossRatio;

  // Return complete results
  const result: ZoningResult = {
    // Input echo
    parselAlani: params.parselAlani,

    // Primary calculations
    tabanAlani,
    toplamInsaatAlani,
    katAdedi,
    katBasinaAlan,

    // Exempt areas
    emsalDisiMax,

    // Usable areas
    brutKullanimAlani,
    netKullanimAlani,

    // Validation flags
    isHeightLimited,
    isFloorLimited,

    // Applied coefficients (for transparency)
    appliedTAKS: params.taks,
    appliedKAKS: params.kaks,
    appliedCikma: params.cikmaKatsayisi,
    appliedNetGrossRatio: netGrossRatio,
  };

  return result;
}

/**
 * Calculate effective EMSAL (KAKS) that can be achieved given height restrictions
 *
 * Useful for determining if a parcel's zoning is height-limited rather than KAKS-limited
 *
 * @param parselAlani - Land area (m²)
 * @param taks - Building coverage ratio
 * @param maxYukseklik - Maximum height (meters)
 * @param floorHeight - Typical floor height (meters, default 3.0)
 * @returns Effective KAKS achievable
 */
export function calculateEffectiveKAKS(
  parselAlani: number,
  taks: number,
  maxYukseklik: number,
  floorHeight: number = ZONING_LIMITS.TYPICAL_FLOOR_HEIGHT
): number {
  // Calculate how many floors fit in the height limit
  const maxFloors = Math.floor(maxYukseklik / floorHeight);

  // Effective KAKS = floors × TAKS
  const effectiveKAKS = maxFloors * taks;

  return effectiveKAKS;
}

/**
 * Reverse calculation: Given desired total area, calculate required parcel size
 *
 * @param desiredTotalArea - Desired total construction area (m²)
 * @param kaks - Floor area ratio
 * @param cikmaKatsayisi - Projection coefficient (default 1.0 for conservative estimate)
 * @returns Required parcel area (m²)
 */
export function calculateRequiredParselArea(
  desiredTotalArea: number,
  kaks: number,
  cikmaKatsayisi: number = 1.0
): number {
  if (kaks <= 0 || cikmaKatsayisi <= 0) {
    throw new Error('KAKS ve çıkma katsayısı pozitif olmalıdır');
  }

  // Formula: Parsel = Toplam İnşaat / (KAKS × Çıkma)
  const requiredParselArea = desiredTotalArea / (kaks * cikmaKatsayisi);

  return requiredParselArea;
}

/**
 * Calculate buildable area breakdown by category
 *
 * @param zoningResult - Result from calculateZoning
 * @returns Detailed area breakdown
 */
export interface AreaBreakdown {
  // Total areas
  toplamInsaat: number;      // Total construction area
  emsalKapsami: number;      // Area within EMSAL
  emsalDisi: number;         // Exempt areas

  // Emsal kapsami breakdown
  konutAlani: number;        // Residential area (typically 70-80%)
  ortak kullanım: number;     // Common areas (corridors, lobbies)
  teknikAlan: number;        // Technical spaces (mechanical, electrical)

  // Emsal dışı breakdown
  asansor: number;           // Elevators
  merdiven: number;          // Stairs
  otopark: number;           // Parking
  siginaklar: number;        // Shelters
}

export function calculateAreaBreakdown(zoningResult: ZoningResult): AreaBreakdown {
  // Use typical ratios if not specified
  const emsalDisiUsed = zoningResult.emsalDisiMax; // Assume we use maximum allowed

  const emsalKapsami = zoningResult.toplamInsaatAlani - emsalDisiUsed;

  // Typical distribution of areas (can be customized later)
  const konutAlani = emsalKapsami * 0.75;       // 75% residential
  const ortakKullanim = emsalKapsami * 0.15;    // 15% common areas
  const teknikAlan = emsalKapsami * 0.10;       // 10% technical

  // Emsal dışı typical distribution
  const asansor = emsalDisiUsed * 0.15;         // 15% elevators
  const merdiven = emsalDisiUsed * 0.20;        // 20% stairs
  const otopark = emsalDisiUsed * 0.50;         // 50% parking
  const siginaklar = emsalDisiUsed * 0.15;      // 15% shelters

  return {
    toplamInsaat: zoningResult.toplamInsaatAlani,
    emsalKapsami,
    emsalDisi: emsalDisiUsed,

    konutAlani,
    ortakKullanim,
    teknikAlan,

    asansor,
    merdiven,
    otopark,
    siginaklar,
  };
}

/**
 * Quick zoning summary for display
 *
 * @param zoningResult - Result from calculateZoning
 * @returns Formatted summary strings
 */
export function formatZoningSummary(zoningResult: ZoningResult): {
  tabanAlani: string;
  toplamInsaat: string;
  katAdedi: string;
  netKullanim: string;
  kapasite: string;
} {
  return {
    tabanAlani: `${zoningResult.tabanAlani.toFixed(2)} m²`,
    toplamInsaat: `${zoningResult.toplamInsaatAlani.toFixed(2)} m²`,
    katAdedi: `${zoningResult.katAdedi} kat${
      zoningResult.isHeightLimited ? ' (yükseklik sınırlı)' : ''
    }${zoningResult.isFloorLimited ? ' (kat adedi sınırlı)' : ''}`,
    netKullanim: `${zoningResult.netKullanimAlani.toFixed(2)} m²`,
    kapasite: `~${Math.floor(zoningResult.netKullanimAlani / 100)} konut (100m²/konut)`,
  };
}
