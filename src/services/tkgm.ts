/**
 * TKGM (Tapu ve Kadastro Genel Müdürlüğü) API Service
 *
 * Fetches land parcel information from Turkish Land Registry API
 *
 * ⚠️ IMPORTANT: This service is awaiting API endpoint testing
 * The actual endpoint format needs to be confirmed by manual testing:
 *
 * Test with:
 * ```bash
 * curl -v "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api/parsel/6960/4"
 * # OR
 * curl -v "https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api/parsel?ada=6960&parsel=4&ilce=Muratpaşa"
 * ```
 *
 * Once confirmed, update the `buildTKGMEndpoint` function with the correct format.
 */

import type {
  ParcelData,
  TKGMResponse,
  TKGMParcelResponse,
  AdaParselValidation,
} from '../types/zoning';

/**
 * TKGM API base URL
 * v3 API as mentioned in Phase 2.1 documentation
 */
const TKGM_API_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api';

/**
 * Timeout for TKGM API requests (milliseconds)
 */
const TKGM_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Cache duration for TKGM responses (milliseconds)
 * Land parcel data doesn't change frequently, so we can cache aggressively
 */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple in-memory cache for TKGM responses
 * In production, this could be replaced with localStorage or a more sophisticated cache
 */
interface CacheEntry {
  data: TKGMParcelResponse;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Validate Ada and Parsel input format
 *
 * Ada and Parsel should be numeric strings (digits only)
 *
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns Validation result with error message if invalid
 */
export function validateAdaParsel(ada: string, parsel: string): AdaParselValidation {
  const warnings: string[] = [];

  // Ada validation
  if (!ada || ada.trim() === '') {
    return {
      valid: false,
      error: 'Ada numarası boş olamaz',
    };
  }

  if (!/^\d+$/.test(ada.trim())) {
    return {
      valid: false,
      error: 'Ada numarası sadece rakamlardan oluşmalıdır',
    };
  }

  if (ada.length > 6) {
    return {
      valid: false,
      error: 'Ada numarası çok uzun (maksimum 6 hane)',
    };
  }

  // Parsel validation
  if (!parsel || parsel.trim() === '') {
    return {
      valid: false,
      error: 'Parsel numarası boş olamaz',
    };
  }

  if (!/^\d+$/.test(parsel.trim())) {
    return {
      valid: false,
      error: 'Parsel numarası sadece rakamlardan oluşmalıdır',
    };
  }

  if (parsel.length > 6) {
    return {
      valid: false,
      error: 'Parsel numarası çok uzun (maksimum 6 hane)',
    };
  }

  // Warnings for unusual values
  if (parseInt(ada, 10) > 99999) {
    warnings.push('Ada numarası olağandışı derecede yüksek');
  }

  if (parseInt(parsel, 10) > 9999) {
    warnings.push('Parsel numarası olağandışı derecede yüksek');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Build alternative TKGM endpoint formats to try if primary fails
 *
 * @param ada - Ada number
 * @param parsel - Parsel number
 * @param ilce - İlçe name (optional)
 * @returns Array of alternative endpoints to try
 */
function buildAlternativeEndpoints(
  ada: string,
  parsel: string,
  ilce?: string
): string[] {
  const endpoints: string[] = [];

  // Format 1: Path-based /ada/parsel
  endpoints.push(`${TKGM_API_BASE}/parsel/${ada}/${parsel}`);

  // Format 2: Query parameters
  let queryEndpoint = `${TKGM_API_BASE}/parsel?ada=${ada}&parsel=${parsel}`;
  if (ilce) {
    queryEndpoint += `&ilce=${encodeURIComponent(ilce)}`;
  }
  endpoints.push(queryEndpoint);

  // Format 3: With Antalya province code (07)
  if (ilce) {
    endpoints.push(`${TKGM_API_BASE}/parsel/07/${ilce}/${ada}/${parsel}`);
  }

  return endpoints;
}

/**
 * Transform TKGM API response to our ParcelData interface
 *
 * @param response - Raw TKGM API response
 * @param ada - Ada number (fallback if not in response)
 * @param parsel - Parsel number (fallback if not in response)
 * @param ilce - İlçe name (fallback if not in response)
 * @returns Normalized parcel data
 */
function transformTKGMResponse(
  response: TKGMParcelResponse,
  ada: string,
  parsel: string,
  ilce?: string
): ParcelData {
  return {
    ada: response.ADA ?? ada,
    parsel: response.PARSEL ?? parsel,
    ilce: response.ILCE ?? ilce ?? '',
    mahalle: response.MAHALLE ?? '',
    alan: response.ALAN ?? 0,
    imar: response.IMAR_DURUMU
      ? {
          emsal: response.IMAR_DURUMU.EMSAL ?? response.IMAR_DURUMU.KAKS,
          taks: response.IMAR_DURUMU.TAKS,
          cikmaKatsayisi: response.IMAR_DURUMU.CIKMA_KATSAYISI,
          maxKatSayisi: response.IMAR_DURUMU.MAX_KAT_SAYISI,
          maxYukseklik: response.IMAR_DURUMU.MAX_YUKSEKLIK,
          imarTipi: response.IMAR_DURUMU.IMAR_TIPI,
        }
      : undefined,
    source: 'tkgm',
    lastUpdated: new Date(),
  };
}

/**
 * Fetch parcel data from TKGM API with timeout
 *
 * @param url - API endpoint URL
 * @param timeoutMs - Timeout in milliseconds
 * @returns Promise with fetch response
 */
async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Fetch parcel data from TKGM API
 *
 * This function:
 * 1. Validates Ada/Parsel input
 * 2. Checks cache for recent data
 * 3. Tries multiple endpoint formats if primary fails
 * 4. Handles errors gracefully with Turkish error messages
 * 5. Caches successful responses
 *
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @param ilce - İlçe (district) name (optional, helps with lookup)
 * @returns TKGM response with parcel data or error
 */
export async function fetchParcelData(
  ada: string,
  parsel: string,
  ilce?: string
): Promise<TKGMResponse> {
  // Validate input
  const validation = validateAdaParsel(ada, parsel);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error ?? 'Geçersiz ada/parsel numarası',
      source: 'fallback',
      timestamp: new Date(),
    };
  }

  // Normalize inputs (trim whitespace)
  const normalizedAda = ada.trim();
  const normalizedParsel = parsel.trim();

  // Check cache
  const cacheKey = `${normalizedAda}-${normalizedParsel}-${ilce ?? ''}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
    const parcelData = transformTKGMResponse(
      cached.data,
      normalizedAda,
      normalizedParsel,
      ilce
    );

    return {
      success: true,
      data: parcelData,
      source: 'cached',
      timestamp: new Date(cached.timestamp),
    };
  }

  // Try fetching from TKGM API with multiple endpoint formats
  const endpoints = buildAlternativeEndpoints(normalizedAda, normalizedParsel, ilce);

  let lastError: Error | null = null;
  let response: Response | null = null;

  for (const endpoint of endpoints) {
    try {
      response = await fetchWithTimeout(endpoint, TKGM_TIMEOUT_MS);

      if (response.ok) {
        // Success! Break out of loop
        break;
      }

      // Not OK, but no exception - try next endpoint
      lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      response = null;
    } catch (error) {
      // Network error or timeout - try next endpoint
      lastError = error instanceof Error ? error : new Error('Bilinmeyen ağ hatası');
      response = null;
    }
  }

  // If all endpoints failed
  if (!response || !response.ok) {
    const errorMessage =
      lastError?.message.includes('aborted') || lastError?.message.includes('timeout')
        ? 'TKGM API zaman aşımı (10 saniye)'
        : lastError?.message.includes('NetworkError') ||
          lastError?.message.includes('Failed to fetch')
        ? 'TKGM API\'ye bağlanılamadı (ağ hatası)'
        : lastError?.message ?? 'TKGM API isteği başarısız oldu';

    return {
      success: false,
      error: errorMessage,
      source: 'fallback',
      timestamp: new Date(),
    };
  }

  // Parse response
  try {
    const rawData: TKGMParcelResponse = await response.json();

    // Validate response has required fields
    if (!rawData.ALAN && !rawData.YUZOLCUMU) {
      return {
        success: false,
        error: 'TKGM yanıtında arsa alanı bilgisi bulunamadı',
        source: 'fallback',
        timestamp: new Date(),
      };
    }

    // Transform to our format
    const parcelData = transformTKGMResponse(
      rawData,
      normalizedAda,
      normalizedParsel,
      ilce
    );

    // Cache the raw response
    cache.set(cacheKey, {
      data: rawData,
      timestamp: Date.now(),
    });

    return {
      success: true,
      data: parcelData,
      source: 'tkgm',
      timestamp: new Date(),
    };
  } catch (error) {
    return {
      success: false,
      error: 'TKGM yanıtı işlenemedi (geçersiz JSON)',
      source: 'fallback',
      timestamp: new Date(),
    };
  }
}

/**
 * Clear TKGM cache
 *
 * Useful for testing or forcing fresh data fetch
 */
export function clearTKGMCache(): void {
  cache.clear();
}

/**
 * Get cache statistics
 *
 * @returns Cache size and entries
 */
export function getCacheStats(): {
  size: number;
  entries: Array<{ key: string; age: number }>;
} {
  const entries = Array.from(cache.entries()).map(([key, entry]) => ({
    key,
    age: Math.floor((Date.now() - entry.timestamp) / 1000 / 60), // age in minutes
  }));

  return {
    size: cache.size,
    entries,
  };
}

/**
 * Check if TKGM API is accessible
 *
 * Simple health check that tries to fetch a known parcel
 * Can be used to test connectivity before showing Ada/Parsel input to user
 *
 * @returns True if TKGM API is accessible
 */
export async function checkTKGMAvailability(): Promise<boolean> {
  // Try with a known test parcel (if we have one)
  // For now, just try to reach the API endpoint
  try {
    const testEndpoint = `${TKGM_API_BASE}/parsel/1/1`;
    const response = await fetchWithTimeout(testEndpoint, 5000);

    // Even 404 is OK - it means the API is reachable
    return response.status === 200 || response.status === 404;
  } catch {
    return false;
  }
}

/**
 * Manual parcel data entry (fallback when TKGM API is unavailable)
 *
 * @param ada - Ada number
 * @param parsel - Parsel number
 * @param ilce - İlçe name
 * @param mahalle - Mahalle name
 * @param alan - Land area in m²
 * @param imar - Optional zoning information
 * @returns ParcelData object
 */
export function createManualParcelData(
  ada: string,
  parsel: string,
  ilce: string,
  mahalle: string,
  alan: number,
  imar?: {
    emsal?: number;
    taks?: number;
    cikmaKatsayisi?: number;
    maxKatSayisi?: number;
    maxYukseklik?: number;
  }
): ParcelData {
  return {
    ada,
    parsel,
    ilce,
    mahalle,
    alan,
    imar: imar
      ? {
          emsal: imar.emsal,
          taks: imar.taks,
          cikmaKatsayisi: imar.cikmaKatsayisi,
          maxKatSayisi: imar.maxKatSayisi,
          maxYukseklik: imar.maxYukseklik,
        }
      : undefined,
    source: 'manual',
    lastUpdated: new Date(),
  };
}
