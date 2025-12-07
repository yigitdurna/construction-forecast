/**
 * Project Converter Utilities
 *
 * Phase 2.4 - Convert between wizard state and project data model
 */

import type { FeasibilityState } from '../types/feasibility';
import type { FeasibilityProject } from '../types/project';
import type { UnitTypeCode } from '../types/feasibility';

/**
 * Convert wizard state to project for saving
 */
export function wizardStateToProject(
  state: FeasibilityState,
  existingProject?: FeasibilityProject
): FeasibilityProject {
  const id = existingProject?.id || crypto.randomUUID();
  const now = new Date().toISOString();

  // Extract parsel data from step 1
  const parsel = state.step1
    ? {
        ilce: state.step1.parselData.ilce,
        ada: state.step1.parselData.ada,
        parsel: state.step1.parselData.parsel,
        alan: state.step1.parselData.parselAlani,
      }
    : existingProject?.parsel || {
        ilce: '',
        ada: '',
        parsel: '',
        alan: 0,
      };

  // Extract imar data from step 1
  const imar = state.step1
    ? {
        taks: state.step1.imarParams.taks,
        kaks: state.step1.imarParams.kaks,
        katAdedi: state.step1.imarParams.katAdedi,
        cikmaKatsayisi: state.step1.imarParams.cikmaKatsayisi || 1.0,
      }
    : existingProject?.imar || {
        taks: 0,
        kaks: 0,
        katAdedi: 0,
        cikmaKatsayisi: 0,
      };

  // Extract zoning data from step 1
  const zoning = state.step1
    ? {
        tabanAlani: state.step1.zoningResult.tabanAlani,
        toplamInsaat: state.step1.zoningResult.toplamInsaatAlani,
        netKullanim: state.step1.zoningResult.netKullanimAlani,
      }
    : existingProject?.zoning || {
        tabanAlani: 0,
        toplamInsaat: 0,
        netKullanim: 0,
      };

  // Extract unit mix from step 2
  // Phase 3.2: Added 1+0, updated default sizes
  const unitMix: FeasibilityProject['unitMix'] = {
    '1+0': { count: 0, area: 40 },
    '1+1': { count: 0, area: 50 },  // Updated from 55m²
    '2+1': { count: 0, area: 80 },  // Updated from 90m²
    '3+1': { count: 0, area: 115 }, // Updated from 120m²
    '4+1': { count: 0, area: 160 }, // Updated from 150m²
    '5+1': { count: 0, area: 220 }, // Updated from 200m²
  };

  if (state.step2) {
    state.step2.units.forEach((unit) => {
      unitMix[unit.type] = {
        count: unit.count,
        area: unit.netArea,
      };
    });
  } else if (existingProject) {
    Object.assign(unitMix, existingProject.unitMix);
  }

  // Extract unit mix summary from step 2
  const unitMixSummary = state.step2
    ? {
        totalUnits: state.step2.totalUnits,
        totalNetArea: state.step2.totalNetArea,
        totalGrossArea: state.step2.totalGrossArea,
        utilization: state.step2.areaUtilization,
      }
    : existingProject?.unitMixSummary || {
        totalUnits: 0,
        totalNetArea: 0,
        totalGrossArea: 0,
        utilization: 0,
      };

  // Extract pricing from step 3
  const constructionQuality = 'ozguntur' as const; // Single quality level - ÖZGÜNTUR standard

  const constructionCostPerM2 = state.step3?.constructionCostPerM2 ||
    existingProject?.constructionCostPerM2 ||
    27500; // ÖZGÜNTUR standard

  const salePrices = state.step3?.salePrices ||
    existingProject?.salePrices || {
      '1+0': 45000,  // Phase 3.2: Highest price per m²
      '1+1': 42000,  // Updated: Higher due to investor demand
      '2+1': 40000,
      '3+1': 38000,
      '4+1': 36000,
      '5+1': 34000,
    };

  // Extract results from step 4
  const results = state.step4
    ? {
        totalCost: state.step4.totalConstructionCost,
        totalRevenue: state.step4.npvAdjustedRevenue,
        grossProfit: state.step4.npvProfit,
        margin: state.step4.profitMargin / 100,
        roi: state.step4.roi,
        npvProfit: state.step4.npvProfit,
        npvROI: state.step4.npvROI,
      }
    : existingProject?.results || {
        totalCost: 0,
        totalRevenue: 0,
        grossProfit: 0,
        margin: 0,
        roi: 0,
        npvProfit: 0,
        npvROI: 0,
      };

  // Generate project name
  const name = existingProject?.name ||
    (parsel.ada && parsel.parsel
      ? `Ada ${parsel.ada}, Parsel ${parsel.parsel}`
      : 'Yeni Proje');

  // Determine if wizard is complete
  const isComplete = state.completedSteps.has(4);

  return {
    id,
    name,
    createdAt: existingProject?.createdAt || now,
    updatedAt: now,
    parsel,
    imar,
    zoning,
    unitMix,
    unitMixSummary,
    constructionQuality,
    constructionCostPerM2,
    salePrices,
    results,
    currentStep: state.currentStep,
    isComplete,
  };
}

/**
 * Convert project to wizard state for loading
 */
export function projectToWizardState(
  project: FeasibilityProject
): Partial<FeasibilityState> {
  const completedSteps = new Set<1 | 2 | 3 | 4>();

  // Build step 1 data if available
  const step1 = project.parsel.ilce && project.parsel.ada
    ? {
        parselData: {
          ilce: project.parsel.ilce,
          ada: project.parsel.ada,
          parsel: project.parsel.parsel,
          parselAlani: project.parsel.alan,
          source: 'manual' as const,
        },
        imarParams: {
          taks: project.imar.taks,
          kaks: project.imar.kaks,
          katAdedi: project.imar.katAdedi,
          cikmaKatsayisi: project.imar.cikmaKatsayisi || 1.0,
        },
        zoningResult: {
          parselAlani: project.parsel.alan,
          tabanAlani: project.zoning.tabanAlani,
          toplamInsaatAlani: project.zoning.toplamInsaat,
          katAdedi: project.imar.katAdedi,
          katBasinaAlan: project.zoning.tabanAlani,
          emsalDisiMax: project.zoning.toplamInsaat * 0.3,
          brutKullanimAlani: project.zoning.toplamInsaat,
          netKullanimAlani: project.zoning.netKullanim,
          isHeightLimited: false,
          isFloorLimited: false,
          appliedTAKS: project.imar.taks,
          appliedKAKS: project.imar.kaks,
          appliedCikma: 1.0,
          appliedNetGrossRatio: 0.85,
        },
      }
    : null;

  if (step1) completedSteps.add(1);

  // Build step 2 data if available
  const step2 = project.unitMixSummary.totalUnits > 0
    ? {
        units: Object.entries(project.unitMix)
          .filter(([_, data]) => data.count > 0)
          .map(([type, data]) => ({
            type: type as UnitTypeCode,
            count: data.count,
            netArea: data.area,
            grossMultiplier: 1.2, // Default, recalculate if needed
          })),
        totalUnits: project.unitMixSummary.totalUnits,
        totalNetArea: project.unitMixSummary.totalNetArea,
        totalGrossArea: project.unitMixSummary.totalGrossArea,
        areaUtilization: project.unitMixSummary.utilization,
        warnings: [],
      }
    : null;

  if (step2) completedSteps.add(2);

  // Build step 3 data if available
  const step3 = project.constructionCostPerM2 > 0
    ? {
        constructionQuality: 'ozguntur' as const, // Single quality level
        constructionCostPerM2: project.constructionCostPerM2,
        salePrices: project.salePrices,
      }
    : null;

  if (step3) completedSteps.add(3);

  // Build step 4 data if available
  const step4 = project.results.totalCost > 0
    ? {
        totalConstructionCost: project.results.totalCost,
        totalCost: project.results.totalCost,
        totalRevenue: project.results.totalRevenue,
        grossProfit: project.results.grossProfit,
        profitMargin: project.results.margin * 100,
        roi: project.results.roi,
        npvAdjustedRevenue: project.results.totalRevenue,
        npvProfit: project.results.npvProfit,
        npvROI: project.results.npvROI,
        scenarios: {
          optimistic: {
            name: 'İyimser',
            totalCost: project.results.totalCost * 0.92,
            totalRevenue: project.results.totalRevenue * 1.08,
            profit: project.results.grossProfit * 1.2,
            margin: project.results.margin * 100 * 1.1,
            roi: project.results.roi * 1.15,
            npvProfit: project.results.npvProfit * 1.2,
            npvROI: project.results.npvROI * 1.15,
          },
          base: {
            name: 'Gerçekçi',
            totalCost: project.results.totalCost,
            totalRevenue: project.results.totalRevenue,
            profit: project.results.grossProfit,
            margin: project.results.margin * 100,
            roi: project.results.roi,
            npvProfit: project.results.npvProfit,
            npvROI: project.results.npvROI,
          },
          pessimistic: {
            name: 'Kötümser',
            totalCost: project.results.totalCost * 1.15,
            totalRevenue: project.results.totalRevenue * 0.92,
            profit: project.results.grossProfit * 0.75,
            margin: project.results.margin * 100 * 0.85,
            roi: project.results.roi * 0.70,
            npvProfit: project.results.npvProfit * 0.75,
            npvROI: project.results.npvROI * 0.70,
          },
        },
      }
    : null;

  if (step4) completedSteps.add(4);

  return {
    currentStep: Math.max(1, project.currentStep) as 1 | 2 | 3 | 4,
    completedSteps,
    step1: step1 || null,
    step2: step2 || null,
    step3: step3 || null,
    step4: step4 || null,
  };
}
