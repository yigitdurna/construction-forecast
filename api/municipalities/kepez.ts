/**
 * Kepez Municipality Serverless Proxy
 *
 * Vercel serverless function to fetch İmar Durumu from Kepez KEOS system
 * Endpoint: /api/municipalities/kepez
 *
 * Usage:
 * GET /api/municipalities/kepez?mahalle=Gündoğdu&ada=1234&parsel=5
 *
 * This proxy:
 * 1. Handles CORS (municipality websites likely don't allow browser requests)
 * 2. Makes request to Kepez KEOS system
 * 3. Parses HTML response
 * 4. Returns structured JSON
 *
 * ⚠️ IMPORTANT: HTML selectors and request method need to be confirmed
 * by manually testing https://keos.kepez-bld.gov.tr/imardurumu/
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Kepez KEOS URL
 */
const KEPEZ_KEOS_URL = 'https://keos.kepez-bld.gov.tr/imardurumu/';

/**
 * Request timeout
 */
const TIMEOUT_MS = 15000;

/**
 * Simple cache (persists within function instance)
 */
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, options: RequestInit, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
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
 * Main handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Health check endpoint
  if (req.url?.includes('/health')) {
    return res.status(200).json({ status: 'ok', service: 'kepez' });
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract query parameters
  const { mahalle, ada, parsel } = req.query;

  // Validate parameters
  if (!mahalle || !ada || !parsel) {
    return res.status(400).json({
      error: 'Eksik parametreler',
      message: 'Mahalle, Ada ve Parsel numarası gereklidir',
      example: '/api/municipalities/kepez?mahalle=Gündoğdu&ada=1234&parsel=5',
    });
  }

  const mahalleStr = Array.isArray(mahalle) ? mahalle[0] : mahalle;
  const adaStr = Array.isArray(ada) ? ada[0] : ada;
  const parselStr = Array.isArray(parsel) ? parsel[0] : parsel;

  // Check cache
  const cacheKey = `${mahalleStr}-${adaStr}-${parselStr}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      ...cached.data,
      _cached: true,
      _timestamp: new Date(cached.timestamp).toISOString(),
    });
  }

  try {
    // KEOS Kepez uses a 2-step API flow (verified December 5, 2025):
    // Step 1: Search for parselid using ada/parsel
    // Step 2: Fetch İmar data using parselid

    // STEP 1: Search for parselid
    // Format: imarsvc.aspx?type=adaparsel&adaparsel={ada}/{parsel}&ilce=-100000&tmahalle=-100000
    const searchUrl = `${KEPEZ_KEOS_URL}imarsvc.aspx?type=adaparsel&adaparsel=${adaStr}/${parselStr}&ilce=-100000&tmahalle=-100000`;

    const searchResponse = await fetchWithTimeout(
      searchUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'User-Agent':
            'Mozilla/5.0 (compatible; ConstructionForecast/2.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      },
      TIMEOUT_MS
    );

    if (!searchResponse.ok) {
      throw new Error(`Kepez search API HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
    }

    const searchHtml = await searchResponse.text();

    // Extract parselid from response
    // The API may return parselid in various formats - try multiple patterns
    let parselId: string | null = null;

    // Pattern 1: Hidden input field
    const inputMatch = searchHtml.match(
      /<input[^>]*(?:name|id)="parselid"[^>]*value="(\d+)"[^>]*>/i
    );
    if (inputMatch && inputMatch[1]) {
      parselId = inputMatch[1];
    }

    // Pattern 2: JSON response
    if (!parselId) {
      try {
        const jsonData = JSON.parse(searchHtml);
        if (jsonData.parselid || jsonData.parselId || jsonData.PARSELID) {
          parselId = String(jsonData.parselid || jsonData.parselId || jsonData.PARSELID);
        }
      } catch {
        // Not JSON, continue
      }
    }

    // Pattern 3: Direct number in response (if simple text response)
    if (!parselId && /^\d+$/.test(searchHtml.trim())) {
      parselId = searchHtml.trim();
    }

    if (!parselId) {
      throw new Error('Parsel ID bulunamadı. Ada/Parsel numarası hatalı olabilir.');
    }

    // STEP 2: Fetch İmar data using parselid
    // Format: imar.aspx?parselid={parselid}
    const imarUrl = `${KEPEZ_KEOS_URL}imar.aspx?parselid=${parselId}`;

    const imarResponse = await fetchWithTimeout(
      imarUrl,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'User-Agent':
            'Mozilla/5.0 (compatible; ConstructionForecast/2.0)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: searchUrl, // Important: include referer from step 1
        },
      },
      TIMEOUT_MS
    );

    if (!imarResponse.ok) {
      throw new Error(`Kepez İmar API HTTP ${imarResponse.status}: ${imarResponse.statusText}`);
    }

    // Get İmar data HTML
    const html = await imarResponse.text();

    // Return raw HTML for client-side parsing using keosParser
    const result = {
      html,
      parselId,
      _cached: false,
      _timestamp: new Date().toISOString(),
      _note: 'HTML from 2-step KEOS API flow - parse client-side',
    };

    // Cache the result
    cache.set(cacheKey, { data: result, timestamp: Date.now() });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Kepez fetch error:', error);

    return res.status(500).json({
      error: 'Kepez KEOS isteği başarısız',
      message: error instanceof Error ? error.message : 'Bilinmeyen hata',
      help: 'Kepez KEOS sistemi erişilebilir değil olabilir. Manuel giriş kullanın.',
    });
  }
}
