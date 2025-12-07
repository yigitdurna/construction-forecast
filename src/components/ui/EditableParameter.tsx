/**
 * Editable Parameter Component
 *
 * Displays a value with source indicator and inline edit capability.
 * Used for financial parameters that users can customize.
 */

import { useState, useRef, useEffect } from 'react';
import { SourceBadge, type DataSource } from './SourceBadge';

export interface EditableParameterProps {
  /** Parameter label */
  label: string;
  /** Current value */
  value: number;
  /** Unit display (TL/m², %, ay, etc.) */
  unit: string;
  /** Data source for badge */
  source: DataSource;
  /** Custom source label */
  sourceLabel?: string;
  /** Callback when value changes */
  onChange: (newValue: number) => void;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Decimal places for display */
  decimals?: number;
  /** Is this editable? */
  editable?: boolean;
  /** Optional description/tooltip */
  description?: string;
}

export function EditableParameter({
  label,
  value,
  unit,
  source,
  sourceLabel,
  onChange,
  min = 0,
  max = 999999999,
  decimals = 0,
  editable = true,
  description,
}: EditableParameterProps): JSX.Element {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const [currentSource, setCurrentSource] = useState(source);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update edit value when prop changes
  useEffect(() => {
    if (!isEditing) {
      setEditValue(value.toString());
    }
  }, [value, isEditing]);

  // Focus input when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleEdit = () => {
    if (editable) {
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    const parsed = parseFloat(editValue.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= min && parsed <= max) {
      onChange(parsed);
      setCurrentSource('manual'); // Mark as manually edited
    } else {
      // Reset to original value if invalid
      setEditValue(value.toString());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value.toString());
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatValue = (val: number): string => {
    return val.toLocaleString('tr-TR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
  };

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-700">{label}</span>
          {description && (
            <span className="text-xs text-gray-400" title={description}>
              (?)
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isEditing ? (
          <>
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
              className="w-24 px-2 py-1 text-sm text-right border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs text-gray-500 w-12">{unit}</span>
            <button
              onClick={handleSave}
              className="p-1 text-green-600 hover:text-green-800"
              title="Kaydet"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-red-600 hover:text-red-800"
              title="İptal"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        ) : (
          <>
            <span className="font-mono text-sm font-semibold text-gray-900 w-24 text-right">
              {formatValue(value)}
            </span>
            <span className="text-xs text-gray-500 w-12">{unit}</span>
            <SourceBadge source={currentSource} label={sourceLabel} />
            {editable && (
              <button
                onClick={handleEdit}
                className="p-1 text-gray-400 hover:text-blue-600"
                title="Düzenle"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                  />
                </svg>
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EditableParameter;
