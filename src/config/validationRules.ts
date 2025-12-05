/**
 * Validation Rules Configuration
 *
 * Centralized validation rules aligned with Turkish municipality standards
 * Based on real İmar Durumu Belgesi requirements
 */

export interface ValidationRule {
  min: number;
  max: number;
  step: number;
  label: string;
  labelEn: string;
  description: string;
  example: string;
  unit?: string;
}

export interface ValidationRules {
  taks: ValidationRule;
  kaks: ValidationRule;
  katAdedi: ValidationRule;
  hMax: ValidationRule;
  cikmaKatsayisi: ValidationRule;
  parselAlani: ValidationRule;
  unitArea: ValidationRule;
  unitCount: ValidationRule;
  salePricePerM2: ValidationRule;
  constructionCostPerM2: ValidationRule;
  inflationRate: ValidationRule;
  appreciationRate: ValidationRule;
  constructionMonths: ValidationRule;
  salesMonths: ValidationRule;
}

/**
 * İmar (Zoning) Validation Rules
 *
 * Based on actual municipality İmar Durumu documents from Antalya
 */
export const IMAR_VALIDATION: ValidationRules = {
  /**
   * TAKS - Taban Alanı Kat Sayısı (Building Coverage Ratio)
   *
   * Ratio of ground floor area to parcel area
   * Range: 0.01 - 1.00 (1% to 100%)
   * Common values: 0.20 - 0.50 (20% - 50%)
   */
  taks: {
    min: 0.01,
    max: 1.0,
    step: 0.01,
    label: 'TAKS (Taban Alanı Kat Sayısı)',
    labelEn: 'Building Coverage Ratio',
    description: 'Binanın zemin kat alanının parsel alanına oranı',
    example: '0.30',
    unit: '',
  },

  /**
   * KAKS / Emsal - Kat Alanı Kat Sayısı (Floor Area Ratio)
   *
   * Ratio of total building area to parcel area
   * Range: 0.01 - 10.00 (high-rise areas can have high KAKS)
   * Common values: 0.50 - 2.50
   */
  kaks: {
    min: 0.01,
    max: 10.0,
    step: 0.01,
    label: 'KAKS / Emsal',
    labelEn: 'Floor Area Ratio',
    description: 'Toplam inşaat alanının parsel alanına oranı',
    example: '1.05',
    unit: '',
  },

  /**
   * Yençok / Kat Adedi - Maximum Number of Floors
   *
   * CRITICAL: This can be a DECIMAL value (e.g., 1.7, 2.5)
   * Represents maximum floors, sometimes including partial floors
   * Range: 0.5 - 50 (allows basement-only to high-rise)
   * Common values: 1.7, 2.0, 3.5, 5.0
   *
   * Examples from real municipality data:
   * - "Yençok: 1.7" (1 full floor + partial second floor)
   * - "Yençok: 2.5" (2 full floors + partial third floor)
   */
  katAdedi: {
    min: 0.5,
    max: 50,
    step: 0.1,
    label: 'Yençok (Kat Adedi)',
    labelEn: 'Maximum Floors',
    description: 'İzin verilen maksimum kat sayısı (ondalık değer olabilir)',
    example: '1.7',
    unit: 'kat',
  },

  /**
   * Hmax - Maximum Building Height
   *
   * Maximum height in meters
   * Range: 3 - 200 meters
   * Common values: 9.50m (3 floors), 15.50m (5 floors)
   */
  hMax: {
    min: 3,
    max: 200,
    step: 0.5,
    label: 'Hmax (Maksimum Yükseklik)',
    labelEn: 'Maximum Height',
    description: 'İzin verilen maksimum bina yüksekliği',
    example: '12.50',
    unit: 'metre',
  },

  /**
   * Çıkma Katsayısı - Projection Coefficient
   *
   * Multiplier for balconies, bay windows, etc.
   * Range: 1.0 - 2.0
   * Common values: 1.4 - 1.8
   */
  cikmaKatsayisi: {
    min: 1.0,
    max: 2.0,
    step: 0.1,
    label: 'Çıkma Katsayısı',
    labelEn: 'Projection Coefficient',
    description: 'Balkon ve çıkmalar için katsayı',
    example: '1.60',
    unit: '',
  },

  /**
   * Parsel Alanı - Parcel Area
   *
   * Land parcel size in square meters
   * Range: 100 - 100,000 m² (100m² to 10 hectares)
   */
  parselAlani: {
    min: 100,
    max: 100000,
    step: 0.01,
    label: 'Parsel Alanı',
    labelEn: 'Parcel Area',
    description: 'Parsel büyüklüğü',
    example: '2500',
    unit: 'm²',
  },

  /**
   * Unit Area - Apartment Unit Size
   *
   * Individual apartment unit size
   * Range: 30 - 500 m² (studio to penthouse)
   */
  unitArea: {
    min: 30,
    max: 500,
    step: 0.1,
    label: 'Daire Alanı',
    labelEn: 'Unit Area',
    description: 'Daire net kullanım alanı',
    example: '120',
    unit: 'm²',
  },

  /**
   * Unit Count - Number of Apartments
   *
   * Total number of residential units
   * Range: 1 - 500
   */
  unitCount: {
    min: 1,
    max: 500,
    step: 1,
    label: 'Daire Sayısı',
    labelEn: 'Unit Count',
    description: 'Toplam daire adedi',
    example: '24',
    unit: 'adet',
  },

  /**
   * Sale Price Per M² - Unit Sale Price
   *
   * Price per square meter for sales
   * Range: 10,000 - 200,000 TL/m²
   */
  salePricePerM2: {
    min: 10000,
    max: 200000,
    step: 100,
    label: 'Satış Fiyatı',
    labelEn: 'Sale Price',
    description: 'Metrekare başına satış fiyatı',
    example: '45000',
    unit: 'TL/m²',
  },

  /**
   * Construction Cost Per M² - Building Cost
   *
   * Cost per square meter for construction
   * Range: 5,000 - 50,000 TL/m²
   */
  constructionCostPerM2: {
    min: 5000,
    max: 50000,
    step: 100,
    label: 'İnşaat Maliyeti',
    labelEn: 'Construction Cost',
    description: 'Metrekare başına inşaat maliyeti',
    example: '15000',
    unit: 'TL/m²',
  },

  /**
   * Inflation Rate - Monthly Inflation
   *
   * Monthly inflation rate as decimal
   * Range: 0% - 10% monthly (0 - 120% annual)
   */
  inflationRate: {
    min: 0,
    max: 0.1,
    step: 0.001,
    label: 'Enflasyon Oranı (Aylık)',
    labelEn: 'Monthly Inflation Rate',
    description: 'Aylık enflasyon oranı',
    example: '0.025',
    unit: '%',
  },

  /**
   * Appreciation Rate - Property Value Growth
   *
   * Monthly property value appreciation rate
   * Range: 0% - 5% monthly (0 - 60% annual)
   */
  appreciationRate: {
    min: 0,
    max: 0.05,
    step: 0.001,
    label: 'Değer Artış Oranı (Aylık)',
    labelEn: 'Monthly Appreciation Rate',
    description: 'Aylık gayrimenkul değer artışı',
    example: '0.015',
    unit: '%',
  },

  /**
   * Construction Duration - Construction Months
   *
   * Total construction duration in months
   * Range: 6 - 60 months
   */
  constructionMonths: {
    min: 6,
    max: 60,
    step: 1,
    label: 'İnşaat Süresi',
    labelEn: 'Construction Duration',
    description: 'Toplam inşaat süresi',
    example: '18',
    unit: 'ay',
  },

  /**
   * Sales Period - Time to Sell
   *
   * Time to sell all units after construction
   * Range: 1 - 24 months
   */
  salesMonths: {
    min: 1,
    max: 24,
    step: 1,
    label: 'Satış Süresi',
    labelEn: 'Sales Period',
    description: 'İnşaat sonrası satış süresi',
    example: '6',
    unit: 'ay',
  },
};

/**
 * Validate a value against a rule
 */
export function validateValue(
  value: number,
  rule: ValidationRule
): { valid: boolean; error?: string } {
  if (value < rule.min) {
    return {
      valid: false,
      error: `${rule.label} en az ${rule.min}${rule.unit ? ' ' + rule.unit : ''} olmalıdır`,
    };
  }

  if (value > rule.max) {
    return {
      valid: false,
      error: `${rule.label} en fazla ${rule.max}${rule.unit ? ' ' + rule.unit : ''} olabilir`,
    };
  }

  return { valid: true };
}

/**
 * Get validation error message
 */
export function getValidationError(
  fieldName: keyof ValidationRules,
  value: number
): string | undefined {
  const rule = IMAR_VALIDATION[fieldName];
  if (!rule) return undefined;

  const result = validateValue(value, rule);
  return result.error;
}

export default IMAR_VALIDATION;
