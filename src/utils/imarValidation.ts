/**
 * İmar Durumu (Zoning Status) Validation Utilities
 *
 * Provides validation for manual İmar parameter entry in Phase 2.2
 * Focuses on the 3 core manual inputs: TAKS, KAKS, Kat Adedi
 */

/**
 * Manual İmar parameters (simplified for user entry)
 *
 * Note: katAdedi is CALCULATED from KAKS/TAKS, not manually entered
 * Formula: katAdedi = KAKS / TAKS
 */
export interface ManualImarParams {
  taks: number;      // Taban Alanı Kat Sayısı (Building Coverage Ratio) - MANUAL INPUT
  kaks: number;      // Kat Alanı Kat Sayısı (Floor Area Ratio = EMSAL) - MANUAL INPUT
  katAdedi: number;  // Kat Adedi (Number of floors) - CALCULATED (KAKS/TAKS)
  cikmaKatsayisi?: number;  // Çıkma Katsayısı (Projection coefficient) - OPTIONAL MANUAL INPUT
}

/**
 * Validation limits for manual İmar entry
 */
export const IMAR_LIMITS = {
  taks: { min: 0.05, max: 0.70, step: 0.01 },
  kaks: { min: 0.10, max: 10.00, step: 0.01 },
  katAdedi: { min: 0.5, max: 50, step: 0.1 },  // Calculated value, but needs validation
  cikmaKatsayisi: { min: 1.0, max: 2.0, step: 0.1 },
};

/**
 * Error messages in Turkish
 */
export const IMAR_ERRORS = {
  taksOutOfRange: `TAKS değeri ${IMAR_LIMITS.taks.min} ile ${IMAR_LIMITS.taks.max} arasında olmalıdır`,
  kaksOutOfRange: `KAKS değeri ${IMAR_LIMITS.kaks.min} ile ${IMAR_LIMITS.kaks.max} arasında olmalıdır`,
  katAdediOutOfRange: `Kat adedi ${IMAR_LIMITS.katAdedi.min} ile ${IMAR_LIMITS.katAdedi.max} arasında olmalıdır`,
  cikmaOutOfRange: `Çıkma katsayısı ${IMAR_LIMITS.cikmaKatsayisi.min} ile ${IMAR_LIMITS.cikmaKatsayisi.max} arasında olmalıdır`,
  kaksLessThanTaks: 'KAKS değeri TAKS değerinden küçük olamaz (çok katlı binalar için)',
  required: 'Bu alan zorunludur',
  invalidNumber: 'Geçerli bir sayı giriniz',
  taksRequired: 'TAKS değeri giriniz (örn: 0.30)',
  kaksRequired: 'KAKS/Emsal değeri giriniz (örn: 1.05)',
  katAdediCalculation: 'Kat adedi KAKS/TAKS oranından hesaplanır',
  cikmaRequired: 'Çıkma katsayısı giriniz (örn: 1.60)',
};

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: string[];
}

/**
 * Single validation error
 */
export interface ValidationError {
  field: keyof ManualImarParams | 'general';
  message: string;
  code: string;
}

/**
 * Validates manual İmar parameters
 *
 * Validation rules:
 * 1. Range checks (TAKS 0.05-0.70, KAKS 0.10-10.00)
 * 2. Logical check: KAKS >= TAKS (for multi-story buildings)
 * 3. Kat Adedi validation (if provided, must match KAKS/TAKS)
 * 4. Optional: Çıkma katsayısı (1.0-2.0) if provided
 *
 * Note: Kat Adedi is calculated from KAKS/TAKS, not manually entered
 *
 * @param params - Manual İmar parameters to validate
 * @returns Validation result with errors and warnings
 */
export function validateImarParams(
  params: Partial<ManualImarParams>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check required fields (TAKS and KAKS only)
  if (params.taks === undefined || params.taks === null) {
    errors.push({
      field: 'taks',
      message: IMAR_ERRORS.taksRequired,
      code: 'taks_required',
    });
  }

  if (params.kaks === undefined || params.kaks === null) {
    errors.push({
      field: 'kaks',
      message: IMAR_ERRORS.kaksRequired,
      code: 'kaks_required',
    });
  }

  // If required fields missing, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const { taks, kaks, katAdedi, cikmaKatsayisi } = params as ManualImarParams;

  // Validate TAKS range
  if (isNaN(taks) || !isFinite(taks)) {
    errors.push({
      field: 'taks',
      message: IMAR_ERRORS.invalidNumber,
      code: 'taks_invalid_number',
    });
  } else if (taks < IMAR_LIMITS.taks.min || taks > IMAR_LIMITS.taks.max) {
    errors.push({
      field: 'taks',
      message: IMAR_ERRORS.taksOutOfRange,
      code: 'taks_out_of_range',
    });
  }

  // Validate KAKS range
  if (isNaN(kaks) || !isFinite(kaks)) {
    errors.push({
      field: 'kaks',
      message: IMAR_ERRORS.invalidNumber,
      code: 'kaks_invalid_number',
    });
  } else if (kaks < IMAR_LIMITS.kaks.min || kaks > IMAR_LIMITS.kaks.max) {
    errors.push({
      field: 'kaks',
      message: IMAR_ERRORS.kaksOutOfRange,
      code: 'kaks_out_of_range',
    });
  }

  // Validate Kat Adedi (should be calculated, but if provided, validate it)
  if (katAdedi !== undefined) {
    if (isNaN(katAdedi) || !isFinite(katAdedi)) {
      errors.push({
        field: 'katAdedi',
        message: IMAR_ERRORS.invalidNumber,
        code: 'katAdedi_invalid_number',
      });
    } else if (
      katAdedi < IMAR_LIMITS.katAdedi.min ||
      katAdedi > IMAR_LIMITS.katAdedi.max
    ) {
      errors.push({
        field: 'katAdedi',
        message: IMAR_ERRORS.katAdediOutOfRange,
        code: 'katAdedi_out_of_range',
      });
    } else if (!isNaN(taks) && taks > 0) {
      // Verify katAdedi matches calculation (KAKS / TAKS)
      const calculatedKatAdedi = kaks / taks;
      const tolerance = 0.1; // Allow small rounding differences

      if (Math.abs(katAdedi - calculatedKatAdedi) > tolerance) {
        warnings.push(
          `Kat adedi (${katAdedi.toFixed(1)}) KAKS/TAKS oranından (${calculatedKatAdedi.toFixed(1)}) farklı.`
        );
      }
    }
  }

  // Validate Çıkma Katsayısı (optional)
  if (cikmaKatsayisi !== undefined) {
    if (isNaN(cikmaKatsayisi) || !isFinite(cikmaKatsayisi)) {
      errors.push({
        field: 'cikmaKatsayisi',
        message: IMAR_ERRORS.invalidNumber,
        code: 'cikma_invalid_number',
      });
    } else if (
      cikmaKatsayisi < IMAR_LIMITS.cikmaKatsayisi.min ||
      cikmaKatsayisi > IMAR_LIMITS.cikmaKatsayisi.max
    ) {
      errors.push({
        field: 'cikmaKatsayisi',
        message: IMAR_ERRORS.cikmaOutOfRange,
        code: 'cikma_out_of_range',
      });
    }
  }

  // Cross-validation: KAKS should be >= TAKS for multi-story buildings
  if (!isNaN(kaks) && !isNaN(taks) && kaks < taks) {
    warnings.push(
      'KAKS değeri TAKS değerinden küçük. Bu genellikle tek katlı binalar içindir.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Validates a single field value
 * Useful for real-time validation as user types
 *
 * @param field - Field name to validate
 * @param value - Field value
 * @param otherValues - Other field values for cross-validation
 * @returns Field validation result
 */
export function validateField(
  field: keyof ManualImarParams,
  value: number | undefined,
  otherValues?: Partial<ManualImarParams>
): { isValid: boolean; error?: string } {
  // Validate single field
  const params: Partial<ManualImarParams> = {
    ...otherValues,
    [field]: value,
  };

  const result = validateImarParams(params);
  const fieldError = result.errors.find((e) => e.field === field);

  return {
    isValid: !fieldError,
    error: fieldError?.message,
  };
}

/**
 * Formats İmar values for display
 *
 * @param value - Numeric value
 * @param type - Type of value
 * @returns Formatted string
 */
export function formatImarValue(
  value: number | undefined,
  type: 'taks' | 'kaks' | 'katAdedi'
): string {
  if (value === undefined || value === null || isNaN(value)) {
    return '';
  }

  switch (type) {
    case 'taks':
    case 'kaks':
      return value.toFixed(2);
    case 'katAdedi':
      return Math.round(value).toString();
    default:
      return value.toString();
  }
}

/**
 * Parses user input string to number
 * Handles Turkish decimal separator (comma)
 *
 * @param input - User input string
 * @returns Parsed number or NaN
 */
export function parseImarValue(input: string): number {
  if (!input || input.trim() === '') {
    return NaN;
  }

  // Replace Turkish decimal comma with period
  const normalized = input.trim().replace(',', '.');
  return parseFloat(normalized);
}

/**
 * Checks if manual İmar params are complete
 *
 * Only TAKS and KAKS are required inputs (katAdedi is calculated)
 *
 * @param params - Partial manual İmar params
 * @returns True if all required fields are present
 */
export function isImarComplete(
  params: Partial<ManualImarParams>
): boolean {
  return (
    params.taks !== undefined &&
    params.taks !== null &&
    !isNaN(params.taks) &&
    params.kaks !== undefined &&
    params.kaks !== null &&
    !isNaN(params.kaks)
  );
}

/**
 * Alias for validateImarParams (for compatibility)
 */
export function validateImarInputs(
  params: Partial<ManualImarParams>
): ValidationResult {
  return validateImarParams(params);
}

/**
 * Calculate İmar derived values
 *
 * @param params - İmar parameters including parselAlani
 * @returns Calculated values
 */
export function calculateImarValues(params: {
  parselAlani: number;
  taks?: number;
  kaks?: number;
  cikmaKatsayisi?: number;
  katAdedi?: number;
  yencokOverride?: number;
  hmaxOverride?: number;
}): {
  tabanAlani: number;
  toplamInsaatAlani: number;
  hesaplananKatAdedi: number;
  uygulanacakKatAdedi: number;
  cikmaIleToplamAlan?: number;
} {
  const { parselAlani } = params;
  const taks = params.taks || 0;
  const kaks = params.kaks || 0;
  const cikmaKatsayisi = params.cikmaKatsayisi || 1.0;

  const tabanAlani = parselAlani * taks;
  const toplamInsaatAlani = parselAlani * kaks;
  const hesaplananKatAdedi = taks > 0 ? kaks / taks : 0;
  const uygulanacakKatAdedi = hesaplananKatAdedi; // Same for now (can be limited by max height)

  // Calculate with çıkma if provided
  const cikmaIleToplamAlan = cikmaKatsayisi > 1.0
    ? toplamInsaatAlani * cikmaKatsayisi
    : undefined;

  return {
    tabanAlani,
    toplamInsaatAlani,
    hesaplananKatAdedi,
    uygulanacakKatAdedi,
    cikmaIleToplamAlan,
  };
}

/**
 * Create complete ImarData object
 *
 * @param params - İmar parameters including parselAlani
 * @returns Complete ImarData object
 */
export function createImarData(params: {
  parselAlani: number;
  taks: number;
  kaks: number;
  cikmaKatsayisi?: number;
  yencokOverride?: number;
  hmaxOverride?: number;
}): any {
  const calculated = calculateImarValues(params);

  return {
    inputs: {
      parselAlani: params.parselAlani,
      taks: params.taks,
      kaks: params.kaks,
      cikmaKatsayisi: params.cikmaKatsayisi,
    },
    calculated: {
      tabanAlani: calculated.tabanAlani,
      toplamInsaatAlani: calculated.toplamInsaatAlani,
      hesaplananKatAdedi: calculated.hesaplananKatAdedi,
      uygulanacakKatAdedi: calculated.uygulanacakKatAdedi,
    },
  };
}
