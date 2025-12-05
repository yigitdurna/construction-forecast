/**
 * Unit Mix Calculator Service
 *
 * Calculates optimal distribution of apartment unit types based on:
 * - Available net area from zoning calculations
 * - Market demand patterns in Antalya
 * - Unit size standards
 * - Revenue optimization
 */

import type {
  UnitTypeCode,
  UnitType,
  UnitMixConfig,
  UnitAllocation,
  UnitMixResult,
  ZoningResult,
} from '../types/zoning';
import {
  UNIT_SIZE_RANGES,
  DEFAULT_UNIT_MIX_RATIOS,
  NET_TO_GROSS_MULTIPLIERS,
} from '../types/zoning';

/**
 * Calculate unit mix based on available net area
 *
 * @param netArea - Available net area from zoning calculations (m²)
 * @param config - Unit mix configuration (uses defaults if not provided)
 * @param pricesPerM2 - Price per m² for each unit type (TL/m²)
 * @returns Complete unit mix with revenue projections
 */
export function calculateUnitMix(
  netArea: number,
  config?: Partial<UnitMixConfig>,
  pricesPerM2?: Partial<Record<UnitTypeCode, number>>
): UnitMixResult {
  // Validate input
  if (netArea <= 0 || !isFinite(netArea)) {
    throw new Error('Net alan pozitif bir sayı olmalıdır');
  }

  // Apply defaults
  const mixRatios = config?.mixRatios ?? DEFAULT_UNIT_MIX_RATIOS;
  const preferredSizes = config?.preferredSizes ?? {};
  const minUnitsPerType = config?.minUnitsPerType ?? 1;
  const maxUnitsPerType = config?.maxUnitsPerType ?? Infinity;

  // Default prices if not provided (will be overridden by location data)
  const defaultPrices: Record<UnitTypeCode, number> = {
    '1+1': 75000,  // TL/m²
    '2+1': 70000,
    '3+1': 68000,
    '4+1': 65000,
    '5+1': 63000,
  };

  const finalPrices: Record<UnitTypeCode, number> = {
    ...defaultPrices,
    ...pricesPerM2,
  };

  // Calculate unit allocations
  const allocations: UnitAllocation[] = [];
  const warnings: string[] = [];

  let totalAllocatedArea = 0;
  let totalUnits = 0;

  // Sort unit types by ratio (highest first) for better allocation
  const unitTypes = (Object.keys(mixRatios) as UnitTypeCode[]).filter(
    (type) => (mixRatios[type] ?? 0) > 0
  );

  unitTypes.sort((a, b) => (mixRatios[b] ?? 0) - (mixRatios[a] ?? 0));

  // First pass: Calculate target number of units for each type
  const targetUnits: Record<UnitTypeCode, number> = {} as Record<UnitTypeCode, number>;

  for (const unitType of unitTypes) {
    const ratio = mixRatios[unitType] ?? 0;
    const typicalSize = preferredSizes[unitType] ?? UNIT_SIZE_RANGES[unitType].typical;
    const netToGross = NET_TO_GROSS_MULTIPLIERS[unitType];

    // Estimate how many units of this type based on ratio
    const targetArea = netArea * ratio;
    const targetCount = Math.floor(targetArea / typicalSize);

    targetUnits[unitType] = Math.max(targetCount, ratio > 0 ? minUnitsPerType : 0);
  }

  // Second pass: Adjust to fit within available area
  let remainingArea = netArea;
  const finalCounts: Record<UnitTypeCode, number> = {} as Record<UnitTypeCode, number>;

  for (const unitType of unitTypes) {
    const typicalSize = preferredSizes[unitType] ?? UNIT_SIZE_RANGES[unitType].typical;
    const maxUnits = Math.min(
      targetUnits[unitType],
      maxUnitsPerType,
      Math.floor(remainingArea / typicalSize)
    );

    finalCounts[unitType] = maxUnits;
    remainingArea -= maxUnits * typicalSize;
  }

  // Third pass: Create allocations
  for (const unitType of unitTypes) {
    const count = finalCounts[unitType];
    if (count === 0) continue;

    const netSize = preferredSizes[unitType] ?? UNIT_SIZE_RANGES[unitType].typical;
    const grossMultiplier = NET_TO_GROSS_MULTIPLIERS[unitType];
    const grossSize = netSize * grossMultiplier;
    const pricePerM2 = finalPrices[unitType];
    const totalPrice = grossSize * pricePerM2;

    allocations.push({
      type: unitType,
      netArea: netSize,
      grossArea: grossSize,
      pricePerM2,
      totalPrice,
      count,
    });

    totalAllocatedArea += netSize * count;
    totalUnits += count;
  }

  // Calculate summary statistics
  const totalGrossArea = allocations.reduce(
    (sum, a) => sum + a.grossArea * a.count,
    0
  );

  const totalRevenue = allocations.reduce(
    (sum, a) => sum + a.totalPrice * a.count,
    0
  );

  const averageUnitSize =
    totalUnits > 0
      ? allocations.reduce((sum, a) => sum + a.netArea * a.count, 0) / totalUnits
      : 0;

  const averagePricePerM2 = totalGrossArea > 0 ? totalRevenue / totalGrossArea : 0;

  const averageUnitPrice = totalUnits > 0 ? totalRevenue / totalUnits : 0;

  const areaUtilization = netArea > 0 ? totalAllocatedArea / netArea : 0;

  const mixDiversity = allocations.length;

  // Generate warnings
  if (areaUtilization < 0.80) {
    warnings.push(
      `Düşük alan kullanımı: %${(areaUtilization * 100).toFixed(1)} (hedef: >%80)`
    );
  }

  if (mixDiversity < 2) {
    warnings.push('Düşük çeşitlilik: En az 2 farklı unit tipi önerilir');
  }

  if (totalUnits < 4) {
    warnings.push(
      `Az unit sayısı: ${totalUnits} konut (minimum 4 önerilir ekonomik fizibilite için)`
    );
  }

  const underAllocated = netArea - totalAllocatedArea;
  if (underAllocated > 100) {
    warnings.push(
      `Kullanılmayan alan: ${underAllocated.toFixed(0)} m² (ek unit eklenebilir)`
    );
  }

  return {
    units: allocations,
    totalUnits,
    totalNetArea: totalAllocatedArea,
    totalGrossArea,
    totalRevenue,
    averageUnitSize,
    averagePricePerM2,
    averageUnitPrice,
    areaUtilization,
    mixDiversity,
    warnings,
  };
}

/**
 * Calculate unit mix directly from zoning result
 *
 * Convenience function that takes zoning calculation output
 *
 * @param zoningResult - Result from calculateZoning
 * @param config - Unit mix configuration
 * @param pricesPerM2 - Price per m² for each unit type
 * @returns Complete unit mix
 */
export function calculateUnitMixFromZoning(
  zoningResult: ZoningResult,
  config?: Partial<UnitMixConfig>,
  pricesPerM2?: Partial<Record<UnitTypeCode, number>>
): UnitMixResult {
  return calculateUnitMix(zoningResult.netKullanimAlani, config, pricesPerM2);
}

/**
 * Optimize unit mix for maximum revenue
 *
 * Tries different combinations to maximize total revenue while respecting constraints
 *
 * @param netArea - Available net area (m²)
 * @param pricesPerM2 - Price per m² for each unit type
 * @param constraints - Optional constraints (min/max units per type, etc.)
 * @returns Optimized unit mix
 */
export function optimizeUnitMixForRevenue(
  netArea: number,
  pricesPerM2: Partial<Record<UnitTypeCode, number>>,
  constraints?: {
    minUnitsPerType?: number;
    maxUnitsPerType?: number;
    requiredTypes?: UnitTypeCode[];
  }
): UnitMixResult {
  const minUnitsPerType = constraints?.minUnitsPerType ?? 1;
  const maxUnitsPerType = constraints?.maxUnitsPerType ?? 100;
  const requiredTypes = constraints?.requiredTypes ?? ['2+1', '3+1']; // Most popular

  let bestMix: UnitMixResult | null = null;
  let bestRevenue = 0;

  // Try different mix ratios
  const mixVariations = generateMixVariations(requiredTypes);

  for (const mixRatios of mixVariations) {
    try {
      const mix = calculateUnitMix(
        netArea,
        {
          mixRatios,
          minUnitsPerType,
          maxUnitsPerType,
        },
        pricesPerM2
      );

      if (mix.totalRevenue > bestRevenue && mix.areaUtilization > 0.75) {
        bestRevenue = mix.totalRevenue;
        bestMix = mix;
      }
    } catch {
      // Skip invalid combinations
      continue;
    }
  }

  if (!bestMix) {
    // Fallback to default mix
    return calculateUnitMix(
      netArea,
      { minUnitsPerType, maxUnitsPerType },
      pricesPerM2
    );
  }

  return bestMix;
}

/**
 * Generate different mix ratio variations for optimization
 *
 * @param requiredTypes - Unit types that must be included
 * @returns Array of mix ratio configurations
 */
function generateMixVariations(
  requiredTypes: UnitTypeCode[]
): Array<Record<UnitTypeCode, number>> {
  const variations: Array<Record<UnitTypeCode, number>> = [];

  // Default/Typical mix (35% 2+1, 40% 3+1, 15% 1+1, 10% 4+1)
  variations.push(DEFAULT_UNIT_MIX_RATIOS);

  // Family-focused (10% 2+1, 60% 3+1, 25% 4+1, 5% 1+1)
  variations.push({
    '1+1': 0.05,
    '2+1': 0.10,
    '3+1': 0.60,
    '4+1': 0.25,
    '5+1': 0.00,
  });

  // Investment-focused (40% 1+1, 40% 2+1, 15% 3+1, 5% 4+1)
  variations.push({
    '1+1': 0.40,
    '2+1': 0.40,
    '3+1': 0.15,
    '4+1': 0.05,
    '5+1': 0.00,
  });

  // Luxury-focused (0% 1+1, 20% 2+1, 40% 3+1, 35% 4+1, 5% 5+1)
  variations.push({
    '1+1': 0.00,
    '2+1': 0.20,
    '3+1': 0.40,
    '4+1': 0.35,
    '5+1': 0.05,
  });

  // Balanced (20% each for 1+1 through 4+1, 20% 5+1)
  variations.push({
    '1+1': 0.20,
    '2+1': 0.20,
    '3+1': 0.20,
    '4+1': 0.20,
    '5+1': 0.20,
  });

  // Mid-range focused (10% 1+1, 45% 2+1, 45% 3+1)
  variations.push({
    '1+1': 0.10,
    '2+1': 0.45,
    '3+1': 0.45,
    '4+1': 0.00,
    '5+1': 0.00,
  });

  return variations;
}

/**
 * Calculate revenue potential for a given unit type
 *
 * @param unitType - Unit type code
 * @param count - Number of units
 * @param pricePerM2 - Price per m²
 * @param preferredSize - Preferred unit size (uses typical if not provided)
 * @returns Total revenue for this allocation
 */
export function calculateUnitTypeRevenue(
  unitType: UnitTypeCode,
  count: number,
  pricePerM2: number,
  preferredSize?: number
): number {
  const netSize = preferredSize ?? UNIT_SIZE_RANGES[unitType].typical;
  const grossMultiplier = NET_TO_GROSS_MULTIPLIERS[unitType];
  const grossSize = netSize * grossMultiplier;
  const unitPrice = grossSize * pricePerM2;
  const totalRevenue = unitPrice * count;

  return totalRevenue;
}

/**
 * Format unit mix summary for display
 *
 * @param mix - Unit mix result
 * @returns Formatted summary strings
 */
export function formatUnitMixSummary(mix: UnitMixResult): {
  unitsBreakdown: string;
  revenueBreakdown: string;
  averages: string;
  utilization: string;
} {
  const unitsBreakdown = mix.units
    .map((u) => `${u.count}x ${u.type} (${u.netArea}m²)`)
    .join(', ');

  const revenueBreakdown = mix.units
    .map(
      (u) =>
        `${u.type}: ${((u.totalPrice * u.count) / 1_000_000).toFixed(1)}M TL`
    )
    .join(', ');

  const averages = `Ortalama: ${mix.averageUnitSize.toFixed(0)}m², ${(
    mix.averageUnitPrice / 1_000_000
  ).toFixed(2)}M TL/konut`;

  const utilization = `Alan kullanımı: %${(
    mix.areaUtilization * 100
  ).toFixed(1)} (${mix.totalNetArea.toFixed(0)}/${mix.totalNetArea / mix.areaUtilization}m²)`;

  return {
    unitsBreakdown,
    revenueBreakdown,
    averages,
    utilization,
  };
}

/**
 * Validate unit mix result
 *
 * Checks for common issues and returns validation errors
 *
 * @param mix - Unit mix result
 * @param minUtilization - Minimum acceptable area utilization (default 0.75)
 * @returns Validation errors
 */
export function validateUnitMix(
  mix: UnitMixResult,
  minUtilization: number = 0.75
): string[] {
  const errors: string[] = [];

  if (mix.totalUnits === 0) {
    errors.push('Hiç konut tahsis edilemedi');
  }

  if (mix.areaUtilization < minUtilization) {
    errors.push(
      `Alan kullanımı çok düşük: %${(mix.areaUtilization * 100).toFixed(
        1
      )} (minimum: %${(minUtilization * 100).toFixed(1)})`
    );
  }

  if (mix.areaUtilization > 1.0) {
    errors.push('Alan kullanımı %100\'ü aşıyor (hata!)');
  }

  if (mix.totalRevenue === 0) {
    errors.push('Toplam gelir hesaplanamadı');
  }

  if (mix.averagePricePerM2 <= 0) {
    errors.push('Ortalama m² fiyatı geçersiz');
  }

  return errors;
}

/**
 * Compare two unit mixes
 *
 * @param mixA - First mix
 * @param mixB - Second mix
 * @returns Comparison result with metrics
 */
export function compareUnitMixes(
  mixA: UnitMixResult,
  mixB: UnitMixResult
): {
  revenueWinner: 'A' | 'B' | 'tie';
  revenueDiff: number;
  revenueDiffPercent: number;
  utilizationWinner: 'A' | 'B' | 'tie';
  utilizationDiff: number;
  diversityWinner: 'A' | 'B' | 'tie';
  recommendation: 'A' | 'B' | 'tie';
} {
  const revenueDiff = mixA.totalRevenue - mixB.totalRevenue;
  const revenueDiffPercent =
    mixB.totalRevenue > 0 ? (revenueDiff / mixB.totalRevenue) * 100 : 0;

  const revenueWinner =
    Math.abs(revenueDiff) < 1000 ? 'tie' : revenueDiff > 0 ? 'A' : 'B';

  const utilizationDiff = mixA.areaUtilization - mixB.areaUtilization;
  const utilizationWinner =
    Math.abs(utilizationDiff) < 0.01 ? 'tie' : utilizationDiff > 0 ? 'A' : 'B';

  const diversityWinner =
    mixA.mixDiversity === mixB.mixDiversity
      ? 'tie'
      : mixA.mixDiversity > mixB.mixDiversity
      ? 'A'
      : 'B';

  // Simple recommendation: revenue is king, but high utilization is important
  let recommendation: 'A' | 'B' | 'tie' = 'tie';

  if (revenueWinner !== 'tie') {
    // If revenue winner also has good utilization (>80%), recommend it
    const winner = revenueWinner === 'A' ? mixA : mixB;
    if (winner.areaUtilization > 0.80) {
      recommendation = revenueWinner;
    } else {
      // Otherwise, check if the other mix has significantly better utilization
      const loser = revenueWinner === 'A' ? mixB : mixA;
      if (loser.areaUtilization - winner.areaUtilization > 0.15) {
        recommendation = revenueWinner === 'A' ? 'B' : 'A';
      } else {
        recommendation = revenueWinner;
      }
    }
  }

  return {
    revenueWinner,
    revenueDiff,
    revenueDiffPercent,
    utilizationWinner,
    utilizationDiff,
    diversityWinner,
    recommendation,
  };
}
