/**
 * TKGM API Serverless Proxy
 *
 * Vercel serverless function to proxy requests to TKGM API
 * Solves CORS issues by making server-side requests
 *
 * Deploy to Vercel: This file will automatically be deployed as a serverless function
 * Endpoint: https://your-domain.com/api/tkgm-proxy
 *
 * Usage:
 * GET /api/tkgm-proxy?ada=6960&parsel=4&ilce=Muratpaşa
 *
 * ⚠️ This file is only needed if the TKGM API has CORS restrictions
 * Test direct browser access first before deploying this proxy
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * TKGM API base URL
 */
const TKGM_API_BASE = 'https://cbsapi.tkgm.gov.tr/megsiswebapi.v3/api';

/**
 * Request timeout (milliseconds)
 */
const TIMEOUT_MS = 10000;

/**
 * Simple in-memory cache
 * Note: Vercel serverless functions are stateless, so this cache
 * only persists within a single function instance
 *
 * For production, consider using Vercel KV or Redis
 */
interface CacheEntry {
  data: any;
  timestamp: number;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Fetch with timeout helper
 */
async function fetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; ConstructionForecast/2.0)',
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
 * Build TKGM endpoint URLs
 * Try multiple formats since the exact format is TBD
 */
function buildEndpoints(ada: string, parsel: string, ilce?: string): string[] {
  const endpoints: string[] = [];

  // Format 1: /api/parsel/{ada}/{parsel}
  endpoints.push(`${TKGM_API_BASE}/parsel/${ada}/${parsel}`);

  // Format 2: Query parameters
  let queryEndpoint = `${TKGM_API_BASE}/parsel?ada=${ada}&parsel=${parsel}`;
  if (ilce) {
    queryEndpoint += `&ilce=${encodeURIComponent(ilce)}`;
  }
  endpoints.push(queryEndpoint);

  // Format 3: Full path with province
  if (ilce) {
    endpoints.push(`${TKGM_API_BASE}/parsel/07/${ilce}/${ada}/${parsel}`);
  }

  return endpoints;
}

/**
 * TKGM API Proxy Handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({
      error: 'Method not allowed',
      message: 'Only GET requests are supported',
    });
  }

  // Extract query parameters
  const { ada, parsel, ilce } = req.query;

  // Validate required parameters
  if (!ada || !parsel) {
    return res.status(400).json({
      error: 'Eksik parametreler',
      message: 'Ada ve Parsel numarası gereklidir',
      example: '/api/tkgm-proxy?ada=6960&parsel=4&ilce=Muratpaşa',
    });
  }

  // Ensure parameters are strings
  const adaStr = Array.isArray(ada) ? ada[0] : ada;
  const parselStr = Array.isArray(parsel) ? parsel[0] : parsel;
  const ilceStr = ilce ? (Array.isArray(ilce) ? ilce[0] : ilce) : undefined;

  // Validate format (should be numeric)
  if (!/^\d+$/.test(adaStr)) {
    return res.status(400).json({
      error: 'Geçersiz ada numarası',
      message: 'Ada numarası sadece rakamlardan oluşmalıdır',
    });
  }

  if (!/^\d+$/.test(parselStr)) {
    return res.status(400).json({
      error: 'Geçersiz parsel numarası',
      message: 'Parsel numarası sadece rakamlardan oluşmalıdır',
    });
  }

  // Check cache first
  const cacheKey = `${adaStr}-${parselStr}-${ilceStr ?? ''}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.status(200).json({
      ...cached.data,
      _cached: true,
      _timestamp: new Date(cached.timestamp).toISOString(),
    });
  }

  // Try fetching from TKGM API with multiple endpoint formats
  const endpoints = buildEndpoints(adaStr, parselStr, ilceStr);

  let response: Response | null = null;
  let lastError: Error | null = null;
  let successfulEndpoint: string | null = null;

  for (const endpoint of endpoints) {
    try {
      response = await fetchWithTimeout(endpoint, TIMEOUT_MS);

      if (response.ok) {
        successfulEndpoint = endpoint;
        break;
      }

      // Not OK but no exception - record error and try next
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
    const errorMessage = lastError?.message ?? 'Tüm TKGM endpoint\'leri başarısız oldu';
    const statusCode =
      lastError?.message.includes('timeout') || lastError?.message.includes('aborted')
        ? 504 // Gateway Timeout
        : lastError?.message.includes('NetworkError')
        ? 503 // Service Unavailable
        : 500; // Internal Server Error

    return res.status(statusCode).json({
      error: 'TKGM API isteği başarısız',
      message: errorMessage,
      triedEndpoints: endpoints,
      help:
        'TKGM API\'si şu anda erişilebilir değil olabilir. Lütfen manuel veri girişi kullanın.',
    });
  }

  // Parse response
  try {
    const data = await response.json();

    // Validate response has some data
    if (!data || typeof data !== 'object') {
      return res.status(502).json({
        error: 'Geçersiz TKGM yanıtı',
        message: 'TKGM API geçerli JSON döndürmedi',
      });
    }

    // Cache successful response
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Return response with metadata
    return res.status(200).json({
      ...data,
      _cached: false,
      _timestamp: new Date().toISOString(),
      _endpoint: successfulEndpoint,
    });
  } catch (error) {
    return res.status(502).json({
      error: 'TKGM yanıtı işlenemedi',
      message: error instanceof Error ? error.message : 'JSON ayrıştırma hatası',
    });
  }
}
