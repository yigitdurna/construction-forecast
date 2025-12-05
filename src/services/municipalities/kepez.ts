/**
 * Kepez Municipality İmar Durumu Service
 *
 * Fetches zoning information from Kepez Municipality KEOS system
 * URL: https://keos.kepez-bld.gov.tr/imardurumu/
 *
 * Kepez is the largest district in Antalya (629K population)
 * Uses KEOS (Kent Bilgi Sistemi) - shared with Konyaaltı
 *
 * ⚠️ IMPORTANT: This service requires manual testing to confirm:
 * 1. The actual API endpoint or form submission method
 * 2. Required parameters (Mahalle dropdown? Direct Ada/Parsel input?)
 * 3. HTML structure of the response
 * 4. CORS handling (will likely need serverless proxy)
 */

import type {
  ImarDurumu,
  ImarDurumuResponse,
  MunicipalitySelectors,
} from '../../types/zoning';
import {
  parseKEOSResponse,
  parsedDataToImarDurumu,
  validateKEOSResponse,
  generateDebugInfo,
} from './keosParser';

/**
 * Timeout for Kepez requests (milliseconds)
 */
const KEPEZ_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Cache duration for Kepez responses (milliseconds)
 */
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Simple in-memory cache for Kepez responses
 */
interface CacheEntry {
  data: ImarDurumu;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();

/**
 * Kepez-specific HTML selectors
 *
 * Note: KEOS parser now uses label-based extraction, so these are unused.
 * Kept for potential future customization.
 */
const KEPEZ_SELECTORS: Partial<MunicipalitySelectors> = {};

/**
 * Validate Kepez-specific input
 *
 * @param mahalle - Mahalle (neighborhood) name
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns Validation result with error if invalid
 */
function validateKepezInput(
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
 * Fetch İmar Durumu from Kepez Municipality via serverless proxy
 *
 * This function:
 * 1. Validates input
 * 2. Checks cache
 * 3. Calls serverless proxy (to avoid CORS)
 * 4. Parses HTML response
 * 5. Returns structured data
 *
 * @param mahalle - Mahalle (neighborhood) name
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns İmar Durumu response with data or error
 */
export async function fetchKepezImar(
  mahalle: string,
  ada: string,
  parsel: string
): Promise<ImarDurumuResponse> {
  // Validate input
  const validation = validateKepezInput(mahalle, ada, parsel);
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
  const cacheKey = `kepez-${normalizedMahalle}-${normalizedAda}-${normalizedParsel}`;
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
    const proxyUrl = `/api/municipalities/kepez?mahalle=${encodeURIComponent(
      normalizedMahalle
    )}&ada=${normalizedAda}&parsel=${normalizedParsel}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KEPEZ_TIMEOUT_MS);

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

    // Response should contain either parsed data or raw HTML
    if (data.imarDurumu) {
      // Already parsed by serverless function
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
    } else if (data.html) {
      // Raw HTML - parse on client side
      return parseKepezHTML(data.html, normalizedMahalle, normalizedAda, normalizedParsel);
    } else {
      throw new Error('Geçersiz proxy yanıtı');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Kepez belediyesi sistemine bağlanılamadı';

    return {
      success: false,
      error: errorMessage,
      source: 'auto',
      timestamp: new Date(),
    };
  }
}

/**
 * Parse Kepez HTML response
 *
 * @param html - HTML response from Kepez KEOS
 * @param mahalle - Mahalle name (for debugging)
 * @param ada - Ada number (for debugging)
 * @param parsel - Parsel number (for debugging)
 * @returns İmar Durumu response
 */
function parseKepezHTML(
  html: string,
  mahalle: string,
  ada: string,
  parsel: string
): ImarDurumuResponse {
  // Validate response
  const validation = validateKEOSResponse(html);
  if (!validation.valid) {
    return {
      success: false,
      error: validation.error ?? 'Geçersiz KEOS yanıtı',
      source: 'auto',
      timestamp: new Date(),
    };
  }

  // Parse HTML
  const parsed = parseKEOSResponse(html, 'kepez', KEPEZ_SELECTORS);

  // Check for parse errors
  if (parsed.parseErrors.length > 0) {
    console.warn('Kepez parse warnings:', parsed.parseErrors);

    // If critical errors, fail
    if (
      parsed.parseErrors.some(
        (err) => err.includes('bulunamadı') || err.includes('ayrıştırılamadı')
      )
    ) {
      return {
        success: false,
        error: 'İmar bilgileri ayrıştırılamadı',
        source: 'auto',
        timestamp: new Date(),
        warnings: parsed.parseErrors,
      };
    }
  }

  // Convert to ImarDurumu
  const imarData = parsedDataToImarDurumu(
    parsed,
    'kepez',
    parsed.parseErrors.length === 0 ? 'high' : 'medium'
  );

  if (!imarData) {
    // Generate debug info
    const debugInfo = generateDebugInfo(html, parsed);
    console.error('Kepez parse failed:', debugInfo);

    return {
      success: false,
      error: 'Kritik imar bilgileri eksik (TAKS, KAKS veya İmar Durumu)',
      source: 'auto',
      timestamp: new Date(),
      warnings: parsed.parseErrors,
    };
  }

  // Cache successful result
  const cacheKey = `kepez-${mahalle}-${ada}-${parsel}`;
  cache.set(cacheKey, {
    data: imarData,
    timestamp: Date.now(),
  });

  return {
    success: true,
    data: imarData,
    source: 'auto',
    timestamp: new Date(),
    warnings: parsed.parseErrors.length > 0 ? parsed.parseErrors : undefined,
  };
}

/**
 * Clear Kepez cache
 *
 * Useful for testing or forcing fresh data fetch
 */
export function clearKepezCache(): void {
  cache.clear();
}

/**
 * Get Kepez cache statistics
 *
 * @returns Cache size and entries
 */
export function getKepezCacheStats(): {
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
 * Check if Kepez KEOS system is accessible
 *
 * Simple health check
 *
 * @returns True if Kepez system is reachable
 */
export async function checkKepezAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/municipalities/kepez/health', {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
