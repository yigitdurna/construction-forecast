/**
 * Unit Mix Editor Component
 *
 * Step 2: Configure apartment unit distribution
 */

import { useState, useEffect } from 'react';
import type { UnitTypeCode, UnitConfig, UnitMix } from '../../types/feasibility';
import {
  DEFAULT_UNIT_SIZES,
  DEFAULT_MIX_RATIOS,
  WIZARD_TEXT,
} from '../../types/feasibility';

export interface UnitMixEditorProps {
  availableArea: number; // Net kullanım alanı from zoning
  initialMix?: UnitMix;
  onMixChange: (mix: UnitMix) => void;
}

/**
 * Net to gross multipliers by unit type
 * Phase 3.2: Added 1+0 with higher multiplier
 */
const GROSS_MULTIPLIERS: Record<UnitTypeCode, number> = {
  '1+0': 1.28, // 28% common areas (smaller units = more common area per unit)
  '1+1': 1.25, // 25% common areas
  '2+1': 1.20, // 20% common areas
  '3+1': 1.18, // 18% common areas
  '4+1': 1.15, // 15% common areas
  '5+1': 1.15, // 15% common areas
};

/**
 * Preset unit distributions for common scenarios
 * Phase 3.2: Quick presets for different market segments
 */
interface PresetDistribution {
  label: string;
  emoji: string;
  description: string;
  distribution: Partial<Record<UnitTypeCode, { percentage: number; defaultArea: number }>>;
}

const PRESETS: Record<string, PresetDistribution> = {
  '1+0-agirlikli': {
    label: '1+0 Ağırlıklı',
    emoji: '🏢',
    description: 'Kısa dönem kiralık / Airbnb',
    distribution: {
      '1+0': { percentage: 50, defaultArea: 38 },
      '1+1': { percentage: 35, defaultArea: 50 },
      '2+1': { percentage: 15, defaultArea: 85 },
    },
  },
  '1+1-agirlikli': {
    label: '1+1 Ağırlıklı',
    emoji: '🏠',
    description: 'Yabancı yatırımcı / Vatandaşlık',
    distribution: {
      '1+0': { percentage: 15, defaultArea: 38 },
      '1+1': { percentage: 50, defaultArea: 50 },
      '2+1': { percentage: 25, defaultArea: 85 },
      '3+1': { percentage: 10, defaultArea: 120 },
    },
  },
  'aile-agirlikli': {
    label: 'Aile Ağırlıklı',
    emoji: '👨‍👩‍👧',
    description: 'Yerli aile konutları',
    distribution: {
      '1+1': { percentage: 15, defaultArea: 55 },
      '2+1': { percentage: 40, defaultArea: 90 },
      '3+1': { percentage: 35, defaultArea: 125 },
      '4+1': { percentage: 10, defaultArea: 165 },
    },
  },
  karma: {
    label: 'Karma Dağılım',
    emoji: '⚖️',
    description: 'Dengeli portföy',
    distribution: {
      '1+0': { percentage: 15, defaultArea: 38 },
      '1+1': { percentage: 30, defaultArea: 50 },
      '2+1': { percentage: 30, defaultArea: 85 },
      '3+1': { percentage: 20, defaultArea: 120 },
      '4+1': { percentage: 5, defaultArea: 165 },
    },
  },
};

/**
 * UnitMixEditor Component
 *
 * Allows editing unit counts and shows real-time area usage
 */
export function UnitMixEditor({
  availableArea,
  initialMix,
  onMixChange,
}: UnitMixEditorProps): JSX.Element {
  const unitTypes: UnitTypeCode[] = ['1+0', '1+1', '2+1', '3+1', '4+1', '5+1'];

  // Initialize unit counts and sizes
  const [unitCounts, setUnitCounts] = useState<Record<UnitTypeCode, number>>(() => {
    if (initialMix) {
      const counts: Partial<Record<UnitTypeCode, number>> = {};
      initialMix.units.forEach((unit) => {
        counts[unit.type] = unit.count;
      });
      return counts as Record<UnitTypeCode, number>;
    }

    // Auto-calculate from default ratios
    return calculateDefaultCounts(availableArea);
  });

  const [unitSizes] = useState<Record<UnitTypeCode, number>>(
    DEFAULT_UNIT_SIZES
  );

  // Recalculate mix whenever counts or sizes change
  useEffect(() => {
    const mix = calculateUnitMix(unitCounts, unitSizes, availableArea);
    onMixChange(mix);
  }, [unitCounts, unitSizes, availableArea, onMixChange]);

  /**
   * Calculate default unit counts based on available area
   */
  function calculateDefaultCounts(area: number): Record<UnitTypeCode, number> {
    const counts: Partial<Record<UnitTypeCode, number>> = {};

    // Start with ratios
    unitTypes.forEach((type) => {
      const ratio = DEFAULT_MIX_RATIOS[type as UnitTypeCode];
      const targetArea = area * ratio;
      const unitSize = DEFAULT_UNIT_SIZES[type as UnitTypeCode];
      counts[type] = Math.floor(targetArea / unitSize);
    });

    return counts as Record<UnitTypeCode, number>;
  }

  /**
   * Calculate unit mix from current configuration
   */
  function calculateUnitMix(
    counts: Record<UnitTypeCode, number>,
    sizes: Record<UnitTypeCode, number>,
    available: number
  ): UnitMix {
    const units: UnitConfig[] = [];
    let totalNet = 0;
    let totalGross = 0;
    let totalUnits = 0;
    const warnings: string[] = [];

    unitTypes.forEach((type) => {
      const count = counts[type];
      if (count > 0) {
        const netArea = sizes[type];
        const grossMultiplier = GROSS_MULTIPLIERS[type];
        const grossArea = netArea * grossMultiplier;

        units.push({
          type,
          count,
          netArea,
          grossMultiplier,
        });

        totalNet += netArea * count;
        totalGross += grossArea * count;
        totalUnits += count;
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
      units,
      totalUnits,
      totalNetArea: totalNet,
      totalGrossArea: totalGross,
      areaUtilization: utilization,
      warnings,
    };
  }

  /**
   * Handle unit count change
   */
  const handleCountChange = (type: UnitTypeCode, value: string) => {
    // Allow empty string for better UX
    if (value === '') {
      setUnitCounts((prev) => ({
        ...prev,
        [type]: 0,
      }));
      return;
    }

    const count = parseInt(value, 10);
    if (!isNaN(count) && count >= 0) {
      setUnitCounts((prev) => ({
        ...prev,
        [type]: count,
      }));
    }
  };

  /**
   * Handle blur - set to 0 if empty
   */
  const handleCountBlur = (type: UnitTypeCode, value: string) => {
    if (value === '' || isNaN(parseInt(value, 10))) {
      setUnitCounts((prev) => ({
        ...prev,
        [type]: 0,
      }));
    }
  };

  /**
   * Auto-optimize unit mix
   */
  const handleOptimize = () => {
    const optimized = calculateDefaultCounts(availableArea);
    setUnitCounts(optimized);
  };

  /**
   * Apply a preset distribution
   */
  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const newCounts: Partial<Record<UnitTypeCode, number>> = {
      '1+0': 0,
      '1+1': 0,
      '2+1': 0,
      '3+1': 0,
      '4+1': 0,
      '5+1': 0,
    };

    // Calculate unit counts from preset percentages
    Object.entries(preset.distribution).forEach(([type, config]) => {
      const targetArea = availableArea * (config.percentage / 100);
      const count = Math.floor(targetArea / config.defaultArea);
      newCounts[type as UnitTypeCode] = count;
    });

    setUnitCounts(newCounts as Record<UnitTypeCode, number>);
  };

  /**
   * Calculate maximum capacity for each unit type
   */
  const calculateMaxCapacity = (): Record<UnitTypeCode, number> => {
    const maxCapacity: Partial<Record<UnitTypeCode, number>> = {};
    unitTypes.forEach((type) => {
      const unitSize = unitSizes[type];
      maxCapacity[type] = Math.floor(availableArea / unitSize);
    });
    return maxCapacity as Record<UnitTypeCode, number>;
  };

  const maxCapacity = calculateMaxCapacity();

  // Calculate current mix for display
  const currentMix = calculateUnitMix(unitCounts, unitSizes, availableArea);
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
          {WIZARD_TEXT.step2.description}
        </p>
      </div>

      {/* Available Area Summary */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-gray-600">{WIZARD_TEXT.step2.availableArea}</p>
            <p className="mt-1 text-lg font-semibold text-gray-900">
              {availableArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{WIZARD_TEXT.step2.usedArea}</p>
            <p className="mt-1 text-lg font-semibold text-blue-600">
              {currentMix.totalNetArea.toLocaleString('tr-TR', {
                maximumFractionDigits: 0,
              })}{' '}
              m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{WIZARD_TEXT.step2.remainingArea}</p>
            <p
              className={`mt-1 text-lg font-semibold ${
                remainingArea < 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {remainingArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600">{WIZARD_TEXT.step2.utilization}</p>
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

      {/* Preset Buttons */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm font-medium text-gray-700 mb-3">🎯 Hızlı Dağılım Seçenekleri:</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([key, preset]) => (
            <button
              key={key}
              onClick={() => applyPreset(key)}
              className="px-4 py-2 text-sm border border-blue-300 bg-white rounded-lg hover:bg-blue-100 hover:border-blue-400 transition-colors shadow-sm"
              title={preset.description}
            >
              <span className="mr-1">{preset.emoji}</span>
              {preset.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-600">
          Tıklayarak hızlıca yaygın dağılımları uygulayabilirsiniz
        </p>
      </div>

      {/* Maximum Capacity Info */}
      <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
        <p className="text-sm font-medium text-purple-900 mb-3">📊 Maksimum Kapasite (Her Tip için):</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {unitTypes.map((type) => (
            <div key={type} className="bg-white rounded-lg border border-purple-200 p-3 text-center">
              <p className="text-xs font-semibold text-gray-700">{type}</p>
              <p className="text-lg font-bold text-purple-600 mt-1">
                {maxCapacity[type]}
              </p>
              <p className="text-xs text-gray-500 mt-1">max daire</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-gray-600">
          💡 Maksimum kapasite: {availableArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m² NET alan ÷ daire büyüklüğü
        </p>
      </div>

      {/* Unit Mix Table */}
      <div className="overflow-hidden rounded-lg border border-gray-200">
        <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
          <p className="text-xs font-medium text-gray-700">
            Daire Dağılımı (NET {availableArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m² üzerinden)
          </p>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Tip
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Adet
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                NET m²/Daire
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                Toplam NET Alan
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                % Kullanım
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {unitTypes.map((type) => {
              const count = unitCounts[type];
              const size = unitSizes[type];
              const totalArea = count * size;
              const percentage =
                availableArea > 0 ? (totalArea / availableArea) * 100 : 0;

              return (
                <tr key={type}>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-semibold text-gray-900">{type}</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="number"
                      value={count === 0 ? '' : count}
                      onChange={(e) => handleCountChange(type, e.target.value)}
                      onBlur={(e) => handleCountBlur(type, e.target.value)}
                      min={0}
                      placeholder="0"
                      className="w-20 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {size} m²
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
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Auto-optimize Button */}
      <div className="flex justify-center">
        <button
          onClick={handleOptimize}
          className="rounded-lg border border-blue-300 bg-blue-50 px-6 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
        >
          {WIZARD_TEXT.buttons.optimize}
        </button>
      </div>
    </div>
  );
}

export default UnitMixEditor;
