/**
 * Dynamic Unit Mix Editor Component
 *
 * FULLY EDITABLE: Add, remove, edit all fields inline
 * Step 2: Configure apartment unit distribution
 */

import { useState, useEffect, useMemo } from 'react';
import type { UnitTypeCode, UnitConfig, UnitMix } from '../../types/feasibility';
import { WIZARD_TEXT } from '../../types/feasibility';

export interface UnitMixEditorDynamicProps {
  availableArea: number; // Net kullanım alanı from zoning
  initialMix?: UnitMix;
  onMixChange: (mix: UnitMix) => void;
}

/**
 * Editable apartment configuration
 */
interface EditableUnit {
  id: string;
  type: string; // User-editable name (e.g., "2+1", "Studio", "Penthouse")
  count: number;
  netAreaPerUnit: number;
}

/**
 * Net to gross multipliers by approximate size
 */
const getGrossMultiplier = (netArea: number): number => {
  if (netArea < 70) return 1.25; // Small units (1+1)
  if (netArea < 100) return 1.20; // Medium units (2+1)
  if (netArea < 140) return 1.18; // Large units (3+1)
  return 1.15; // Very large units (4+1, 5+1)
};

/**
 * Generate unique ID
 */
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 9);
};

/**
 * UnitMixEditorDynamic Component
 *
 * Fully editable table with add/remove rows
 */
export function UnitMixEditorDynamic({
  availableArea,
  initialMix,
  onMixChange,
}: UnitMixEditorDynamicProps): JSX.Element {
  // Initialize with editable units
  const [units, setUnits] = useState<EditableUnit[]>(() => {
    if (initialMix && initialMix.units.length > 0) {
      return initialMix.units.map((unit) => ({
        id: generateId(),
        type: unit.type,
        count: unit.count,
        netAreaPerUnit: unit.netArea,
      }));
    }

    // Default: Create standard Turkish apartment types
    return [
      { id: generateId(), type: '1+1', count: 4, netAreaPerUnit: 65 },
      { id: generateId(), type: '2+1', count: 6, netAreaPerUnit: 90 },
      { id: generateId(), type: '3+1', count: 4, netAreaPerUnit: 120 },
      { id: generateId(), type: '4+1', count: 2, netAreaPerUnit: 150 },
    ];
  });

  // Recalculate mix whenever units change
  useEffect(() => {
    const mix = calculateUnitMixFromEditable(units, availableArea);
    onMixChange(mix);
  }, [units, availableArea, onMixChange]);

  /**
   * Calculate unit mix from editable units
   */
  function calculateUnitMixFromEditable(
    editableUnits: EditableUnit[],
    available: number
  ): UnitMix {
    const configs: UnitConfig[] = [];
    let totalNet = 0;
    let totalGross = 0;
    let totalUnits = 0;
    const warnings: string[] = [];

    editableUnits.forEach((unit) => {
      if (unit.count > 0) {
        const grossMultiplier = getGrossMultiplier(unit.netAreaPerUnit);
        const grossAreaPerUnit = unit.netAreaPerUnit * grossMultiplier;

        configs.push({
          type: unit.type as UnitTypeCode,
          count: unit.count,
          netArea: unit.netAreaPerUnit,
          grossMultiplier,
        });

        totalNet += unit.netAreaPerUnit * unit.count;
        totalGross += grossAreaPerUnit * unit.count;
        totalUnits += unit.count;
      }
    });

    // Calculate utilization
    const utilization = available > 0 ? totalNet / available : 0;

    // Warnings
    if (utilization > 1.0) {
      warnings.push('Toplam alan kullanılabilir alanı aşıyor!');
    } else if (utilization < 0.8) {
      warnings.push(
        `Alan kullanımı düşük (${(utilization * 100).toFixed(0)}%). Daha fazla daire ekleyebilirsiniz.`
      );
    }

    if (totalUnits === 0) {
      warnings.push('En az bir daire tipi ekleyin');
    }

    return {
      units: configs,
      totalUnits,
      totalNetArea: totalNet,
      totalGrossArea: totalGross,
      areaUtilization: utilization,
      warnings,
    };
  }

  /**
   * Add new unit type
   */
  const handleAddUnit = () => {
    const newUnit: EditableUnit = {
      id: generateId(),
      type: `${units.length + 1}+1`,
      count: 1,
      netAreaPerUnit: 90,
    };
    setUnits([...units, newUnit]);
  };

  /**
   * Remove unit type
   */
  const handleRemoveUnit = (id: string) => {
    setUnits(units.filter((u) => u.id !== id));
  };

  /**
   * Update unit field
   */
  const handleUpdateUnit = (id: string, field: keyof EditableUnit, value: any) => {
    setUnits(
      units.map((u) =>
        u.id === id
          ? { ...u, [field]: field === 'type' ? value : Number(value) || 0 }
          : u
      )
    );
  };

  /**
   * Handle count change
   */
  const handleCountChange = (id: string, value: string) => {
    if (value === '') {
      handleUpdateUnit(id, 'count', 0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      handleUpdateUnit(id, 'count', parsed);
    }
  };

  /**
   * Handle count blur
   */
  const handleCountBlur = (id: string, value: string) => {
    if (value === '' || isNaN(parseFloat(value))) {
      handleUpdateUnit(id, 'count', 1);
    }
  };

  /**
   * Handle area change
   */
  const handleAreaChange = (id: string, value: string) => {
    if (value === '') {
      handleUpdateUnit(id, 'netAreaPerUnit', 0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      handleUpdateUnit(id, 'netAreaPerUnit', parsed);
    }
  };

  /**
   * Handle area blur
   */
  const handleAreaBlur = (id: string, value: string) => {
    if (value === '' || isNaN(parseFloat(value))) {
      handleUpdateUnit(id, 'netAreaPerUnit', 90);
    }
  };

  /**
   * Auto-optimize unit mix
   */
  const handleOptimize = () => {
    // Create optimized mix based on available area
    const optimized: EditableUnit[] = [
      { id: generateId(), type: '1+1', count: Math.floor(availableArea * 0.15 / 65), netAreaPerUnit: 65 },
      { id: generateId(), type: '2+1', count: Math.floor(availableArea * 0.35 / 90), netAreaPerUnit: 90 },
      { id: generateId(), type: '3+1', count: Math.floor(availableArea * 0.40 / 120), netAreaPerUnit: 120 },
      { id: generateId(), type: '4+1', count: Math.floor(availableArea * 0.10 / 150), netAreaPerUnit: 150 },
    ].filter(u => u.count > 0);

    setUnits(optimized);
  };

  /**
   * Reset to defaults
   */
  const handleReset = () => {
    setUnits([
      { id: generateId(), type: '1+1', count: 4, netAreaPerUnit: 65 },
      { id: generateId(), type: '2+1', count: 6, netAreaPerUnit: 90 },
      { id: generateId(), type: '3+1', count: 4, netAreaPerUnit: 120 },
      { id: generateId(), type: '4+1', count: 2, netAreaPerUnit: 150 },
    ]);
  };

  // Calculate current mix for display
  const currentMix = useMemo(
    () => calculateUnitMixFromEditable(units, availableArea),
    [units, availableArea]
  );
  const remainingArea = availableArea - currentMix.totalNetArea;
  const utilizationPercent = currentMix.areaUtilization * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {WIZARD_TEXT.step2.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Tüm alanlar düzenlenebilir. Satır eklemek veya silmek için butonları kullanın.
        </p>
      </div>

      {/* Available Area Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-600">Kullanılabilir Alan</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {availableArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Kullanılan Alan</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">
              {currentMix.totalNetArea.toLocaleString('tr-TR', {
                maximumFractionDigits: 0,
              })}{' '}
              m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Kalan Alan</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                remainingArea < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {remainingArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Alan Kullanımı</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                utilizationPercent > 100
                  ? 'text-red-600'
                  : utilizationPercent < 80
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}
            >
              {utilizationPercent.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Warnings */}
      {currentMix.warnings.length > 0 && (
        <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Uyarı:</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                {currentMix.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* EDITABLE Unit Mix Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Daire Tipi
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Adet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                m²/Daire (Net)
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Toplam Net
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                % Kullanım
              </th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-600">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {units.map((unit) => {
              const totalArea = unit.count * unit.netAreaPerUnit;
              const percentage =
                availableArea > 0 ? (totalArea / availableArea) * 100 : 0;

              return (
                <tr key={unit.id} className="hover:bg-gray-50">
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="text"
                      value={unit.type}
                      onChange={(e) =>
                        handleUpdateUnit(unit.id, 'type', e.target.value)
                      }
                      className="w-24 rounded border-gray-300 px-2 py-1 text-sm font-semibold focus:border-blue-500 focus:ring-blue-500"
                      placeholder="2+1"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="number"
                      value={unit.count === 0 ? '' : unit.count}
                      onChange={(e) =>
                        handleCountChange(unit.id, e.target.value)
                      }
                      onBlur={(e) =>
                        handleCountBlur(unit.id, e.target.value)
                      }
                      min={0}
                      placeholder="0"
                      className="w-20 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="number"
                      value={unit.netAreaPerUnit === 0 ? '' : unit.netAreaPerUnit}
                      onChange={(e) =>
                        handleAreaChange(unit.id, e.target.value)
                      }
                      onBlur={(e) =>
                        handleAreaBlur(unit.id, e.target.value)
                      }
                      min={0}
                      step={5}
                      placeholder="0"
                      className="w-20 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {totalArea.toLocaleString('tr-TR')} m²
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm text-gray-600">
                      {percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-center">
                    <button
                      onClick={() => handleRemoveUnit(unit.id)}
                      className="rounded bg-red-50 px-2 py-1 text-sm font-medium text-red-700 hover:bg-red-100"
                      title="Sil"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td className="px-4 py-3 font-semibold text-gray-900">Toplam</td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {currentMix.totalUnits}
              </td>
              <td className="px-4 py-3"></td>
              <td className="px-4 py-3">
                <span className="font-mono font-semibold text-gray-900">
                  {currentMix.totalNetArea.toLocaleString('tr-TR', {
                    maximumFractionDigits: 0,
                  })}{' '}
                  m²
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`font-semibold ${
                    utilizationPercent > 100
                      ? 'text-red-600'
                      : utilizationPercent < 80
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }`}
                >
                  {utilizationPercent.toFixed(0)}%
                </span>
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          <button
            onClick={handleAddUnit}
            className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-100"
          >
            ➕ Yeni Daire Tipi Ekle
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            🔄 Varsayılana Dön
          </button>
        </div>
        <button
          onClick={handleOptimize}
          className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          ✨ Otomatik Optimize Et
        </button>
      </div>
    </div>
  );
}

export default UnitMixEditorDynamic;
