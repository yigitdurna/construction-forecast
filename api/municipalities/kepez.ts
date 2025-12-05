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

  console.log('[Kepez] Input parameters:', { mahalle: mahalleStr, ada: adaStr, parsel: parselStr });

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
    // Format: imarsvc.aspx?type=adaparsel&adaparsel={ada}/{parsel}&ilce=-100000&tmahalle=-100000&tamKelimeAra=true
    const searchUrl = `${KEPEZ_KEOS_URL}imarsvc.aspx?type=adaparsel&adaparsel=${adaStr}/${parselStr}&ilce=-100000&tmahalle=-100000&tamKelimeAra=true`;

    console.log('[Kepez] ===== STEP 1: SEARCH FOR PARSELID =====');
    console.log('[Kepez] Base URL:', KEPEZ_KEOS_URL);
    console.log('[Kepez] Ada/Parsel format:', `${adaStr}/${parselStr}`);
    console.log('[Kepez] FINAL SEARCH URL:', searchUrl);
    console.log('[Kepez] About to fetch...');

    const searchResponse = await fetchWithTimeout(
      searchUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/html, */*',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://keos.kepez-bld.gov.tr/imardurumu/',
          'Origin': 'https://keos.kepez-bld.gov.tr',
        },
      },
      TIMEOUT_MS
    );

    console.log('[Kepez] Search response status:', searchResponse.status);
    console.log('[Kepez] Search response headers:', Object.fromEntries(searchResponse.headers.entries()));

    if (!searchResponse.ok) {
      const errorBody = await searchResponse.text();
      console.error('[Kepez] Search error body:', errorBody.substring(0, 500));
      throw new Error(`Kepez search API HTTP ${searchResponse.status}: ${searchResponse.statusText}`);
    }

    const searchText = await searchResponse.text();
    console.log('[Kepez] Search response length:', searchText.length);
    console.log('[Kepez] Search response preview:', searchText.substring(0, 500));

    // Extract parselid from JSON response
    // Expected format: [{"ADAPARSEL":"25044/1","TAPU_MAH_ADI":"AHATLI","ADA":"25044","PARSEL":"1","PARSELID":30681}]
    let parselId: string | null = null;

    try {
      // Parse JSON array response
      const jsonData = JSON.parse(searchText);
      console.log('[Kepez] Parsed JSON data:', JSON.stringify(jsonData));

      // Check if response is an array
      if (!Array.isArray(jsonData)) {
        throw new Error('Yanıt bir dizi değil');
      }

      // Check if array is empty (no results found)
      if (jsonData.length === 0) {
        throw new Error('Ada/Parsel numarası için kayıt bulunamadı. Numara hatalı olabilir.');
      }

      // Extract PARSELID from first element
      const firstResult = jsonData[0];
      if (!firstResult.PARSELID) {
        console.error('[Kepez] JSON response missing PARSELID:', firstResult);
        throw new Error('Yanıtta PARSELID bulunamadı');
      }

      parselId = String(firstResult.PARSELID);
      console.log('[Kepez] Successfully extracted PARSELID:', parselId);
      console.log('[Kepez] Full result:', firstResult);
    } catch (error) {
      console.error('[Kepez] Failed to parse JSON response:', error);
      console.error('[Kepez] Full response text:', searchText);

      if (error instanceof Error) {
        throw new Error(`Kepez search yanıtı işlenemedi: ${error.message}`);
      }
      throw new Error('Kepez search yanıtı JSON formatında değil');
    }

    if (!parselId) {
      throw new Error('Parsel ID çıkarılamadı. Ada/Parsel numarası hatalı olabilir.');
    }

    // STEP 2: Fetch İmar data using parselid
    // Format: imar.aspx?parselid={parselid}
    const imarUrl = `${KEPEZ_KEOS_URL}imar.aspx?parselid=${parselId}`;

    console.log('[Kepez] ===== STEP 2: FETCH İMAR DATA =====');
    console.log('[Kepez] Extracted parselId:', parselId);
    console.log('[Kepez] FINAL İMAR URL:', imarUrl);
    console.log('[Kepez] About to fetch...');

    const imarResponse = await fetchWithTimeout(
      imarUrl,
      {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en-US;q=0.8,en;q=0.7',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://keos.kepez-bld.gov.tr/imardurumu/',
          'Origin': 'https://keos.kepez-bld.gov.tr',
        },
      },
      TIMEOUT_MS
    );

    console.log('[Kepez] İmar response status:', imarResponse.status);
    console.log('[Kepez] İmar response headers:', Object.fromEntries(imarResponse.headers.entries()));

    if (!imarResponse.ok) {
      const errorBody = await imarResponse.text();
      console.error('[Kepez] İmar error body:', errorBody.substring(0, 500));
      throw new Error(`Kepez İmar API HTTP ${imarResponse.status}: ${imarResponse.statusText}`);
    }

    // Get İmar data HTML
    const html = await imarResponse.text();
    console.log('[Kepez] İmar HTML length:', html.length);
    console.log('[Kepez] İmar HTML preview:', html.substring(0, 500));

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
