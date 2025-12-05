/**
 * KEOS System Parser
 *
 * Shared parsing logic for municipalities using the KEOS (Kent Bilgi Sistemi) system:
 * - Kepez: https://keos.kepez-bld.gov.tr/imardurumu/
 * - Konyaaltı: https://harita.konyaalti.bel.tr/imardurumu/
 *
 * KEOS is a common municipal information system used by several Turkish municipalities.
 * This parser provides shared logic for extracting İmar Durumu data from KEOS HTML responses.
 *
 * ⚠️ IMPORTANT: HTML selectors need to be verified by manually testing the websites
 * Use browser DevTools to inspect the actual HTML structure and update selectors accordingly.
 */

import type {
  ImarDurumu,
  ParsedImarData,
  MunicipalitySelectors,
  MunicipalityDistrict,
} from '../../types/zoning';

/**
 * KEOS selectors - VERIFIED from Kepez system inspection (December 2025)
 *
 * Structure: Div-based table with labels and content cells
 * Container: #bodycontainer or .zoning-body
 * Rows: .divTableRow
 * Labels: .divTableCellLabel or .divTableCellLabel.table-subtitle
 * Values: .divTableContent
 */
const DEFAULT_KEOS_SELECTORS: MunicipalitySelectors = {
  // Result selectors (verified working)
  taksSelector: '.divTableContent', // Will extract by label matching
  kaksSelector: '.divTableContent',
  emsalSelector: '.divTableContent',
  cikmaSelector: '.divTableContent',
  maxYukseklikSelector: '.divTableContent',
  maxKatAdediSelector: '.divTableContent',
  imarDurumuSelector: '.divTableContent',
  planNotuSelector: '.divTableContent',
};

/**
 * Parse numeric value from KEOS text format
 *
 * Handles KEOS-specific formats and Turkish number conventions:
 * - "MAX=0.50" → 0.50
 * - "-------" → undefined (null value)
 * - "MAX=15 (ON BEŞ)" → 15
 * - "32274,00 m²" → 32274
 * - "0,30" → 0.30
 * - "1,60" → 1.60
 * - "17.50 m" → 17.50
 * - "3 kat" → 3
 *
 * @param text - Raw text containing a number
 * @returns Parsed number or undefined if parsing fails
 */
function parseNumericValue(text: string | null | undefined): number | undefined {
  if (!text) return undefined;

  // Check for dash-only values (means no data)
  if (/^-+$/.test(text.trim())) {
    return undefined;
  }

  // Remove KEOS-specific prefixes and suffixes
  let cleaned = text
    .trim()
    .replace(/^MAX\s*=\s*/i, '') // Remove "MAX=" prefix
    .replace(/^T\.İ\.A\.\s*:\s*/i, '') // Remove "T.İ.A.:" prefix (for fixed areas)
    .replace(/\([^)]+\)/g, '') // Remove parenthetical text like "(ON BEŞ)"
    .replace(/\s*(m²|m|metre|kat|kata kadar)\s*$/i, '') // Remove unit suffixes
    .trim();

  // Handle Turkish decimal separator (comma → dot)
  // Turkish format: "32.274,00" or "0,30"
  // We need to:
  // 1. Remove dots used as thousand separators
  // 2. Replace comma with dot for decimal

  // Count commas and dots to determine format
  const commaCount = (cleaned.match(/,/g) || []).length;
  const dotCount = (cleaned.match(/\./g) || []).length;

  if (commaCount === 1 && dotCount === 0) {
    // Simple case: "0,30" → "0.30"
    cleaned = cleaned.replace(',', '.');
  } else if (commaCount === 1 && dotCount > 0) {
    // Turkish format: "32.274,00" → remove dots, replace comma
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (commaCount === 0 && dotCount > 1) {
    // Multiple dots - likely thousand separators: "32.274.000" → "32274000"
    cleaned = cleaned.replace(/\./g, '');
  }
  // else: no comma, single dot = already in correct format

  // Try parsing
  const parsed = parseFloat(cleaned);

  return !isNaN(parsed) && isFinite(parsed) ? parsed : undefined;
}

/**
 * Extract value from KEOS div-table by label
 *
 * KEOS uses a structure like:
 * <div class="divTableRow">
 *   <div class="divTableCellLabel">TAKS</div>
 *   <div class="divTableContent">MAX=0.50</div>
 * </div>
 *
 * @param html - HTML string
 * @param label - Label to search for (e.g., "TAKS", "KAKS", "EMSAL")
 * @returns Extracted value or null
 */
function extractByLabel(html: string, label: string): string | null {
  // Try to find the label and get the next divTableContent
  const labelPattern = new RegExp(
    `<div[^>]*class="[^"]*divTableCellLabel[^"]*"[^>]*>\\s*${label}\\s*</div>\\s*<div[^>]*class="[^"]*divTableContent[^"]*"[^>]*>([^<]*)</div>`,
    'i'
  );

  const match = html.match(labelPattern);
  if (match && match[1]) {
    return match[1].trim();
  }

  // Alternative: Try with table-subtitle class
  const labelPattern2 = new RegExp(
    `<div[^>]*class="[^"]*divTableCellLabel[^"]*table-subtitle[^"]*"[^>]*>\\s*${label}\\s*</div>\\s*<div[^>]*class="[^"]*divTableContent[^"]*"[^>]*>([^<]*)</div>`,
    'i'
  );

  const match2 = html.match(labelPattern2);
  if (match2 && match2[1]) {
    return match2[1].trim();
  }

  return null;
}

/**
 * Extract text content from HTML element using selector
 *
 * This is a placeholder implementation. In production, you would use:
 * - cheerio (server-side)
 * - DOMParser (client-side)
 * - Regular expressions (last resort)
 *
 * @param html - HTML string
 * @param selector - CSS selector
 * @returns Extracted text or null
 */
function extractText(html: string, selector: string): string | null {
  // For KEOS, we no longer use this - we use extractByLabel instead
  // But keep it as fallback
  console.warn('extractText called - consider using extractByLabel for KEOS');
  return null;
}

/**
 * Parse KEOS HTML response to extract İmar Durumu data
 *
 * @param html - HTML response from KEOS system
 * @param district - Municipality district (for logging/debugging)
 * @param customSelectors - Optional custom selectors (overrides defaults)
 * @returns Parsed İmar data with any errors encountered
 */
export function parseKEOSResponse(
  html: string,
  district: 'kepez' | 'konyaalti',
  customSelectors?: Partial<MunicipalitySelectors>
): ParsedImarData {
  const selectors = { ...DEFAULT_KEOS_SELECTORS, ...customSelectors };
  const parseErrors: string[] = [];
  const rawValues: { [key: string]: string } = {};

  // Helper to extract by label and track raw values
  const extractLabel = (key: string, label: string): string | null => {
    const value = extractByLabel(html, label);
    if (value) {
      rawValues[key] = value;
    }
    return value;
  };

  // Extract all fields using KEOS labels
  const taksText = extractLabel('taks', 'TAKS');
  const kaksText = extractLabel('kaks', 'KAKS');
  const emsalText = extractLabel('emsal', 'EMSAL');
  const cikmaText = extractLabel('cikma', 'Çıkma Oranı') ||
                    extractLabel('cikma', 'Çıkma Katsayısı');
  const maxYukseklikText = extractLabel('maxYukseklik', 'Bina Yüksekliği') ||
                           extractLabel('maxYukseklik', 'Max Yükseklik');
  const maxKatAdediText = extractLabel('maxKatAdedi', 'Kat Adedi') ||
                          extractLabel('maxKatAdedi', 'Kat Sayısı');
  const imarDurumuText = extractLabel('imarDurumu', 'İnşaat Nizamı') ||
                         extractLabel('imarDurumu', 'İmar Durumu');
  const planNotuText = extractLabel('planNotu', 'Plan Notu') ||
                       extractLabel('planNotu', 'Plan Notları');

  // Also extract parsel area if available
  const parselAlaniText = extractLabel('parselAlani', 'Parselin Yüzölçümü') ||
                          extractLabel('parselAlani', 'Parsel Alanı');
  if (parselAlaniText) {
    rawValues['parselAlani'] = parselAlaniText;
  }

  // Parse numeric values
  const taks = parseNumericValue(taksText);
  const kaks = parseNumericValue(kaksText);
  const emsal = parseNumericValue(emsalText) || kaks; // EMSAL = KAKS if not separate
  const cikmaKatsayisi = parseNumericValue(cikmaText);
  const maxYukseklik = parseNumericValue(maxYukseklikText);
  const maxKatAdedi = parseNumericValue(maxKatAdediText);

  // Validate required fields
  if (taks === undefined) {
    parseErrors.push('TAKS değeri bulunamadı veya ayrıştırılamadı');
  }

  if (kaks === undefined && emsal === undefined) {
    parseErrors.push('KAKS/EMSAL değeri bulunamadı veya ayrıştırılamadı');
  }

  if (!imarDurumuText) {
    parseErrors.push('İmar durumu bilgisi bulunamadı');
  }

  // Validate ranges
  if (taks !== undefined && (taks < 0 || taks > 1)) {
    parseErrors.push(`TAKS değeri geçersiz aralıkta: ${taks} (beklenen: 0.0-1.0)`);
  }

  if (kaks !== undefined && (kaks < 0 || kaks > 5)) {
    parseErrors.push(`KAKS değeri geçersiz aralıkta: ${kaks} (beklenen: 0.0-5.0)`);
  }

  if (cikmaKatsayisi !== undefined && (cikmaKatsayisi < 1.0 || cikmaKatsayisi > 2.0)) {
    parseErrors.push(
      `Çıkma katsayısı geçersiz aralıkta: ${cikmaKatsayisi} (beklenen: 1.0-2.0)`
    );
  }

  return {
    taks,
    kaks,
    emsal,
    cikmaKatsayisi,
    maxYukseklik,
    maxKatAdedi,
    imarDurumu: imarDurumuText || undefined,
    planNotu: planNotuText || undefined,
    parseErrors,
    rawValues,
  };
}

/**
 * Convert parsed data to ImarDurumu interface
 *
 * @param parsed - Parsed data from parseKEOSResponse
 * @param source - Municipality source
 * @param confidence - Confidence level based on parsing success
 * @returns Complete ImarDurumu object or null if critical fields missing
 */
export function parsedDataToImarDurumu(
  parsed: ParsedImarData,
  source: MunicipalityDistrict,
  confidence: 'high' | 'medium' | 'low' = 'high'
): ImarDurumu | null {
  // Require minimum critical fields
  if (
    parsed.taks === undefined ||
    (parsed.kaks === undefined && parsed.emsal === undefined) ||
    !parsed.imarDurumu
  ) {
    return null;
  }

  const kaks = parsed.kaks ?? parsed.emsal ?? 0;
  const emsal = parsed.emsal ?? parsed.kaks ?? 0;

  // Use default çıkma katsayısı if not provided
  // Common values: 1.4-1.8, let's use 1.6 as typical
  const cikmaKatsayisi = parsed.cikmaKatsayisi ?? 1.6;

  return {
    taks: parsed.taks,
    kaks,
    emsal,
    cikmaKatsayisi,
    maxYukseklik: parsed.maxYukseklik,
    maxKatAdedi: parsed.maxKatAdedi,
    imarDurumu: parsed.imarDurumu,
    planNotu: parsed.planNotu,
    fetchedAt: new Date(),
    source,
    confidence,
  };
}

/**
 * Validate KEOS HTML response to check if data is present
 *
 * Checks for common error patterns:
 * - "Kayıt bulunamadı" (No record found)
 * - Empty response
 * - Server error pages
 *
 * @param html - HTML response
 * @returns True if response appears valid
 */
export function validateKEOSResponse(html: string): {
  valid: boolean;
  error?: string;
} {
  if (!html || html.trim().length === 0) {
    return {
      valid: false,
      error: 'Boş yanıt alındı',
    };
  }

  // Check for common error messages
  const errorPatterns = [
    /kayıt bulunamadı/i,
    /veri bulunamadı/i,
    /sonuç bulunamadı/i,
    /hata oluştu/i,
    /server error/i,
    /404 not found/i,
  ];

  for (const pattern of errorPatterns) {
    if (pattern.test(html)) {
      return {
        valid: false,
        error: 'İmar kaydı bulunamadı veya sistem hatası',
      };
    }
  }

  // Check if response is likely valid (contains expected keywords)
  const validityPatterns = [
    /taks|emsal|kaks|imar/i, // Should contain zoning keywords
  ];

  const hasValidContent = validityPatterns.some((pattern) => pattern.test(html));

  if (!hasValidContent) {
    return {
      valid: false,
      error: 'İmar bilgisi içermeyen yanıt',
    };
  }

  return { valid: true };
}

/**
 * Generate debugging information for failed parse
 *
 * @param html - HTML that failed to parse
 * @param parsed - Parse result
 * @returns Debugging information string
 */
export function generateDebugInfo(html: string, parsed: ParsedImarData): string {
  const info: string[] = [];

  info.push('=== KEOS Parser Debug Info ===');
  info.push(`HTML Length: ${html.length} characters`);
  info.push(`Parse Errors: ${parsed.parseErrors.length}`);

  if (parsed.parseErrors.length > 0) {
    info.push('\nErrors:');
    parsed.parseErrors.forEach((err, i) => {
      info.push(`  ${i + 1}. ${err}`);
    });
  }

  info.push('\nRaw Values Extracted:');
  Object.entries(parsed.rawValues).forEach(([key, value]) => {
    info.push(`  ${key}: "${value}"`);
  });

  info.push('\nParsed Values:');
  info.push(`  TAKS: ${parsed.taks ?? 'MISSING'}`);
  info.push(`  KAKS: ${parsed.kaks ?? 'MISSING'}`);
  info.push(`  EMSAL: ${parsed.emsal ?? 'MISSING'}`);
  info.push(`  Çıkma: ${parsed.cikmaKatsayisi ?? 'MISSING'}`);
  info.push(`  Max Yükseklik: ${parsed.maxYukseklik ?? 'MISSING'}`);
  info.push(`  Max Kat: ${parsed.maxKatAdedi ?? 'MISSING'}`);
  info.push(`  İmar Durumu: ${parsed.imarDurumu ?? 'MISSING'}`);

  info.push('\n=== End Debug Info ===');

  return info.join('\n');
}
