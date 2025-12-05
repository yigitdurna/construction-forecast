/**
 * Decimal Input Component
 *
 * Handles decimal number input with Turkish locale support
 * - Accepts both period (.) and comma (,) as decimal separators
 * - Validates only on blur, not during typing
 * - Supports min/max constraints
 * - Shows suffix (e.g., "m²", "%")
 */

import React, { useState, useEffect } from 'react';

export interface DecimalInputProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  suffix?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  required?: boolean;
}

export function DecimalInput({
  value,
  onChange,
  min,
  max,
  step = 0.01,
  placeholder,
  suffix,
  label,
  error,
  disabled = false,
  className = '',
  required = false,
}: DecimalInputProps): JSX.Element {
  // Local state for display value (allows typing "0." or "1,")
  const [displayValue, setDisplayValue] = useState<string>('');
  const [isFocused, setIsFocused] = useState(false);

  // Sync display value when prop value changes (but not during focus)
  useEffect(() => {
    if (!isFocused && value !== null && value !== undefined) {
      setDisplayValue(formatTurkishNumber(value));
    } else if (!isFocused && (value === null || value === undefined)) {
      setDisplayValue('');
    }
  }, [value, isFocused]);

  /**
   * Format number as Turkish locale (1.234,56)
   */
  function formatTurkishNumber(num: number): string {
    return num.toLocaleString('tr-TR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 10,
    });
  }

  /**
   * Parse Turkish number format to float
   * Accepts: "1.234,56" or "1234.56" or "1234,56"
   */
  function parseTurkishNumber(str: string): number {
    // Remove thousand separators (period in Turkish format)
    // But keep decimal separator (comma or period)

    // First, check if there's both comma and period
    const hasComma = str.includes(',');
    const hasPeriod = str.includes('.');

    if (hasComma && hasPeriod) {
      // Both present - determine which is decimal separator
      const commaPos = str.lastIndexOf(',');
      const periodPos = str.lastIndexOf('.');

      if (commaPos > periodPos) {
        // Comma is decimal separator (Turkish format: 1.234,56)
        return parseFloat(str.replace(/\./g, '').replace(',', '.'));
      } else {
        // Period is decimal separator (US format: 1,234.56)
        return parseFloat(str.replace(/,/g, ''));
      }
    } else if (hasComma) {
      // Only comma - it's the decimal separator
      return parseFloat(str.replace(',', '.'));
    } else {
      // Only period or no separator - standard parsing
      return parseFloat(str);
    }
  }

  /**
   * Handle input change (display only, no validation)
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;

    // Allow empty input
    if (raw === '') {
      setDisplayValue('');
      return;
    }

    // Accept: digits, period, comma, negative sign at start, spaces (for thousands)
    if (/^-?\s*[\d\s.,]*$/.test(raw)) {
      setDisplayValue(raw);
    }
  };

  /**
   * Handle focus (clear formatted display for easier editing)
   */
  const handleFocus = () => {
    setIsFocused(true);
    // If there's a value, show it in simple format
    if (value !== null && value !== undefined) {
      setDisplayValue(value.toString());
    }
  };

  /**
   * Handle blur (parse and validate)
   */
  const handleBlur = () => {
    setIsFocused(false);

    if (displayValue === '' || displayValue === '-') {
      onChange(null);
      setDisplayValue('');
      return;
    }

    // Parse the value
    const parsed = parseTurkishNumber(displayValue);

    if (!isNaN(parsed)) {
      // Apply min/max constraints
      let constrained = parsed;
      if (min !== undefined && parsed < min) {
        constrained = min;
      }
      if (max !== undefined && parsed > max) {
        constrained = max;
      }

      // Round to step if specified
      if (step && step > 0) {
        constrained = Math.round(constrained / step) * step;
      }

      onChange(constrained);
      setDisplayValue(formatTurkishNumber(constrained));
    } else {
      // Invalid input - reset to previous value
      if (value !== null && value !== undefined) {
        setDisplayValue(formatTurkishNumber(value));
      } else {
        onChange(null);
        setDisplayValue('');
      }
    }
  };

  /**
   * Handle key press (Enter to blur)
   */
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            block w-full rounded-lg border px-3 py-2 shadow-sm
            focus:outline-none focus:ring-1 transition-colors
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
            ${suffix ? 'pr-12' : ''}
          `}
        />

        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
            {suffix}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {!error && min !== undefined && max !== undefined && (
        <p className="mt-1 text-xs text-gray-500">
          {formatTurkishNumber(min)} - {formatTurkishNumber(max)}
        </p>
      )}
    </div>
  );
}

export default DecimalInput;
