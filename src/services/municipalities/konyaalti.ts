/**
 * Konyaaltı Municipality İmar Durumu Service
 *
 * Fetches zoning information from Konyaaltı Municipality KEOS system
 * URL: https://harita.konyaalti.bel.tr/imardurumu/
 *
 * Konyaaltı is the third-largest district in Antalya (196K population)
 * Uses KEOS (Kent Bilgi Sistemi) - same as Kepez
 *
 * ⚠️ IMPORTANT: Although Konyaaltı uses KEOS like Kepez, there may be differences:
 * 1. Different subdomain (harita.konyaalti vs keos.kepez)
 * 2. Potentially different form fields or HTML structure
 * 3. May require mahalle dropdown vs direct input
 *
 * Test manually before deploying!
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
 * Timeout for Konyaaltı requests (milliseconds)
 */
const KONYAALTI_TIMEOUT_MS = 15000; // 15 seconds

/**
 * Cache duration (milliseconds)
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
 * Konyaaltı-specific HTML selectors
 * TODO: Update these after manually testing Konyaaltı KEOS
 *
 * May be identical to Kepez, or may have slight differences
 */
const KONYAALTI_SELECTORS: Partial<MunicipalitySelectors> = {
  // Update these after manual inspection
  taksSelector: 'span.taks-value, td.taks, [data-field="taks"]',
  kaksSelector: 'span.kaks-value, td.kaks, [data-field="kaks"]',
  emsalSelector: 'span.emsal-value, td.emsal, [data-field="emsal"]',
  imarDurumuSelector: 'span.imar-durumu-value, td.imar-durumu',
  planNotuSelector: 'textarea.plan-notu, div.plan-notu',
};

/**
 * Validate input for Konyaaltı
 */
function validateKonyaaltiInput(
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
 * Fetch İmar Durumu from Konyaaltı Municipality
 *
 * @param mahalle - Mahalle (neighborhood) name
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns İmar Durumu response with data or error
 */
export async function fetchKonyaaltiImar(
  mahalle: string,
  ada: string,
  parsel: string
): Promise<ImarDurumuResponse> {
  // Validate input
  const validation = validateKonyaaltiInput(mahalle, ada, parsel);
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
  const cacheKey = `konyaalti-${normalizedMahalle}-${normalizedAda}-${normalizedParsel}`;
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
    const proxyUrl = `/api/municipalities/konyaalti?mahalle=${encodeURIComponent(
      normalizedMahalle
    )}&ada=${normalizedAda}&parsel=${normalizedParsel}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), KONYAALTI_TIMEOUT_MS);

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
      return parseKonyaaltiHTML(
        data.html,
        normalizedMahalle,
        normalizedAda,
        normalizedParsel
      );
    } else {
      throw new Error('Geçersiz proxy yanıtı');
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Konyaaltı belediyesi sistemine bağlanılamadı';

    return {
      success: false,
      error: errorMessage,
      source: 'auto',
      timestamp: new Date(),
    };
  }
}

/**
 * Parse Konyaaltı HTML response
 */
function parseKonyaaltiHTML(
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

  // Parse HTML using KEOS parser
  const parsed = parseKEOSResponse(html, 'konyaalti', KONYAALTI_SELECTORS);

  // Check for parse errors
  if (parsed.parseErrors.length > 0) {
    console.warn('Konyaaltı parse warnings:', parsed.parseErrors);

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
    'konyaalti',
    parsed.parseErrors.length === 0 ? 'high' : 'medium'
  );

  if (!imarData) {
    const debugInfo = generateDebugInfo(html, parsed);
    console.error('Konyaaltı parse failed:', debugInfo);

    return {
      success: false,
      error: 'Kritik imar bilgileri eksik (TAKS, KAKS veya İmar Durumu)',
      source: 'auto',
      timestamp: new Date(),
      warnings: parsed.parseErrors,
    };
  }

  // Cache successful result
  const cacheKey = `konyaalti-${mahalle}-${ada}-${parsel}`;
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
 * Clear Konyaaltı cache
 */
export function clearKonyaaltiCache(): void {
  cache.clear();
}

/**
 * Get Konyaaltı cache statistics
 */
export function getKonyaaltiCacheStats(): {
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
 * Check if Konyaaltı KEOS system is accessible
 */
export async function checkKonyaaltiAvailability(): Promise<boolean> {
  try {
    const response = await fetch('/api/municipalities/konyaalti/health', {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
