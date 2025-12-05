/**
 * Unified Municipality İmar Durumu Service
 *
 * Single entry point for fetching İmar Durumu data from all supported municipalities:
 * - Kepez (KEOS system)
 * - Konyaaltı (KEOS system)
 * - Muratpaşa (KBS system)
 *
 * This service:
 * 1. Routes requests to the appropriate municipality service
 * 2. Provides fallback to manual entry when automation fails
 * 3. Handles caching across all municipalities
 * 4. Offers health checks and monitoring
 */

import type {
  ImarDurumu,
  ImarDurumuResponse,
  MunicipalityDistrict,
  MunicipalityConfig,
  ManualImarEntry,
} from '../types/zoning';

import { fetchKepezImar } from './municipalities/kepez';
import { fetchKonyaaltiImar } from './municipalities/konyaalti';
import { fetchMuratpasaImar } from './municipalities/muratpasa';

/**
 * Municipality configurations
 * Ordered by population (priority)
 */
export const MUNICIPALITY_CONFIGS: Record<MunicipalityDistrict, MunicipalityConfig> =
  {
    kepez: {
      district: 'kepez',
      name: 'Kepez',
      system: 'KEOS',
      baseUrl: 'https://keos.kepez-bld.gov.tr/imardurumu/',
      population: 629000,
      enabled: true,
    },
    muratpasa: {
      district: 'muratpasa',
      name: 'Muratpaşa',
      system: 'KBS',
      baseUrl: 'https://kbs.antalya.bel.tr/imardurumu/',
      population: 509000,
      enabled: false, // Disabled until KBS parser implemented
    },
    konyaalti: {
      district: 'konyaalti',
      name: 'Konyaaltı',
      system: 'KEOS',
      baseUrl: 'https://harita.konyaalti.bel.tr/imardurumu/',
      population: 196000,
      enabled: true,
    },
  };

/**
 * Manual entries storage (in-memory for now)
 * In production, this could be stored in localStorage or a database
 */
const manualEntries = new Map<string, ManualImarEntry>();

/**
 * Fetch İmar Durumu from appropriate municipality
 *
 * This is the main entry point for İmar Durumu lookup.
 *
 * @param district - Municipality district
 * @param mahalle - Mahalle (neighborhood) name
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns İmar Durumu response with data or error
 *
 * @example
 * ```typescript
 * const result = await fetchImarDurumu('kepez', 'Gündoğdu', '1234', '5');
 * if (result.success) {
 *   console.log('TAKS:', result.data.taks);
 *   console.log('KAKS:', result.data.kaks);
 * }
 * ```
 */
export async function fetchImarDurumu(
  district: MunicipalityDistrict,
  mahalle: string,
  ada: string,
  parsel: string
): Promise<ImarDurumuResponse> {
  // Check if district is supported
  const config = MUNICIPALITY_CONFIGS[district];
  if (!config) {
    return {
      success: false,
      error: `Desteklenmeyen ilçe: ${district}`,
      source: 'auto',
      timestamp: new Date(),
    };
  }

  // Check if municipality is enabled
  if (!config.enabled) {
    return {
      success: false,
      error: `${config.name} için otomatik sorgu henüz desteklenmiyor. Manuel giriş kullanın.`,
      source: 'auto',
      timestamp: new Date(),
    };
  }

  // Check for manual entry first
  const manualEntry = getManualEntry(district, mahalle, ada, parsel);
  if (manualEntry) {
    return {
      success: true,
      data: manualEntry.imarData,
      source: 'manual',
      timestamp: manualEntry.enteredAt,
    };
  }

  // Route to appropriate municipality service
  try {
    switch (district) {
      case 'kepez':
        return await fetchKepezImar(mahalle, ada, parsel);

      case 'konyaalti':
        return await fetchKonyaaltiImar(mahalle, ada, parsel);

      case 'muratpasa':
        return await fetchMuratpasaImar(mahalle, ada, parsel);

      default:
        return {
          success: false,
          error: `Bilinmeyen ilçe: ${district}`,
          source: 'auto',
          timestamp: new Date(),
        };
    }
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : 'Belediye sistemine bağlanırken hata oluştu',
      source: 'auto',
      timestamp: new Date(),
    };
  }
}

/**
 * Save manual İmar Durumu entry
 *
 * Used as fallback when automated fetch fails
 *
 * @param entry - Manual entry data
 */
export function saveManualEntry(entry: ManualImarEntry): void {
  const key = `${entry.mahalle}-${entry.ada}-${entry.parsel}`;
  manualEntries.set(key, entry);
}

/**
 * Get manual İmar Durumu entry if it exists
 *
 * @param district - Municipality district
 * @param mahalle - Mahalle name
 * @param ada - Ada number
 * @param parsel - Parsel number
 * @returns Manual entry or undefined
 */
export function getManualEntry(
  district: MunicipalityDistrict,
  mahalle: string,
  ada: string,
  parsel: string
): ManualImarEntry | undefined {
  const key = `${mahalle}-${ada}-${parsel}`;
  const entry = manualEntries.get(key);

  // Verify entry is for the correct district
  if (entry && entry.imarData.source === district) {
    return entry;
  }

  return undefined;
}

/**
 * Clear all manual entries
 */
export function clearManualEntries(): void {
  manualEntries.clear();
}

/**
 * Get all manual entries
 */
export function getAllManualEntries(): ManualImarEntry[] {
  return Array.from(manualEntries.values());
}

/**
 * Check availability of all municipalities
 *
 * @returns Object with availability status for each municipality
 */
export async function checkAllMunicipalitiesAvailability(): Promise<
  Record<MunicipalityDistrict, boolean>
> {
  const results = await Promise.allSettled([
    fetch('/api/municipalities/kepez/health').then((r) => r.ok),
    fetch('/api/municipalities/konyaalti/health').then((r) => r.ok),
    fetch('/api/municipalities/muratpasa/health').then((r) => r.ok),
  ]);

  return {
    kepez: results[0].status === 'fulfilled' ? results[0].value : false,
    konyaalti: results[1].status === 'fulfilled' ? results[1].value : false,
    muratpasa: results[2].status === 'fulfilled' ? results[2].value : false,
  };
}

/**
 * Get list of enabled municipalities
 *
 * @returns Array of enabled municipality districts
 */
export function getEnabledMunicipalities(): MunicipalityDistrict[] {
  return Object.entries(MUNICIPALITY_CONFIGS)
    .filter(([_, config]) => config.enabled)
    .map(([district, _]) => district as MunicipalityDistrict);
}

/**
 * Get municipality configuration
 *
 * @param district - Municipality district
 * @returns Municipality configuration or undefined
 */
export function getMunicipalityConfig(
  district: MunicipalityDistrict
): MunicipalityConfig | undefined {
  return MUNICIPALITY_CONFIGS[district];
}

/**
 * Format İmar Durumu for display
 *
 * @param imarData - İmar Durumu data
 * @returns Formatted display strings
 */
export function formatImarDurumu(imarData: ImarDurumu): {
  taks: string;
  kaks: string;
  emsal: string;
  cikma: string;
  maxYukseklik: string;
  maxKatAdedi: string;
  imarDurumu: string;
  source: string;
  confidence: string;
} {
  return {
    taks: imarData.taks.toFixed(2),
    kaks: imarData.kaks.toFixed(2),
    emsal: imarData.emsal.toFixed(2),
    cikma: imarData.cikmaKatsayisi.toFixed(2),
    maxYukseklik: imarData.maxYukseklik
      ? `${imarData.maxYukseklik.toFixed(1)} m`
      : 'Belirtilmemiş',
    maxKatAdedi: imarData.maxKatAdedi
      ? `${imarData.maxKatAdedi} kat`
      : 'Belirtilmemiş',
    imarDurumu: imarData.imarDurumu,
    source:
      imarData.source === 'kepez'
        ? 'Kepez Belediyesi'
        : imarData.source === 'konyaalti'
        ? 'Konyaaltı Belediyesi'
        : imarData.source === 'muratpasa'
        ? 'Muratpaşa/Antalya Büyükşehir Belediyesi'
        : 'Manuel Giriş',
    confidence:
      imarData.confidence === 'high'
        ? 'Yüksek'
        : imarData.confidence === 'medium'
        ? 'Orta'
        : 'Düşük',
  };
}

/**
 * Validate İmar Durumu data
 *
 * Checks if the data is reasonable and complete
 *
 * @param imarData - İmar Durumu to validate
 * @returns Validation result with warnings
 */
export function validateImarData(imarData: ImarDurumu): {
  valid: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check TAKS range
  if (imarData.taks < 0 || imarData.taks > 1) {
    warnings.push(`TAKS değeri anormal: ${imarData.taks} (normal: 0.0-1.0)`);
  }

  // Check KAKS range
  if (imarData.kaks < 0 || imarData.kaks > 5) {
    warnings.push(`KAKS değeri anormal: ${imarData.kaks} (normal: 0.0-5.0)`);
  }

  // Check EMSAL = KAKS
  if (Math.abs(imarData.emsal - imarData.kaks) > 0.01) {
    warnings.push('EMSAL ve KAKS değerleri farklı (genellikle aynı olmalı)');
  }

  // Check çıkma katsayısı range
  if (imarData.cikmaKatsayisi < 1.0 || imarData.cikmaKatsayisi > 2.0) {
    warnings.push(
      `Çıkma katsayısı anormal: ${imarData.cikmaKatsayisi} (normal: 1.0-2.0)`
    );
  }

  // Check if data is old (> 90 days)
  const ageInDays =
    (Date.now() - imarData.fetchedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (ageInDays > 90) {
    warnings.push(
      `İmar bilgisi eski (${Math.floor(ageInDays)} gün önce alındı)`
    );
  }

  return {
    valid: warnings.length === 0,
    warnings,
  };
}
