/**
 * Zoning and TKGM (Turkish Land Registry) Type Definitions
 *
 * This file contains all TypeScript interfaces for Phase 2.1:
 * - TKGM API responses
 * - Zoning calculations (TAKS, KAKS, EMSAL)
 * - Unit mix calculations
 */

// ============================================================================
// İmar Data Model - User Inputs vs Calculated Values
// ============================================================================

/**
 * İmar User Inputs
 *
 * What the user enters from belediye İmar Durumu belgesi
 */
export interface ImarUserInputs {
  parselAlani: number;      // m² - Parcel area
  taks: number;             // 0.01 - 1.00 - Building Coverage Ratio
  kaks: number;             // 0.01 - 10.00 - Floor Area Ratio (Emsal)
  cikmaKatsayisi: number;   // 1.0 - 2.0 - Projection coefficient (REQUIRED - varies by parcel)
  yencokOverride?: number;  // Optional: if belediye specifies max floors
  hmaxOverride?: number;    // Optional: if belediye specifies max height (meters)
}

/**
 * İmar Calculated Values
 *
 * Derived values calculated from user inputs
 */
export interface ImarCalculatedValues {
  tabanAlani: number;           // = parselAlani × TAKS (ground floor area)
  toplamInsaatAlani: number;    // = parselAlani × KAKS (total construction area)
  hesaplananKatAdedi: number;   // = KAKS / TAKS (calculated number of floors)
  uygulanacakKatAdedi: number;  // = min(hesaplanan, yencok, hmax/3.5) (applied floors)
  cikmaIleToplamAlan?: number;  // With çıkma coefficient applied
}

/**
 * Complete İmar Data
 *
 * Combines user inputs and calculated values
 */
export interface ImarData {
  inputs: ImarUserInputs;
  calculated: ImarCalculatedValues;
}

// ============================================================================
// TKGM API Types
// ============================================================================

/**
 * Response from TKGM (Tapu ve Kadastro Genel Müdürlüğü) API
 * Actual structure may vary - will be updated after API testing
 */
export interface TKGMParcelResponse {
  // Basic Parcel Information
  PARSEL?: string;           // Parcel number (e.g., "4")
  ADA?: string;              // Block number (e.g., "6960")
  PAFTA?: string;            // Map sheet number

  // Location Information
  IL?: string;               // Province (e.g., "Antalya")
  ILCE?: string;             // District (e.g., "Muratpaşa")
  MAHALLE?: string;          // Neighborhood (e.g., "Güzeloba")
  MEVKII?: string;           // Locality/Location

  // Area Information
  ALAN?: number;             // Land area in m²
  YUZOLCUMU?: number;        // Surface area (alternative field)

  // Zoning Information (may be nested or flat)
  IMAR_DURUMU?: {
    EMSAL?: number;          // Floor Area Ratio (İmar Katsayısı)
    TAKS?: number;           // Building Coverage Ratio
    KAKS?: number;           // Floor Area Ratio (alternative name)
    CIKMA_KATSAYISI?: number; // Projection coefficient
    MAX_KAT_SAYISI?: number; // Maximum number of floors
    MAX_YUKSEKLIK?: number;  // Maximum height in meters
    IMAR_TIPI?: string;      // Zoning type (residential, commercial, etc.)
  };

  // Land Classification
  NITELIK?: string;          // Land classification/type
  ZEMIN?: string;            // Ground/soil type

  // Status
  DURUM?: string;            // Status (active, restricted, etc.)
  KAYIT_TARIHI?: string;     // Registration date
  GUNCEL_MI?: boolean;       // Is data current?
}

/**
 * Parsed and normalized parcel data for our application
 */
export interface ParcelData {
  // Identification
  ada: string;
  parsel: string;
  ilce: string;
  mahalle: string;

  // Area
  alan: number;              // Land area in m² (CRITICAL FIELD)

  // Zoning information (if available from TKGM)
  imar?: {
    emsal?: number;          // EMSAL = KAKS (Floor Area Ratio)
    taks?: number;           // Building Coverage Ratio
    cikmaKatsayisi?: number; // Projection coefficient
    maxKatSayisi?: number;   // Maximum floors
    maxYukseklik?: number;   // Maximum height (meters)
    imarTipi?: string;       // Zoning type
  };

  // Metadata
  source: 'tkgm' | 'manual';
  lastUpdated?: Date;
}

/**
 * TKGM service response wrapper
 */
export interface TKGMResponse {
  success: boolean;
  data?: ParcelData;
  error?: string;
  source: 'tkgm' | 'cached' | 'fallback';
  timestamp: Date;
}

// ============================================================================
// Municipality İmar Durumu (Zoning Status) Types - Phase 2.2
// ============================================================================

/**
 * İmar Durumu (Zoning Status) data from municipality websites
 *
 * This data is fetched from municipality zoning systems:
 * - Kepez: KEOS system (https://keos.kepez-bld.gov.tr/imardurumu/)
 * - Konyaaltı: KEOS system (https://harita.konyaalti.bel.tr/imardurumu/)
 * - Muratpaşa: KBS system (https://kbs.antalya.bel.tr/imardurumu/)
 */
export interface ImarDurumu {
  // Core zoning coefficients (required for calculations)
  taks: number;              // Taban Alanı Kat Sayısı (Building Coverage Ratio)
  kaks: number;              // Kat Alanı Kat Sayısı (Floor Area Ratio)
  emsal: number;             // Same as KAKS, alternative name

  // Projection and height limits
  cikmaKatsayisi: number;    // Çıkma/Cumba coefficient for balconies
  maxYukseklik?: number;     // Maximum height in meters
  maxKatAdedi?: number;      // Maximum number of floors

  // Zoning classification
  imarDurumu: string;        // e.g., "Konut Alanı", "Ticaret Alanı"
  planNotu?: string;         // Zoning plan notes/restrictions

  // Additional regulations
  yolGenisligi?: number;     // Required road width (meters)
  onCekme?: number;          // Front setback (meters)
  yanCekme?: number;         // Side setback (meters)
  arkaCekme?: number;        // Rear setback (meters)

  // Metadata
  fetchedAt: Date;           // When this data was fetched
  source: 'kepez' | 'konyaalti' | 'muratpasa' | 'manual';
  confidence: 'high' | 'medium' | 'low';  // Data quality indicator
  rawHtml?: string;          // Optional: store raw HTML for debugging
}

/**
 * Response wrapper for İmar Durumu fetch operations
 */
export interface ImarDurumuResponse {
  success: boolean;
  data?: ImarDurumu;
  error?: string;
  source: 'auto' | 'manual' | 'cached';
  timestamp: Date;
  warnings?: string[];       // Non-fatal issues (e.g., missing optional fields)
}

/**
 * Supported municipality districts for İmar Durumu lookup
 */
export type MunicipalityDistrict = 'kepez' | 'konyaalti' | 'muratpasa';

/**
 * Municipality system types
 */
export type MunicipalitySystem = 'KEOS' | 'KBS';

/**
 * Municipality configuration
 */
export interface MunicipalityConfig {
  district: MunicipalityDistrict;
  name: string;              // Display name (Turkish)
  system: MunicipalitySystem;
  baseUrl: string;
  population: number;        // For prioritization
  enabled: boolean;          // Can be disabled if scraper breaks
}

/**
 * HTML selector configuration for parsing municipality pages
 * Each municipality may have different HTML structure
 */
export interface MunicipalitySelectors {
  // Form input selectors
  mahalleInput?: string;
  adaInput?: string;
  parselInput?: string;
  submitButton?: string;

  // Result selectors
  taksSelector: string;
  kaksSelector: string;
  emsalSelector: string;
  cikmaSelector?: string;
  maxYukseklikSelector?: string;
  maxKatAdediSelector?: string;
  imarDurumuSelector: string;
  planNotuSelector?: string;

  // Alternative selectors (fallback if primary fails)
  alternativeSelectors?: {
    [key: string]: string;
  };
}

/**
 * Parse result from municipality HTML
 */
export interface ParsedImarData {
  taks?: number;
  kaks?: number;
  emsal?: number;
  cikmaKatsayisi?: number;
  maxYukseklik?: number;
  maxKatAdedi?: number;
  imarDurumu?: string;
  planNotu?: string;
  parseErrors: string[];     // Issues encountered during parsing
  rawValues: {               // Raw text values before parsing
    [key: string]: string;
  };
}

/**
 * Manual İmar Durumu entry (fallback when scraping fails)
 */
export interface ManualImarEntry {
  mahalle: string;
  ada: string;
  parsel: string;
  imarData: ImarDurumu;
  enteredBy: 'user' | 'admin';
  enteredAt: Date;
  notes?: string;
}

// ============================================================================
// Zoning Calculation Types
// ============================================================================

/**
 * Input parameters for zoning calculations
 * Based on Turkish zoning regulations (İmar Mevzuatı)
 */
export interface ZoningParams {
  // Land Information
  parselAlani: number;       // Parcel area in m² (from TKGM or manual)

  // Zoning Coefficients
  taks: number;              // Taban Alanı Kat Sayısı (Building Coverage Ratio)
                             // Range: 0.0-1.0 (typically 0.20-0.40)

  kaks: number;              // Kat Alanı Kat Sayısı (Floor Area Ratio = EMSAL)
                             // Range: 0.0-3.0 (typically 0.60-2.50)

  // Phase 2.2: Made optional for simplified manual entry
  // Defaults to 1.0 (no projection) if not provided
  cikmaKatsayisi?: number;   // Çıkma/Cumba Katsayısı (Projection coefficient)
                             // Range: 1.0-2.0 (typically 1.40-1.80)
                             // Accounts for balconies, bay windows

  // Height Restrictions (optional, use whichever is more restrictive)
  maxYukseklik?: number;     // Maximum building height in meters
  maxKatAdedi?: number;      // Maximum number of floors

  // Advanced Parameters
  netGrossRatio?: number;    // Net to Gross area ratio (default: 0.85)
  emsalDisiOran?: number;    // Exempt area ratio (default: 0.30 = 30% max)
}

/**
 * Zoning calculation results
 * All areas in m²
 */
export interface ZoningResult {
  // Input echo
  parselAlani: number;

  // Primary Calculations
  tabanAlani: number;        // Ground floor coverage = parsel × TAKS

  toplamInsaatAlani: number; // Total construction area = parsel × KAKS × çıkma

  katAdedi: number;          // Number of floors = KAKS / TAKS
                             // Also checked against: maxYukseklik / 3.0

  katBasinaAlan: number;     // Area per floor = tabanAlani

  // Exempt Areas (Emsal Dışı Alanlar)
  emsalDisiMax: number;      // Maximum exempt area = 30% of total
                             // Includes: elevators, stairs, parking, shelters

  // Usable Areas
  brutKullanimAlani: number; // Gross usable area (toplamInsaat - emsalDisi)
  netKullanimAlani: number;  // Net usable area = brut × netGrossRatio

  // Validation Flags
  isHeightLimited: boolean;  // True if maxYukseklik limits floors more than KAKS
  isFloorLimited: boolean;   // True if maxKatAdedi limits floors more than KAKS

  // Applied Coefficients (for transparency)
  appliedTAKS: number;
  appliedKAKS: number;
  appliedCikma: number;
  appliedNetGrossRatio: number;
}

// ============================================================================
// Unit Mix Calculator Types
// ============================================================================

/**
 * Standard Turkish apartment unit types
 * Format: {number_of_bedrooms}+{number_of_living_rooms}
 *
 * Phase 3.2: Added 1+0 for smaller, investment-focused units
 */
export type UnitTypeCode = '1+0' | '1+1' | '2+1' | '3+1' | '4+1' | '5+1';

/**
 * Unit type definition with sizing and pricing
 */
export interface UnitType {
  code: UnitTypeCode;

  // Area information
  netArea: number;           // Net internal area (m²)
  grossArea: number;         // Gross area including share of common areas (m²)
  grossMultiplier: number;   // Gross = Net × multiplier (typically 1.15-1.25)

  // Pricing
  pricePerM2: number;        // Sale price per m² (TL)
  totalPrice: number;        // Total unit price (TL)

  // Characteristics
  bedrooms: number;
  livingRooms: number;
  bathrooms: number;

  // Market data
  demandMultiplier: number;  // Market demand factor (1.0 = average)
}

/**
 * Unit size ranges for each type
 * Based on market standards in Antalya
 */
export interface UnitSizeRange {
  min: number;               // Minimum net area (m²)
  typical: number;           // Typical/recommended net area (m²)
  max: number;               // Maximum net area (m²)
}

/**
 * Unit mix configuration - defines distribution of unit types
 */
export interface UnitMixConfig {
  mixRatios: {
    [K in UnitTypeCode]?: number; // Percentage (0.0-1.0)
  };

  // Customization
  preferredSizes?: {
    [K in UnitTypeCode]?: number; // Preferred net area (m²)
  };

  // Constraints
  minUnitsPerType?: number;  // Minimum units per type (for diversity)
  maxUnitsPerType?: number;  // Maximum units per type (to avoid oversupply)
}

/**
 * Individual unit in the final mix
 */
export interface UnitAllocation {
  type: UnitTypeCode;
  netArea: number;           // Net area (m²)
  grossArea: number;         // Gross area (m²)
  pricePerM2: number;        // TL/m²
  totalPrice: number;        // Total unit price (TL)
  count: number;             // Number of this unit type
}

/**
 * Complete unit mix calculation result
 */
export interface UnitMixResult {
  // Unit allocations
  units: UnitAllocation[];

  // Summary statistics
  totalUnits: number;
  totalNetArea: number;      // Sum of all net areas (m²)
  totalGrossArea: number;    // Sum of all gross areas (m²)
  totalRevenue: number;      // Total sales revenue (TL)

  // Averages
  averageUnitSize: number;   // Average net area per unit (m²)
  averagePricePerM2: number; // Weighted average price (TL/m²)
  averageUnitPrice: number;  // Average price per unit (TL)

  // Validation
  areaUtilization: number;   // Percentage of available area used (0.0-1.0)
  mixDiversity: number;      // Number of different unit types

  // Warnings
  warnings: string[];        // Any issues with the mix
}

// ============================================================================
// Validation and Error Types
// ============================================================================

/**
 * Validation result for Ada/Parsel input
 */
export interface AdaParselValidation {
  valid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Error types for zoning calculations
 */
export type ZoningErrorType =
  | 'invalid_parsel_area'
  | 'invalid_taks'
  | 'invalid_kaks'
  | 'invalid_cikma'
  | 'invalid_height'
  | 'taks_exceeds_limit'
  | 'kaks_exceeds_limit'
  | 'insufficient_area'
  | 'calculation_error';

/**
 * Zoning calculation error
 */
export interface ZoningError {
  type: ZoningErrorType;
  message: string;
  field?: keyof ZoningParams;
  value?: number;
}

// ============================================================================
// Constants and Defaults
// ============================================================================

/**
 * Standard unit size ranges (net area in m²)
 * Based on market research in Antalya
 *
 * Phase 3.2: Added 1+0 for smaller, investment-focused units
 */
export const UNIT_SIZE_RANGES: Record<UnitTypeCode, UnitSizeRange> = {
  '1+0': { min: 30, typical: 40, max: 50 },      // Phase 3.2: Smallest, high ROI
  '1+1': { min: 45, typical: 50, max: 65 },      // Updated typical: 50m² (was 55m²)
  '2+1': { min: 70, typical: 80, max: 110 },     // Updated typical: 80m² (was 90m²)
  '3+1': { min: 100, typical: 115, max: 140 },   // Updated typical: 115m² (was 120m²)
  '4+1': { min: 140, typical: 160, max: 180 },   // Updated typical: 160m² (was 150m²)
  '5+1': { min: 180, typical: 220, max: 280 },   // Larger luxury units
};

/**
 * Typical unit mix for mid-range residential projects
 * Based on market demand in Antalya
 *
 * Phase 3.2: Updated for investment-focused Antalya market (2024-2025)
 * - Smaller units (1+0, 1+1) = 50% for rental/investment
 * - Family units (2+1, 3+1) = 35% for permanent residents
 * - Luxury units (4+1) = 10% for premium buyers
 */
export const DEFAULT_UNIT_MIX_RATIOS: Record<UnitTypeCode, number> = {
  '1+0': 0.15,     // 15% - Singles, Airbnb/rental investment, highest price per m²
  '1+1': 0.35,     // 35% - MOST POPULAR - investors + small families
  '2+1': 0.25,     // 25% - Small families, good demand
  '3+1': 0.10,     // 10% - Families, moderate demand
  '4+1': 0.10,     // 10% - Large families, luxury segment
  '5+1': 0.05,     // 5%  - Very high-end only
};

/**
 * Net to gross area multipliers by unit type
 * Smaller units have higher common area share
 *
 * Phase 3.2: Added 1+0 with higher multiplier (more common area %)
 */
export const NET_TO_GROSS_MULTIPLIERS: Record<UnitTypeCode, number> = {
  '1+0': 1.28,     // 28% common areas (elevators, stairs proportionally larger)
  '1+1': 1.25,     // 25% common areas
  '2+1': 1.20,     // 20% common areas
  '3+1': 1.18,     // 18% common areas
  '4+1': 1.15,     // 15% common areas
  '5+1': 1.15,     // 15% common areas
};

/**
 * Default zoning parameters for validation
 */
export const ZONING_LIMITS = {
  // TAKS limits
  MIN_TAKS: 0.0,
  MAX_TAKS: 1.0,
  TYPICAL_TAKS: 0.30,

  // KAKS/EMSAL limits
  MIN_KAKS: 0.0,
  MAX_KAKS: 5.0,           // Extreme high-rise
  TYPICAL_KAKS: 1.50,

  // Çıkma katsayısı limits
  MIN_CIKMA: 1.0,          // No projection
  MAX_CIKMA: 2.0,          // 100% projection
  TYPICAL_CIKMA: 1.60,

  // Net/Gross ratio limits (CORRECTED based on real project data)
  MIN_NET_GROSS: 0.60,     // High-rise with many elevators
  MAX_NET_GROSS: 0.85,     // Very efficient design (lowered from 0.90)
  TYPICAL_NET_GROSS: 0.77, // ÖZGÜNTUR project: 76.9% (was 0.85)

  // Emsal dışı limits
  MAX_EMSAL_DISI_RATIO: 0.30, // Maximum 30% exempt

  // Floor height
  TYPICAL_FLOOR_HEIGHT: 3.0, // meters
  MIN_FLOOR_HEIGHT: 2.8,
  MAX_FLOOR_HEIGHT: 4.0,

  // Parcel area
  MIN_PARSEL_AREA: 100,    // m² - minimum viable
  MAX_PARSEL_AREA: 100000, // m² - 10 hectares
};
