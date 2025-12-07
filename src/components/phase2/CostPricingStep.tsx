/**
 * Cost & Pricing Step Component
 *
 * Step 3: Configure construction costs and sale prices
 */

import { useState, useEffect } from 'react';
import type {
  UnitMix,
  PricingConfig,
  UnitTypeCode,
  UnitPricing,
  ParselImarData,
} from '../../types/feasibility';
import { QUALITY_TIERS, WIZARD_TEXT } from '../../types/feasibility';
import { CostBreakdownEditor, CostBreakdownData } from './CostBreakdownEditor';

export interface CostPricingStepProps {
  step1Data: ParselImarData;
  unitMix: UnitMix;
  district: string;
  onPricingChange: (pricing: PricingConfig) => void;
}

/**
 * District-based default sale prices (TL/m² NET area)
 * Based on 2024-2025 Antalya market data
 * NEW CONSTRUCTION PRICES (not resale)
 */
const DISTRICT_BASE_PRICES: Record<string, number> = {
  kepez: 45000,       // Budget/developing area
  doseмealtı: 40000,  // Suburban
  muratpasa: 65000,   // City center
  konyaalti: 85000,   // Premium beach district
  lara: 95000,        // Luxury resort area
  alanya: 55000,      // Resort town
  default: 65000,     // Default to mid-range
};

/**
 * Unit type price multipliers (relative to base)
 * Phase 3.2: Added 1+0 with highest multiplier (small units, high demand)
 */
const UNIT_PRICE_MULTIPLIERS: Record<UnitTypeCode, number> = {
  '1+0': 1.12, // +12% premium (smallest, highest ROI, investor favorite)
  '1+1': 1.07, // +7% premium for small units (investor demand)
  '2+1': 1.0,  // Base price
  '3+1': 0.95, // -5% (larger units)
  '4+1': 0.90, // -10% (very large units)
  '5+1': 0.85, // -15% (rare, very large)
};

/**
 * CostPricingStep Component
 */
export function CostPricingStep({
  step1Data,
  unitMix,
  district,
  onPricingChange,
}: CostPricingStepProps): JSX.Element {
  const [salePrices, setSalePrices] = useState<Record<UnitTypeCode, number>>(
    () => getDefaultPrices(district)
  );

  // State for cost breakdown
  const [costBreakdown, setCostBreakdown] = useState<CostBreakdownData | null>(null);

  // State for land cost (Phase 3.3)
  const [landCost, setLandCost] = useState<number>(0);

  // State for common area costs
  const [includeCommonAreas, setIncludeCommonAreas] = useState(false);
  const [commonAreaPercent, setCommonAreaPercent] = useState(15);
  const [commonAreaMultiplier, setCommonAreaMultiplier] = useState(1.5);

  // Update pricing config whenever cost breakdown, land cost, or prices change
  useEffect(() => {
    // Use cost breakdown if available, otherwise fallback to default mid-tier
    const costPerM2 = costBreakdown
      ? costBreakdown.totalCostPerM2
      : QUALITY_TIERS.mid.costPerM2;

    const config: PricingConfig = {
      constructionQuality: 'mid', // Default to mid quality
      constructionCostPerM2: costPerM2,
      landCost: landCost > 0 ? landCost : undefined, // Only include if > 0
      salePrices,
    };
    onPricingChange(config);
  }, [costBreakdown, landCost, salePrices, onPricingChange]);

  /**
   * Get default sale prices for district
   */
  function getDefaultPrices(districtName: string): Record<UnitTypeCode, number> {
    const basePrice =
      DISTRICT_BASE_PRICES[districtName.toLowerCase()] ||
      DISTRICT_BASE_PRICES.default;

    const prices: Partial<Record<UnitTypeCode, number>> = {};
    (['1+0', '1+1', '2+1', '3+1', '4+1', '5+1'] as UnitTypeCode[]).forEach((type) => {
      prices[type] = Math.round(basePrice * UNIT_PRICE_MULTIPLIERS[type]);
    });

    return prices as Record<UnitTypeCode, number>;
  }

  /**
   * Handle price change for a unit type
   */
  const handlePriceChange = (type: UnitTypeCode, value: string) => {
    // Allow empty string for better UX
    if (value === '') {
      setSalePrices((prev) => ({
        ...prev,
        [type]: 0,
      }));
      return;
    }

    const price = parseFloat(value);
    if (!isNaN(price) && price >= 0) {
      setSalePrices((prev) => ({
        ...prev,
        [type]: price,
      }));
    }
  };

  /**
   * Handle price blur - restore district default if empty
   */
  const handlePriceBlur = (type: UnitTypeCode, value: string) => {
    if (value === '' || isNaN(parseFloat(value))) {
      // Restore district default price
      const basePrice =
        DISTRICT_BASE_PRICES[district.toLowerCase()] ||
        DISTRICT_BASE_PRICES.default;
      const defaultPrice = Math.round(basePrice * UNIT_PRICE_MULTIPLIERS[type]);

      setSalePrices((prev) => ({
        ...prev,
        [type]: defaultPrice,
      }));
    }
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

  // Construction cost is now calculated on GROSS area by CostBreakdownEditor
  // Use the total from cost breakdown, which already includes all categories
  const grossArea = step1Data.zoningResult.toplamInsaatAlani;
  const costPerM2Gross = costBreakdown
    ? costBreakdown.totalCostPerM2
    : QUALITY_TIERS.mid.costPerM2;

  // Base construction cost from cost breakdown (on GROSS area)
  const baseConstructionCost = costBreakdown
    ? costBreakdown.totalCost
    : grossArea * QUALITY_TIERS.mid.costPerM2;

  // Optional: Additional common area premium (luxury finishes in lobbies, etc.)
  // This is ON TOP of the base construction cost for extra quality in common areas
  const commonAreaM2 = unitMix.totalNetArea * (commonAreaPercent / 100);
  const commonAreaPremiumPerM2 = costPerM2Gross * (commonAreaMultiplier - 1); // Extra cost
  const commonAreaPremium = includeCommonAreas ? commonAreaM2 * commonAreaPremiumPerM2 : 0;

  // Total construction cost = base + optional common area premium
  const totalConstructionCost = baseConstructionCost + commonAreaPremium;

  const totalRevenue = unitPricing.reduce((sum, u) => sum + u.totalRevenue, 0);
  const grossProfit = totalRevenue - totalConstructionCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Per-m² calculations for display (show per GROSS m² for cost, per NET m² for revenue)
  const totalConstructionCostPerM2 = grossArea > 0
    ? totalConstructionCost / grossArea
    : costPerM2Gross;
  const averageRevenuePerM2 = unitMix.totalNetArea > 0
    ? totalRevenue / unitMix.totalNetArea
    : 0;

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

      {/* Step 1 Data Summary - Phase 3.3 Fix: Show parsel/İmar data for transparency */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">📋 Proje Bilgileri</h4>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <span className="text-gray-500">Parsel Alanı:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {step1Data.parselData.parselAlani.toLocaleString('tr-TR')} m²
            </span>
          </div>
          <div>
            <span className="text-gray-500">TAKS:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {step1Data.imarParams.taks.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">KAKS:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {step1Data.imarParams.kaks.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Çıkma:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {(step1Data.imarParams.cikmaKatsayisi ?? 1.0).toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Toplam İnşaat:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {step1Data.zoningResult.toplamInsaatAlani.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </span>
          </div>
          <div>
            <span className="text-gray-500">Net Alan:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {step1Data.zoningResult.netKullanimAlani.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
            </span>
          </div>
          <div>
            <span className="text-gray-500">Toplam Daire:</span>
            <span className="ml-2 font-semibold text-gray-900">
              {unitMix.totalUnits} adet
            </span>
          </div>
          <div>
            <span className="text-gray-500">İlçe:</span>
            <span className="ml-2 font-semibold text-gray-900 capitalize">
              {district}
            </span>
          </div>
        </div>
      </div>

      {/* Cost Breakdown Editor - Expandable Categories */}
      <CostBreakdownEditor
        grossArea={step1Data.zoningResult.toplamInsaatAlani}
        netArea={unitMix.totalNetArea}
        onCostChange={setCostBreakdown}
      />

      {/* Land Cost Input - Phase 3.3 */}
      <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🏞️</span>
          <div className="flex-1">
            <label htmlFor="landCost" className="block text-base font-semibold text-gray-900">
              Arsa Maliyeti
            </label>
            <p className="mt-1 text-xs text-gray-600 mb-3">
              Arsanın toplam satın alma maliyetini girin (Tapu harçları ve komisyon dahil)
            </p>
            <div className="relative">
              <input
                type="number"
                id="landCost"
                value={landCost || ''}
                onChange={(e) => setLandCost(Number(e.target.value) || 0)}
                placeholder="örn: 5000000"
                min="0"
                step="100000"
                className="block w-full rounded-lg border-gray-300 px-4 py-2.5 pr-12 shadow-sm focus:border-orange-500 focus:ring-orange-500"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">₺</span>
            </div>
            {landCost > 0 && (
              <p className="mt-2 text-sm font-medium text-orange-800">
                Arsa Maliyeti: {landCost.toLocaleString('tr-TR')} ₺
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Common Area Premium - Optional Feature */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="includeCommonAreas"
            checked={includeCommonAreas}
            onChange={(e) => setIncludeCommonAreas(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <div className="flex-1">
            <label htmlFor="includeCommonAreas" className="cursor-pointer">
              <h4 className="text-base font-semibold text-gray-900">
                🏛️ Lüks Ortak Alan Primi Ekle
              </h4>
              <p className="mt-1 text-xs text-gray-600">
                Lobiler, koridorlar, fitness, sauna gibi ortak alanlara ekstra lüks bitirme maliyeti ekleyin (temel maliyet zaten yukarıda dahil)
              </p>
            </label>

            {includeCommonAreas && (
              <div className="mt-4 space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
                {/* Percentage Slider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ortak Alan Oranı: {commonAreaPercent}%
                  </label>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-xs text-gray-500">5%</span>
                    <input
                      type="range"
                      min="5"
                      max="30"
                      step="1"
                      value={commonAreaPercent}
                      onChange={(e) => setCommonAreaPercent(Number(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs text-gray-500">30%</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    NET alana göre ortak alan yüzdesi ({commonAreaM2.toFixed(0)} m²)
                  </p>
                </div>

                {/* Multiplier Dropdown */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ortak Alan Maliyet Çarpanı
                  </label>
                  <select
                    value={commonAreaMultiplier}
                    onChange={(e) => setCommonAreaMultiplier(Number(e.target.value))}
                    className="mt-2 block w-full rounded-md border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="1.2">1.2x - Temel (Basit lobi + koridorlar)</option>
                    <option value="1.5">1.5x - Orta (İyi lobi + fitness)</option>
                    <option value="1.8">1.8x - Lüks (Geniş amenities + premium bitirme)</option>
                    <option value="2.0">2.0x - Ultra Lüks (Spa, havuz, sanat eserleri)</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Ortak alanlara eklenecek prim çarpanı (Ek maliyet: {commonAreaPremiumPerM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/m²)
                  </p>
                </div>

                {/* Live Preview */}
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3">
                  <h5 className="text-xs font-semibold text-blue-900">📊 Maliyet Önizleme</h5>
                  <div className="mt-2 space-y-1 text-xs text-blue-800">
                    <div className="flex justify-between">
                      <span>Temel İnşaat Maliyeti ({grossArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²):</span>
                      <span className="font-semibold">
                        {baseConstructionCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>+ Ortak Alan Primi ({commonAreaM2.toFixed(0)} m² × {commonAreaPremiumPerM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/m²):</span>
                      <span className="font-semibold">
                        {commonAreaPremium.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                      </span>
                    </div>
                    <div className="border-t border-blue-300 pt-1 mt-1 flex justify-between font-bold">
                      <span>= TOPLAM MALİYET:</span>
                      <span className="text-blue-900">
                        {totalConstructionCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
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
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
            <p className="text-xs font-medium text-gray-700">
              Satış Fiyatlandırması (NET m² bazında)
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
                  NET m²
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  m² Satış Fiyatı
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Daire Fiyatı
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Toplam
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
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        value={unit.pricePerM2 === 0 ? '' : unit.pricePerM2}
                        onChange={(e) =>
                          handlePriceChange(unit.type, e.target.value)
                        }
                        onBlur={(e) =>
                          handlePriceBlur(unit.type, e.target.value)
                        }
                        min={0}
                        step={1000}
                        placeholder="0"
                        className="w-28 rounded border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-500">₺/m²</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm font-medium text-gray-900">
                      {unit.unitPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className="text-sm font-semibold text-blue-600">
                      {unit.totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-3 text-right text-sm font-semibold text-gray-900"
                >
                  Toplam Satış Geliri:
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="text-lg font-bold text-blue-600">
                    {totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
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
            <p className="text-xs font-medium text-green-700">💰 Toplam İnşaat Maliyeti</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {totalConstructionCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
            </p>
            <div className="mt-1 text-xs text-green-600 space-y-0.5">
              <div>{grossArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m² × {totalConstructionCostPerM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/m²</div>
              {includeCommonAreas && commonAreaPremium > 0 && (
                <div className="text-green-500">+ Ortak alan primi: {commonAreaPremium.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺</div>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-green-700">📈 Toplam Satış Geliri</p>
            <p className="mt-1 text-2xl font-bold text-green-900">
              {totalRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
            </p>
            <p className="mt-1 text-xs text-green-600">
              NET {unitMix.totalNetArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m² × {averageRevenuePerM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/m²
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-green-700">💵 Tahmini Kar</p>
            <p className={`mt-1 text-2xl font-bold ${grossProfit >= 0 ? 'text-green-900' : 'text-red-600'}`}>
              {grossProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
            </p>
            <p className={`mt-1 text-xs ${grossProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>
              Kar Marjı: {margin.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostPricingStep;
