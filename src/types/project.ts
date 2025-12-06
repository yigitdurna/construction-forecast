/**
 * Project Persistence Types
 *
 * Phase 2.4 - Data model for saved feasibility projects
 */

import type { UnitTypeCode } from './feasibility';

/**
 * Complete feasibility project (saved to LocalStorage)
 */
export interface FeasibilityProject {
  // Metadata
  id: string; // UUID
  name: string; // User-defined project name
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp

  // Step 1: Parsel & İmar Data
  parsel: {
    ilce: string;
    ada: string;
    parsel: string;
    alan: number; // m² from TKGM
  };
  imar: {
    taks: number;
    kaks: number;
    katAdedi: number;
  };
  zoning: {
    tabanAlani: number; // m²
    toplamInsaat: number; // m²
    netKullanim: number; // m²
  };

  // Step 2: Unit Mix
  unitMix: Record<
    UnitTypeCode,
    {
      count: number;
      area: number; // Net area per unit (m²)
    }
  >;
  unitMixSummary: {
    totalUnits: number;
    totalNetArea: number;
    totalGrossArea: number;
    utilization: number; // 0.0-1.0
  };

  // Step 3: Pricing
  constructionQuality: 'standard' | 'mid' | 'luxury';
  constructionCostPerM2: number;
  salePrices: Record<UnitTypeCode, number>; // TL/m²

  // Step 4: Results (calculated, stored for quick display)
  results: {
    totalCost: number; // TL
    totalRevenue: number; // TL (NPV-adjusted)
    grossProfit: number; // TL
    margin: number; // 0.0-1.0
    roi: number; // %
    npvProfit: number; // TL
    npvROI: number; // %
  };

  // Wizard state
  currentStep: number; // 1-4
  isComplete: boolean; // All 4 steps completed
}

/**
 * Lightweight project info for list view
 */
export interface ProjectListItem {
  id: string;
  name: string;
  updatedAt: string;
  parselInfo: string; // "Ada 6960, Parsel 4 - Muratpaşa"
  profit: number;
  margin: number;
  isComplete: boolean;
}

/**
 * Project creation input
 */
export interface CreateProjectInput {
  name?: string;
  parsel?: FeasibilityProject['parsel'];
  imar?: FeasibilityProject['imar'];
}

/**
 * Convert project to list item
 */
export function projectToListItem(project: FeasibilityProject): ProjectListItem {
  return {
    id: project.id,
    name: project.name,
    updatedAt: project.updatedAt,
    parselInfo: `Ada ${project.parsel.ada}, Parsel ${project.parsel.parsel} - ${project.parsel.ilce}`,
    profit: project.results.grossProfit,
    margin: project.results.margin,
    isComplete: project.isComplete,
  };
}

/**
 * Create empty project template
 */
export function createEmptyProject(input?: CreateProjectInput): FeasibilityProject {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    id,
    name: input?.name || 'Yeni Proje',
    createdAt: now,
    updatedAt: now,
    parsel: input?.parsel || {
      ilce: '',
      ada: '',
      parsel: '',
      alan: 0,
    },
    imar: input?.imar || {
      taks: 0,
      kaks: 0,
      katAdedi: 0,
    },
    zoning: {
      tabanAlani: 0,
      toplamInsaat: 0,
      netKullanim: 0,
    },
    unitMix: {
      '1+0': { count: 0, area: 40 },  // Phase 3.2: Added smallest unit type
      '1+1': { count: 0, area: 50 },  // Updated: Was 55m²
      '2+1': { count: 0, area: 80 },  // Updated: Was 90m²
      '3+1': { count: 0, area: 115 }, // Updated: Was 120m²
      '4+1': { count: 0, area: 160 }, // Updated: Was 150m²
      '5+1': { count: 0, area: 220 }, // Updated: Was 200m²
    },
    unitMixSummary: {
      totalUnits: 0,
      totalNetArea: 0,
      totalGrossArea: 0,
      utilization: 0,
    },
    constructionQuality: 'mid',
    constructionCostPerM2: 21500,
    salePrices: {
      '1+0': 45000,  // Phase 3.2: Highest price per m² (small, high demand)
      '1+1': 42000,  // Updated: Higher than before (investor demand)
      '2+1': 40000,
      '3+1': 38000,
      '4+1': 36000,
      '5+1': 34000,
    },
    results: {
      totalCost: 0,
      totalRevenue: 0,
      grossProfit: 0,
      margin: 0,
      roi: 0,
      npvProfit: 0,
      npvROI: 0,
    },
    currentStep: 1,
    isComplete: false,
  };
}
