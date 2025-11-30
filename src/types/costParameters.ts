export type CostCategory =
  | 'structure'      // Kaba Yapı
  | 'envelope'       // Dış Cephe
  | 'mep'            // Mekanik/Elektrik
  | 'interior'       // İç Mekan
  | 'site'           // Saha İşleri
  | 'soft'           // Yumuşak Maliyetler
  | 'financial';     // Finansal

export type ParameterSource = 'default' | 'user' | 'calculated';

export interface CostParameter {
  id: string;
  category: CostCategory;
  label: string;
  labelTR: string;
  description: string;
  unit: 'TL/m²' | 'TL' | '%' | 'x';

  // Value handling
  defaultValue: number;
  userValue: number | null;           // null = use default
  effectiveValue: number;             // userValue ?? defaultValue

  // Quality-based ranges
  rangeByQuality: {
    standard: { min: number; max: number; default: number };
    mid: { min: number; max: number; default: number };
    luxury: { min: number; max: number; default: number };
  };

  // Calculation
  appliesTo: 'gross_sqm' | 'net_sqm' | 'land_sqm' | 'subtotal' | 'fixed';

  // Metadata
  source: ParameterSource;
  isAdvanced: boolean;                // Hide in simple view
}

import { QualityLevel } from './index';

export interface CostParametersState {
  parameters: CostParameter[];
  qualityLevel: QualityLevel;
}
