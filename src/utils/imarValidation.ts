/**
 * İmar Durumu (Zoning Status) Validation Utilities
 *
 * Provides validation for manual İmar parameter entry in Phase 2.2
 * Focuses on the 3 core manual inputs: TAKS, KAKS, Kat Adedi
 */

/**
 * Manual İmar parameters (simplified for user entry)
 */
export interface ManualImarParams {
  taks: number;      // Taban Alanı Kat Sayısı (Building Coverage Ratio)
  kaks: number;      // Kat Alanı Kat Sayısı (Floor Area Ratio = EMSAL)
  katAdedi: number;  // Kat Adedi (Number of floors)
}

/**
 * Validation limits for manual İmar entry
 */
export const IMAR_LIMITS = {
  taks: { min: 0.05, max: 0.70, step: 0.05 },
  kaks: { min: 0.10, max: 3.00, step: 0.05 },
  katAdedi: { min: 1, max: 15, step: 1 },
};

/**
 * Error messages in Turkish
 */
export const IMAR_ERRORS = {
  taksOutOfRange: `TAKS değeri ${IMAR_LIMITS.taks.min} ile ${IMAR_LIMITS.taks.max} arasında olmalıdır`,
  kaksOutOfRange: `KAKS değeri ${IMAR_LIMITS.kaks.min} ile ${IMAR_LIMITS.kaks.max} arasında olmalıdır`,
  katAdediOutOfRange: `Kat adedi ${IMAR_LIMITS.katAdedi.min} ile ${IMAR_LIMITS.katAdedi.max} arasında olmalıdır`,
  kaksLessThanTaks: 'KAKS değeri TAKS değerinden küçük olamaz (çok katlı binalar için)',
  katAdediInconsistent: (required: number) =>
    `Bu TAKS/KAKS oranı için en az ${required} kat gereklidir`,
  required: 'Bu alan zorunludur',
  invalidNumber: 'Geçerli bir sayı giriniz',
  taksRequired: 'TAKS değeri giriniz (örn: 0.30)',
  kaksRequired: 'KAKS/Emsal değeri giriniz (örn: 0.60)',
  katAdediRequired: 'Kat adedi giriniz (örn: 2)',
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
 * 1. Range checks (TAKS 0.05-0.70, KAKS 0.10-3.00, Kat 1-15)
 * 2. Logical check: KAKS >= TAKS (for multi-story buildings)
 * 3. Consistency check: katAdedi should match KAKS/TAKS ratio
 *
 * @param params - Manual İmar parameters to validate
 * @returns Validation result with errors and warnings
 */
export function validateImarParams(
  params: Partial<ManualImarParams>
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: string[] = [];

  // Check required fields
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

  if (params.katAdedi === undefined || params.katAdedi === null) {
    errors.push({
      field: 'katAdedi',
      message: IMAR_ERRORS.katAdediRequired,
      code: 'katAdedi_required',
    });
  }

  // If required fields missing, return early
  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  const { taks, kaks, katAdedi } = params as ManualImarParams;

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

  // Validate Kat Adedi range
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
  } else if (!Number.isInteger(katAdedi)) {
    errors.push({
      field: 'katAdedi',
      message: 'Kat adedi tam sayı olmalıdır',
      code: 'katAdedi_not_integer',
    });
  }

  // Cross-validation: KAKS should be >= TAKS for multi-story buildings
  if (!isNaN(kaks) && !isNaN(taks) && kaks < taks) {
    errors.push({
      field: 'kaks',
      message: IMAR_ERRORS.kaksLessThanTaks,
      code: 'kaks_less_than_taks',
    });
  }

  // Logical validation: katAdedi should be consistent with KAKS/TAKS ratio
  if (
    !isNaN(kaks) &&
    !isNaN(taks) &&
    taks > 0 &&
    !isNaN(katAdedi) &&
    Number.isInteger(katAdedi)
  ) {
    // Implied number of floors from coefficients
    const impliedKat = Math.ceil(kaks / taks);

    if (katAdedi < impliedKat) {
      errors.push({
        field: 'katAdedi',
        message: IMAR_ERRORS.katAdediInconsistent(impliedKat),
        code: 'katAdedi_inconsistent',
      });
    }

    // Warning if user entered more floors than strictly needed
    if (katAdedi > impliedKat) {
      warnings.push(
        `Girilen kat adedi (${katAdedi}) TAKS/KAKS oranından hesaplanan kat sayısından (${impliedKat}) fazla. Bu normal olabilir ancak kontrol ediniz.`
      );
    }
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
 * @param params - Partial manual İmar params
 * @returns True if all required fields are present
 */
export function isImarComplete(
  params: Partial<ManualImarParams>
): params is ManualImarParams {
  return (
    params.taks !== undefined &&
    params.taks !== null &&
    !isNaN(params.taks) &&
    params.kaks !== undefined &&
    params.kaks !== null &&
    !isNaN(params.kaks) &&
    params.katAdedi !== undefined &&
    params.katAdedi !== null &&
    !isNaN(params.katAdedi)
  );
}
