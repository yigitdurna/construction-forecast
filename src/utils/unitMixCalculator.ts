/**
 * Unit Mix Calculator
 * 
 * Calculates optimal unit mix for maximum profitability based on:
 * - Project type and total area
 * - Location demand patterns
 * - Price multipliers for different unit sizes
 */

import { ProjectType, UnitMix, UnitMixConfig } from '../types';
import { 
  UnitTypeData, 
  getUnitTypesForProject, 
  getLocationType 
} from '../data/unitTypes';

/**
 * Calculate revenue for a single unit type
 */
export function calculateUnitRevenue(
  unitType: UnitTypeData,
  basePricePerSqm: number,
  count: number,
  sizePerUnit: number = unitType.avgSize
): { totalSqm: number; pricePerSqm: number; revenue: number } {
  const totalSqm = count * sizePerUnit;
  const pricePerSqm = basePricePerSqm * unitType.priceMultiplier;
  const revenue = totalSqm * pricePerSqm;
  
  return { totalSqm, pricePerSqm, revenue };
}

/**
 * Calculate optimal unit mix for maximum profitability
 * 
 * Algorithm:
 * 1. Get applicable unit types for project
 * 2. Score each unit type based on location demand and price multiplier
 * 3. Allocate area to highest-scoring units first
 * 4. Ensure practical constraints (minimum units, whole numbers)
 */
export function calculateOptimalUnitMix(
  totalSqm: number,
  projectType: ProjectType,
  location: string,
  basePricePerSqm: number
): UnitMixConfig {
  const unitTypes = getUnitTypesForProject(projectType);
  const locationType = getLocationType(location);
  
  // Score each unit type: demand × price multiplier
  const scoredTypes = unitTypes.map(ut => ({
    unitType: ut,
    score: ut.demandByLocation[locationType] * ut.priceMultiplier,
    demandScore: ut.demandByLocation[locationType],
  })).sort((a, b) => b.score - a.score);
  
  // Allocate area using weighted distribution
  const units: UnitMix[] = [];
  let remainingSqm = totalSqm;
  let totalRevenue = 0;
  
  // Calculate total score for percentage allocation
  const totalScore = scoredTypes.reduce((sum, st) => sum + st.score, 0);
  
  for (const { unitType, score } of scoredTypes) {
    if (remainingSqm <= 0) break;
    
    // Allocate percentage of remaining area based on score
    const targetAllocation = (score / totalScore) * totalSqm;
    const maxUnits = Math.floor(targetAllocation / unitType.avgSize);
    
    if (maxUnits > 0) {
      // Use average size for this unit type
      const count = Math.min(maxUnits, Math.floor(remainingSqm / unitType.avgSize));
      
      if (count > 0) {
        const { totalSqm: unitTotalSqm, pricePerSqm, revenue } = calculateUnitRevenue(
          unitType,
          basePricePerSqm,
          count
        );
        
        units.push({
          unitTypeId: unitType.id,
          label: unitType.labelTR,
          count,
          sizePerUnit: unitType.avgSize,
          totalSqm: unitTotalSqm,
          pricePerSqm,
          estimatedRevenue: revenue,
        });
        
        remainingSqm -= unitTotalSqm;
        totalRevenue += revenue;
      }
    }
  }
  
  // If there's remaining space, add to the most demanded unit type
  if (remainingSqm >= scoredTypes[0].unitType.minSize) {
    const topType = scoredTypes[0].unitType;
    const additionalUnits = Math.floor(remainingSqm / topType.avgSize);
    
    if (additionalUnits > 0) {
      const existingUnit = units.find(u => u.unitTypeId === topType.id);
      const { totalSqm: addSqm, pricePerSqm, revenue } = calculateUnitRevenue(
        topType,
        basePricePerSqm,
        additionalUnits
      );
      
      if (existingUnit) {
        existingUnit.count += additionalUnits;
        existingUnit.totalSqm += addSqm;
        existingUnit.estimatedRevenue += revenue;
      } else {
        units.push({
          unitTypeId: topType.id,
          label: topType.labelTR,
          count: additionalUnits,
          sizePerUnit: topType.avgSize,
          totalSqm: addSqm,
          pricePerSqm,
          estimatedRevenue: revenue,
        });
      }
      totalRevenue += revenue;
    }
  }
  
  // Calculate totals
  const totalUnits = units.reduce((sum, u) => sum + u.count, 0);
  const totalAllocatedSqm = units.reduce((sum, u) => sum + u.totalSqm, 0);
  const averageUnitSize = totalUnits > 0 ? totalAllocatedSqm / totalUnits : 0;
  
  return {
    isAutoOptimized: true,
    units,
    totalUnits,
    totalSqm: totalAllocatedSqm,
    averageUnitSize,
    totalEstimatedRevenue: totalRevenue,
  };
}

/**
 * Calculate unit mix from user-defined configuration
 */
export function calculateCustomUnitMix(
  customUnits: Array<{ unitTypeId: string; count: number; sizePerUnit?: number }>,
  projectType: ProjectType,
  basePricePerSqm: number
): UnitMixConfig {
  const unitTypes = getUnitTypesForProject(projectType);
  const units: UnitMix[] = [];
  let totalRevenue = 0;
  
  for (const custom of customUnits) {
    const unitType = unitTypes.find(ut => ut.id === custom.unitTypeId);
    if (!unitType || custom.count <= 0) continue;
    
    const sizePerUnit = custom.sizePerUnit || unitType.avgSize;
    const { totalSqm, pricePerSqm, revenue } = calculateUnitRevenue(
      unitType,
      basePricePerSqm,
      custom.count,
      sizePerUnit
    );
    
    units.push({
      unitTypeId: unitType.id,
      label: unitType.labelTR,
      count: custom.count,
      sizePerUnit,
      totalSqm,
      pricePerSqm,
      estimatedRevenue: revenue,
    });
    
    totalRevenue += revenue;
  }
  
  const totalUnits = units.reduce((sum, u) => sum + u.count, 0);
  const totalSqm = units.reduce((sum, u) => sum + u.totalSqm, 0);
  const averageUnitSize = totalUnits > 0 ? totalSqm / totalUnits : 0;
  
  return {
    isAutoOptimized: false,
    units,
    totalUnits,
    totalSqm,
    averageUnitSize,
    totalEstimatedRevenue: totalRevenue,
  };
}

/**
 * Validate unit mix against total project area
 */
export function validateUnitMix(
  unitMix: UnitMixConfig,
  targetTotalSqm: number,
  tolerance: number = 0.1 // 10% tolerance
): { isValid: boolean; message: string; difference: number } {
  const difference = unitMix.totalSqm - targetTotalSqm;
  const percentDiff = Math.abs(difference) / targetTotalSqm;
  
  if (percentDiff <= tolerance) {
    return {
      isValid: true,
      message: `Toplam alan hedefle uyumlu (${unitMix.totalSqm.toLocaleString('tr-TR')} m²)`,
      difference,
    };
  }
  
  if (difference > 0) {
    return {
      isValid: false,
      message: `Toplam alan hedefi ${Math.abs(difference).toLocaleString('tr-TR')} m² aşıyor`,
      difference,
    };
  }
  
  return {
    isValid: false,
    message: `Toplam alan hedefin ${Math.abs(difference).toLocaleString('tr-TR')} m² altında`,
    difference,
  };
}

/**
 * Get optimization suggestions for a unit mix
 */
export function getOptimizationSuggestions(
  currentMix: UnitMixConfig,
  optimalMix: UnitMixConfig
): string[] {
  const suggestions: string[] = [];
  
  // Compare revenue
  const revenueDiff = optimalMix.totalEstimatedRevenue - currentMix.totalEstimatedRevenue;
  if (revenueDiff > 0) {
    suggestions.push(
      `Optimize edilmiş dağılım ile tahmini ${(revenueDiff / 1000000).toFixed(1)}M TL daha fazla gelir elde edilebilir`
    );
  }
  
  // Check for missing high-demand units
  for (const optUnit of optimalMix.units) {
    const currentUnit = currentMix.units.find(u => u.unitTypeId === optUnit.unitTypeId);
    if (!currentUnit && optUnit.count > 0) {
      suggestions.push(`${optUnit.label} eklenmesi düşünülebilir (${optUnit.count} adet öneriliyor)`);
    } else if (currentUnit && optUnit.count > currentUnit.count * 1.5) {
      suggestions.push(`${optUnit.label} sayısı artırılabilir (${currentUnit.count} → ${optUnit.count})`);
    }
  }
  
  return suggestions;
}

/**
 * Calculate simple unit count (legacy support)
 */
export function calculateSimpleUnitCount(
  totalSqm: number,
  projectType: ProjectType
): number {
  const unitTypes = getUnitTypesForProject(projectType);
  // Use the most common unit type for the project
  const primaryType = unitTypes[Math.floor(unitTypes.length / 2)];
  return Math.max(1, Math.floor(totalSqm / primaryType.avgSize));
}
