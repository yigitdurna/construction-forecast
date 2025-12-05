/**
 * useImarValidation Hook
 *
 * React hook for managing İmar parameter validation state
 * Provides real-time validation feedback as user types
 */

import { useState, useCallback, useEffect } from 'react';
import {
  validateImarParams,
  validateField,
  isImarComplete,
  type ManualImarParams,
  type ValidationResult,
} from '../utils/imarValidation';

export interface ImarValidationState {
  // Current values
  values: Partial<ManualImarParams>;

  // Validation state
  validation: ValidationResult;
  isComplete: boolean;

  // Field-specific errors (for individual input feedback)
  fieldErrors: {
    taks?: string;
    kaks?: string;
    katAdedi?: string;
  };

  // Actions
  setValue: (field: keyof ManualImarParams, value: number | undefined) => void;
  setValues: (values: Partial<ManualImarParams>) => void;
  reset: () => void;
  validate: () => ValidationResult;
}

/**
 * Hook options
 */
export interface UseImarValidationOptions {
  initialValues?: Partial<ManualImarParams>;
  validateOnChange?: boolean; // Default: true
}

/**
 * Hook for İmar parameter validation
 *
 * @param options - Hook configuration
 * @returns Validation state and actions
 */
export function useImarValidation(
  options: UseImarValidationOptions = {}
): ImarValidationState {
  const { initialValues = {}, validateOnChange = true } = options;

  const [values, setValuesState] = useState<Partial<ManualImarParams>>(
    initialValues
  );
  const [validation, setValidation] = useState<ValidationResult>(() =>
    validateImarParams(initialValues)
  );

  // Validate whenever values change
  useEffect(() => {
    if (validateOnChange) {
      const result = validateImarParams(values);
      setValidation(result);
    }
  }, [values, validateOnChange]);

  /**
   * Set a single field value
   */
  const setValue = useCallback(
    (field: keyof ManualImarParams, value: number | undefined) => {
      setValuesState((prev) => ({
        ...prev,
        [field]: value,
      }));
    },
    []
  );

  /**
   * Set multiple values at once
   */
  const setValues = useCallback((newValues: Partial<ManualImarParams>) => {
    setValuesState(newValues);
  }, []);

  /**
   * Reset to initial values
   */
  const reset = useCallback(() => {
    setValuesState(initialValues);
    setValidation(validateImarParams(initialValues));
  }, [initialValues]);

  /**
   * Manually trigger validation
   */
  const validate = useCallback(() => {
    const result = validateImarParams(values);
    setValidation(result);
    return result;
  }, [values]);

  // Extract field-specific errors
  const fieldErrors = {
    taks: validation.errors.find((e) => e.field === 'taks')?.message,
    kaks: validation.errors.find((e) => e.field === 'kaks')?.message,
    katAdedi: validation.errors.find((e) => e.field === 'katAdedi')?.message,
  };

  return {
    values,
    validation,
    isComplete: isImarComplete(values) && validation.isValid,
    fieldErrors,
    setValue,
    setValues,
    reset,
    validate,
  };
}

/**
 * Hook for single field validation (useful for controlled inputs)
 *
 * @param field - Field name
 * @param value - Current value
 * @param otherValues - Other field values for cross-validation
 * @returns Validation state for the field
 */
export function useFieldValidation(
  field: keyof ManualImarParams,
  value: number | undefined,
  otherValues?: Partial<ManualImarParams>
): { isValid: boolean; error?: string } {
  const [validationState, setValidationState] = useState(() =>
    validateField(field, value, otherValues)
  );

  useEffect(() => {
    const result = validateField(field, value, otherValues);
    setValidationState(result);
  }, [field, value, otherValues]);

  return validationState;
}
