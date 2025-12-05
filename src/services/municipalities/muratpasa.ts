/**
 * Muratpaşa Municipality İmar Durumu Service
 *
 * Fetches zoning information from Muratpaşa (via Antalya Büyükşehir) KBS system
 * URL: https://kbs.antalya.bel.tr/imardurumu/
 *
 * Muratpaşa is the second-largest district in Antalya (509K population)
 * Uses KBS (Kent Bilgi Sistemi) - DIFFERENT from KEOS used by Kepez/Konyaaltı
 *
 * ⚠️ CRITICAL: KBS system structure may be completely different
 * Manual testing required to understand:
 * 1. Request format (form POST? API call?)
 * 2. Required parameters
 * 3. Response format (HTML? JSON?)
 * 4. HTML structure for data extraction
 *
 * TEST CASE: Ada 6960, Parsel 4 (Güzeloba)
 */

import type { ImarDurumu, ImarDurumuResponse } from '../../types/zoning';

/**
 * Timeout for requests
 */
const MURATPASA_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Cache duration
 */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Cache storage
 */
interface CacheEntry {
  data: ImarDurumu;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Validate input for Muratpaşa
 */
function validateMuratpasaInput(
  mahalle: string,
  ada: string,
  parsel: string
): { valid: boolean; error?: string } {
  if (!mahalle || mahalle.trim() === '') {
    return {
      valid: false,
      error: 'Mahalle adı gereklidir',
    };
  }

  if (!ada || ada.trim() === '') {
    return {
      valid: false,
      error: 'Ada numarası gereklidir',
    };
  }

  if (!parsel || parsel.trim() === '') {
    return {
      valid: false,
      error: 'Parsel numarası gereklidir',
    };
  }

  if (!/^\d+$/.test(ada.trim())) {
    return {
      valid: false,
      error: 'Ada numarası sadece rakamlardan oluşmalıdır',
    };
  }

  if (!/^\d+$/.test(parsel.trim())) {
    return {
      valid: false,
      error: 'Parsel numarası sadece rakamlardan oluşmalıdır',
    };
  }

  return { valid: true };
}

/**
 * Fetch İmar Durumu from Muratpaşa/Antalya Municipality
 *
 * @param mahalle - Mahalle (neighborhood) name
 * @param ada - Ada (block) number
 * @param parsel - Parcel (parcel) number
 * @returns İmar Durumu response with data or error
 */
export async function fetchMuratpasaImar(
  mahalle: string,
  ada: string,
  parsel: string
): Promise<ImarDurumuResponse> {
  // Validate input
  const validation = validateMuratpasaInput(mahalle, ada, parsel);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error ?? 'Geçersiz parametre',
      source: 'auto',
      timestamp: new Date(),
    };
  }

  // Normalize inputs
  const normalizedMahalle = mahalle.trim();
  const normalizedAda = ada.trim();
  const normalizedParsel = parsel.trim();

  // Check cache
  const cacheKey = `muratpasa-${normalizedMahalle}-${normalizedAda}-${normalizedParsel}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    return {
      success: true,
      data: cached.data,
      source: 'cached',
      timestamp: new Date(cached.timestamp),
    };
  }

  // Call serverless proxy
  try {
    const proxyUrl = `/api/municipalities/muratpasa?mahalle=${encodeURIComponent(
      normalizedMahalle
    )}&ada=${normalizedAda}&parsel=${normalizedParsel}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), MURATPASA_TIMEOUT_MS);

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check if data was parsed by serverless function
    if (data.imarDurumu) {
      const imarData: ImarDurumu = {
        ...data.imarDurumu,
        fetchedAt: new Date(data.imarDurumu.fetchedAt),
      };

      // Cache the result
      cache.set(cacheKey, {
        data: imarData,
        timestamp: Date.now(),
      });

      return {
        success: true,
        data: imarData,
        source: 'auto',
        timestamp: new Date(),
        warnings: data.warnings,
      };
    } else {
      throw new Error('Muratpaşa KBS sistemi henüz desteklenmiyor');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Muratpaşa/Antalya belediyesi sistemine bağlanılamadı';

    return {
      success: false,
      error: errorMessage,
      source: 'auto',
      timestamp: new Date(),
    };
  }
}

/**
 * Clear Muratpaşa cache
 */
export function clearMuratpasaCache(): void {
  cache.clear();
}

/**
 * Get Muratpaşa cache statistics
 */
export function getMuratpasaCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    age: Math.floor((Date.now() - entry.timestamp) / 1000 / 60),
  }));

  return {
    size: cache.size,
    entries,
  };
}

/**
 * Check if Muratpaşa KBS system is accessible
 */
export async function checkMuratpasaAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/municipalities/muratpasa/health', {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * TODO: Implement KBS-specific parser
 *
 * After manually testing https://kbs.antalya.bel.tr/imardurumu/:
 * 1. Identify request method (GET/POST)
 * 2. Find required parameters
 * 3. Document HTML structure
 * 4. Create parseKBSResponse() function similar to parseKEOSResponse()
 * 5. Update fetchMuratpasaImar() to use the parser
 */
