/**
 * Cost & Pricing Step Component
 *
 * Step 3: Configure construction quality and sale prices
 */

import React, { useState, useEffect } from 'react';
import type {
  UnitMix,
  PricingConfig,
  ConstructionQuality,
  UnitTypeCode,
  UnitPricing,
} from '../../types/feasibility';
import { QUALITY_TIERS, WIZARD_TEXT } from '../../types/feasibility';

export interface CostPricingStepProps {
  unitMix: UnitMix;
  district: string;
  onPricingChange: (pricing: PricingConfig) => void;
}

/**
 * District-based default sale prices (TL/m²)
 * Based on Phase 1 data
 */
const DISTRICT_BASE_PRICES: Record<string, number> = {
  kepez: 38000,
  muratpasa: 42000,
  konyaalti: 40000,
  default: 40000,
};

/**
 * Unit type price multipliers (relative to base)
 */
const UNIT_PRICE_MULTIPLIERS: Record<UnitTypeCode, number> = {
  '1+1': 1.07, // +7% premium for small units (investor demand)
  '2+1': 1.0, // Base price
  '3+1': 0.95, // -5% (larger units)
  '4+1': 0.90, // -10% (very large units)
  '5+1': 0.85, // -15% (rare, very large)
};

/**
 * CostPricingStep Component
 */
export function CostPricingStep({
  unitMix,
  district,
  onPricingChange,
}: CostPricingStepProps): JSX.Element {
  const [selectedQuality, setSelectedQuality] =
    useState<ConstructionQuality>('mid');

  const [salePrices, setSalePrices] = useState<Record<UnitTypeCode, number>>(
    () => getDefaultPrices(district)
  );

  // Update pricing config whenever quality or prices change
  useEffect(() => {
    const config: PricingConfig = {
      constructionQuality: selectedQuality,
      constructionCostPerM2: QUALITY_TIERS[selectedQuality].costPerM2,
      salePrices,
    };
    onPricingChange(config);
  }, [selectedQuality, salePrices, onPricingChange]);

  /**
   * Get default sale prices for district
   */
  function getDefaultPrices(districtName: string): Record<UnitTypeCode, number> {
    const basePrice =
      DISTRICT_BASE_PRICES[districtName.toLowerCase()] ||
      DISTRICT_BASE_PRICES.default;

    const prices: Partial<Record<UnitTypeCode, number>> = {};
    (['1+1', '2+1', '3+1', '4+1', '5+1'] as UnitTypeCode[]).forEach((type) => {
      prices[type] = Math.round(basePrice * UNIT_PRICE_MULTIPLIERS[type]);
    });

    return prices as Record<UnitTypeCode, number>;
  }

  /**
   * Handle quality selection
   */
  const handleQualityChange = (quality: ConstructionQuality) => {
    setSelectedQuality(quality);
  };

  /**
   * Handle price change for a unit type
   */
  const handlePriceChange = (type: UnitTypeCode, value: string) => {
    const price = parseFloat(value) || 0;
    setSalePrices((prev) => ({
      ...prev,
      [type]: price,
    }));
  };

  /**
   * Calculate unit pricing details
   */
  function calculateUnitPricing(): UnitPricing[] {
    return unitMix.units.map((unit) => {
      const pricePerM2 = salePrices[unit.type];
      const unitPrice = unit.netArea * pricePerM2;
      const totalRevenue = unitPrice * unit.count;

      return {
        type: unit.type,
        count: unit.count,
        netArea: unit.netArea,
        pricePerM2,
        unitPrice,
        totalRevenue,
      };
    });
  }

  const unitPricing = calculateUnitPricing();
  const totalConstructionCost =
    unitMix.totalGrossArea * QUALITY_TIERS[selectedQuality].costPerM2;
  const totalRevenue = unitPricing.reduce((sum, u) => sum + u.totalRevenue, 0);
  const grossProfit = totalRevenue - totalConstructionCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const districtBasePrice =
    DISTRICT_BASE_PRICES[district.toLowerCase()] || DISTRICT_BASE_PRICES.default;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {WIZARD_TEXT.step3.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {WIZARD_TEXT.step3.description}
        </p>
      </div>

      {/* Construction Quality Selection */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-base font-semibold text-gray-900">
          {WIZARD_TEXT.step3.quality}
        </h4>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {(Object.keys(QUALITY_TIERS) as ConstructionQuality[]).map((quality) => {
            const tier = QUALITY_TIERS[quality];
            const isSelected = selectedQuality === quality;

            return (
              <button
                key={quality}
                onClick={() => handleQualityChange(quality)}
                className={`rounded-lg border-2 p-4 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-semibold text-gray-900">{tier.name}</h5>
                  {isSelected && (
                    <svg
                      className="h-5 w-5 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-600">{tier.description}</p>
                <p className="mt-2 text-lg font-bold text-blue-600">
                  {tier.costPerM2.toLocaleString('tr-TR')} TL/m²
                </p>
              </button>
            );
          })}
        </div>

        {/* Construction Cost Summary */}
        <div className="mt-4 rounded-lg bg-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                {WIZARD_TEXT.step3.constructionCost}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {unitMix.totalGrossArea.toLocaleString('tr-TR', {
                  maximumFractionDigits: 0,
                })}{' '}
                m² × {QUALITY_TIERS[selectedQuality].costPerM2.toLocaleString('tr-TR')}{' '}
                TL/m²
              </p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {(totalConstructionCost / 1000000).toFixed(1)}M TL
            </p>
          </div>
        </div>
      </div>

      {/* Sale Prices */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h4 className="text-base font-semibold text-gray-900">
            {WIZARD_TEXT.step3.salePrices}
          </h4>
          <span className="text-sm text-gray-600">
            {WIZARD_TEXT.step3.districtAverage}:{' '}
            <span className="font-semibold text-blue-600">
              {districtBasePrice.toLocaleString('tr-TR')} TL/m²
            </span>
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-lg border border-gray-200">
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
                  m²/Birim
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Fiyat/m²
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Birim Fiyat
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Toplam Gelir
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {unitPricing.map((unit) => (
                <tr key={unit.type}>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                    {unit.type}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {unit.count}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-700">
                    {unit.netArea} m²
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <input
                      type="number"
                      value={unit.pricePerM2}
                      onChange={(e) =>
                        handlePriceChange(unit.type, e.target.value)
                      }
                      className="w-28 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-medium text-gray-900">
                      {(unit.unitPrice / 1000000).toFixed(2)}M
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-blue-600">
                      {(unit.totalRevenue / 1000000).toFixed(2)}M
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right font-semibold text-gray-900"
                >
                  Toplam Gelir:
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="font-mono text-lg font-bold text-blue-600">
                    {(totalRevenue / 1000000).toFixed(1)}M TL
                  </span>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Quick Summary */}
      <div className="rounded-lg border border-green-200 bg-green-50 p-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-green-700">Toplam Maliyet</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-900">
              {(totalConstructionCost / 1000000).toFixed(1)}M TL
            </p>
          </div>
          <div>
            <p className="text-xs text-green-700">Toplam Gelir</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-900">
              {(totalRevenue / 1000000).toFixed(1)}M TL
            </p>
          </div>
          <div>
            <p className="text-xs text-green-700">Brüt Kar Marjı</p>
            <p className="mt-1 font-mono text-lg font-semibold text-green-900">
              {margin.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostPricingStep;
