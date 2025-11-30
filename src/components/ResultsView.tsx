import { useState, useMemo } from 'react';
import DatePicker from 'react-datepicker';
import { CalculationResults, ParameterOverrides } from '../types';
import { formatCurrency, formatPercentage, formatNumber } from '../utils/calculations';
import { ParametersPanel } from './ParametersPanel';
import { UnitMixEditor } from './UnitMixEditor';
import { calculateAllScenarios } from '../lib/scenarios';
import { getCostParametersForQuality } from '../data/costParameterDefaults';
import { getSalesParameters } from '../data/salesParameterDefaults';
import { getLocationData, calculateMarketIndex } from '../data/antalyaLocations';

interface ResultsViewProps {
  results: CalculationResults;
  onReset: () => void;
  onParameterChange?: (type: 'timeline' | 'cost' | 'sales', key: string, value: number | string | undefined | null) => void;
  parameterOverrides?: ParameterOverrides;
}

export function ResultsView({ results, onReset, onParameterChange, parameterOverrides }: ResultsViewProps) {
  const { inputs, timeline, costs, sales, profit } = results;
  const [showDetailedMode, setShowDetailedMode] = useState(false);

  // Calculate scenarios with memoization to prevent unnecessary recalculations
  const scenarios = useMemo(() => calculateAllScenarios(results), [results]);

  // Get parameter states
  const costParameters = getCostParametersForQuality(inputs.qualityLevel, parameterOverrides?.cost || {});
  const salesParameters = getSalesParameters(parameterOverrides?.sales || {});

  // Handlers
  const handleStartDateChange = (date: string) => onParameterChange?.('timeline', 'startDate', date);
  const handleMonthsToSellChange = (months: number) => onParameterChange?.('timeline', 'monthsToSell', months);
  const handleConstructionMonthsChange = (months: number) => onParameterChange?.('timeline', 'constructionMonths', months);
  const handleTimelineParameterChange = (key: string, value: number) => onParameterChange?.('timeline', key, value);
  const handleCostParameterChange = (id: string, value: number | null) => onParameterChange?.('cost', id, value);
  const handleSalesParameterChange = (id: string, value: number | null) => onParameterChange?.('sales', id, value);

  const resetAllParameters = () => {
    onParameterChange?.('timeline', 'monthlyInflationRate', 0.025);
    onParameterChange?.('timeline', 'monthlyAppreciationRate', 0.015);
    costParameters.forEach(param => {
      if (param.userValue !== null) handleCostParameterChange(param.id, null);
    });
    salesParameters.forEach(param => {
      if (param.userValue !== null) handleSalesParameterChange(param.id, null);
    });
  };

  // Get verdict
  const getVerdict = () => {
    if (profit.projectedMargin >= 25) return { text: 'Karlı Proje', color: 'green', icon: '✅' };
    if (profit.projectedMargin >= 10) return { text: 'Makul Karlılık', color: 'blue', icon: '📊' };
    if (profit.projectedMargin >= 0) return { text: 'Düşük Karlılık', color: 'yellow', icon: '⚠️' };
    return { text: 'Zarar Riski', color: 'red', icon: '❌' };
  };

  const verdict = getVerdict();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Proje Analizi</h2>
        <button
          onClick={onReset}
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Yeni Hesaplama
        </button>
      </div>

      {/* ==================== QUICK MODE (Always Visible) ==================== */}
      
      {/* Main Result Card - The Key Answer */}
      <div className={`rounded-xl shadow-lg p-6 border-2 ${
        verdict.color === 'green' ? 'bg-green-50 border-green-300' :
        verdict.color === 'blue' ? 'bg-blue-50 border-blue-300' :
        verdict.color === 'yellow' ? 'bg-yellow-50 border-yellow-300' :
        'bg-red-50 border-red-300'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{verdict.icon}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{verdict.text}</h3>
              <p className="text-sm text-gray-600">Gerçekçi senaryo (NPV düzeltmeli)</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600">Net Kar</p>
            <p className={`text-3xl font-bold ${profit.projectedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(profit.projectedProfit)}
            </p>
          </div>
        </div>

        {/* Key Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-xs text-gray-500">Maliyet</p>
            <p className="text-lg font-semibold text-red-600">{formatCurrency(costs.totalInflatedCost)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Satış (NPV)</p>
            <p className="text-lg font-semibold text-green-600">{formatCurrency(sales.npvAdjustedSales)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">ROI</p>
            <p className={`text-lg font-semibold ${profit.projectedROI >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatPercentage(profit.projectedROI)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Süre</p>
            <p className="text-lg font-semibold text-gray-700">
              {timeline.constructionMonths + (timeline.monthsToSell || 6)} ay
            </p>
          </div>
        </div>
      </div>

      {/* Project Summary - Compact */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
          <div>
            <span className="text-gray-500 text-xs">Lokasyon</span>
            <p className="font-medium">{inputs.location}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Alan</span>
            <p className="font-medium">{formatNumber(inputs.totalSqm)} m²</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">Tip</span>
            <p className="font-medium">{getProjectTypeLabel(inputs.projectType)}</p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">m² Maliyet</span>
            <p className="font-medium">
              {inputs.totalSqm > 0
                ? formatCurrency(costs.totalInflatedCost / inputs.totalSqm)
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs">m² Satış</span>
            <p className="font-medium">{formatCurrency(sales.currentPricePerSqm)}</p>
          </div>
        </div>
      </div>

      {/* 3 Scenarios - Quick Comparison */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Senaryo Karşılaştırması</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {scenarios.map((scenario) => (
            <div
              key={scenario.scenario}
              className={`rounded-lg p-3 text-center ${
                scenario.scenario === 'optimistic' ? 'bg-green-50 border border-green-200' :
                scenario.scenario === 'realistic' ? 'bg-blue-50 border-2 border-blue-300' :
                'bg-orange-50 border border-orange-200'
              }`}
            >
              <p className="text-xs text-gray-600 mb-1">{scenario.labelTR}</p>
              <p className={`text-lg font-bold ${scenario.profitTL >= 0 ? 'text-gray-800' : 'text-red-600'}`}>
                {formatCurrency(scenario.profitTL)}
              </p>
              <p className="text-xs text-gray-500">ROI: {formatPercentage(scenario.roiPercent)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Toggle for Detailed Mode */}
      <button
        onClick={() => setShowDetailedMode(!showDetailedMode)}
        className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 font-medium transition-colors flex items-center justify-center gap-2"
      >
        {showDetailedMode ? '▲ Detayları Gizle' : '▼ Detaylı Analiz'}
      </button>

      {/* ==================== DETAILED MODE (Expandable) ==================== */}
      {showDetailedMode && (
        <div className="space-y-6 border-t-2 border-gray-200 pt-6">
          
          {/* Timeline Editor */}
          <TimelineSection
            timeline={timeline}
            costs={costs}
            sales={sales}
            onStartDateChange={handleStartDateChange}
            onMonthsToSellChange={handleMonthsToSellChange}
            onConstructionMonthsChange={handleConstructionMonthsChange}
          />

          {/* Market Index */}
          <MarketIndexSection location={inputs.location} />

          {/* Unit Mix Editor */}
          <UnitMixEditor
            totalSqm={inputs.totalSqm}
            projectType={inputs.projectType}
            location={inputs.location}
            basePricePerSqm={sales.currentPricePerSqm}
          />

          {/* Cost Breakdown */}
          <CostBreakdownSection costs={costs} />

          {/* Sales Projection */}
          <SalesProjectionSection sales={sales} />

          {/* Parameters Panel */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-800">Tüm Parametreler</h3>
              <p className="text-xs text-gray-500">Hesaplama varsayımlarını düzenleyebilirsiniz</p>
            </div>
            <ParametersPanel
              timelineParams={{
                constructionMonths: timeline.constructionMonths,
                monthlyInflationRate: timeline.monthlyInflationRate,
                monthlyAppreciationRate: timeline.monthlyAppreciationRate,
              }}
              costParameters={costParameters}
              salesParameters={salesParameters}
              qualityLevel={inputs.qualityLevel}
              onTimelineChange={handleTimelineParameterChange}
              onCostParameterChange={handleCostParameterChange}
              onSalesParameterChange={handleSalesParameterChange}
              onResetAll={resetAllParameters}
            />
          </div>
        </div>
      )}

      {/* Disclaimer - Always visible */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-sm text-yellow-800">
        <strong>Önemli:</strong> Bu tahminler varsayılan parametrelere dayanır. 
        Yatırım kararları için profesyonel danışmanlık alınması önerilir.
      </div>
    </div>
  );
}

// Helper function
function getProjectTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    apartment: 'Apartman',
    apartment_with_pool: 'Apartman + Havuz',
    villa: 'Villa',
    villa_with_pool: 'Villa + Havuz',
    mixed: 'Karma',
    commercial: 'Ticari',
    mixed_use: 'Karma Kullanım',
  };
  return labels[type] || type;
}

// Timeline Section Component
function TimelineSection({
  timeline,
  costs,
  sales,
  onStartDateChange,
  onMonthsToSellChange,
  onConstructionMonthsChange,
}: {
  timeline: CalculationResults['timeline'];
  costs: CalculationResults['costs'];
  sales: CalculationResults['sales'];
  onStartDateChange: (date: string) => void;
  onMonthsToSellChange: (months: number) => void;
  onConstructionMonthsChange: (months: number) => void;
}) {
  const startDate = new Date(timeline.startDate);
  const completionDate = new Date(timeline.completionDate);
  const saleDate = new Date(timeline.saleDate);
  const totalMonths = timeline.constructionMonths + (timeline.monthsToSell || 6);
  const constructionProgress = (timeline.constructionMonths / totalMonths) * 100;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Proje Zaman Çizelgesi</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <label className="text-xs text-gray-600 block mb-1">Başlangıç</label>
          <DatePicker
            selected={startDate}
            onChange={(date) => date && onStartDateChange(date.toISOString().split('T')[0])}
            dateFormat="dd/MM/yyyy"
            className="w-full text-sm font-medium border-0 focus:ring-0 p-0"
          />
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <label className="text-xs text-gray-600 block mb-1">İnşaat Süresi</label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="6"
              max="36"
              value={timeline.constructionMonths}
              onChange={(e) => onConstructionMonthsChange(Number(e.target.value))}
              className="w-16 text-sm font-medium border border-gray-300 rounded px-2 py-1"
            />
            <span className="text-xs text-gray-600">ay</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{completionDate.toLocaleDateString('tr-TR')}</p>
        </div>
        <div className="bg-white rounded-lg p-3 border border-blue-200">
          <label className="text-xs text-gray-600 block mb-1">Satış Süresi</label>
          <div className="flex items-center gap-2">
            <span className="text-xs">+</span>
            <input
              type="number"
              min="0"
              max="24"
              value={timeline.monthsToSell || 6}
              onChange={(e) => onMonthsToSellChange(Number(e.target.value))}
              className="w-16 text-sm font-medium border border-gray-300 rounded px-2 py-1"
            />
            <span className="text-xs text-gray-600">ay</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">{saleDate.toLocaleDateString('tr-TR')}</p>
        </div>
      </div>

      {/* Visual Timeline */}
      <div className="relative">
        <div className="flex h-8 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${constructionProgress}%` }}
          >
            İnşaat
          </div>
          <div
            className="h-full bg-gradient-to-r from-green-400 to-green-600 flex items-center justify-center text-white text-xs font-medium"
            style={{ width: `${100 - constructionProgress}%` }}
          >
            Satış
          </div>
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>Başlangıç</span>
          <span>Tamamlanma: {formatCurrency(costs.totalInflatedCost)}</span>
          <span>Satış: {formatCurrency(sales.projectedTotalSales)}</span>
        </div>
      </div>
    </div>
  );
}

// Helper function to convert market values to visual display
function getMarketIndicator(type: 'demand' | 'supply' | 'risk', value: string): { icon: string; label: string; color: string } {
  const indicators: Record<string, Record<string, { icon: string; label: string; color: string }>> = {
    demand: {
      very_high: { icon: '🔥', label: 'Çok Yüksek', color: 'text-red-600' },
      high: { icon: '📈', label: 'Yüksek', color: 'text-orange-600' },
      medium: { icon: '➡️', label: 'Orta', color: 'text-yellow-600' },
      low: { icon: '📉', label: 'Düşük', color: 'text-gray-600' },
    },
    supply: {
      undersupply: { icon: '⬇️', label: 'Yetersiz', color: 'text-green-600' },
      balanced: { icon: '⚖️', label: 'Dengeli', color: 'text-blue-600' },
      oversupply: { icon: '⬆️', label: 'Fazla', color: 'text-red-600' },
    },
    risk: {
      low: { icon: '🛡️', label: 'Düşük', color: 'text-green-600' },
      medium: { icon: '⚠️', label: 'Orta', color: 'text-yellow-600' },
      high: { icon: '🚨', label: 'Yüksek', color: 'text-red-600' },
    },
  };
  return indicators[type]?.[value] || { icon: '❓', label: value, color: 'text-gray-500' };
}

// Market Index Section
function MarketIndexSection({ location }: { location: string }) {
  const locationData = getLocationData(location);
  if (!locationData) return null;

  const marketIndex = calculateMarketIndex(locationData);
  const indexColor = marketIndex >= 75 ? 'green' : marketIndex >= 50 ? 'blue' : marketIndex >= 25 ? 'yellow' : 'red';

  const demandIndicator = getMarketIndicator('demand', locationData.market.demandLevel);
  const supplyIndicator = getMarketIndicator('supply', locationData.market.supplyLevel);
  const riskIndicator = getMarketIndicator('risk', locationData.investment.riskLevel);

  return (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Piyasa Endeksi: {location}</h3>
        <div className={`text-2xl font-bold ${
          indexColor === 'green' ? 'text-green-600' :
          indexColor === 'blue' ? 'text-blue-600' :
          indexColor === 'yellow' ? 'text-yellow-600' : 'text-red-600'
        }`}>
          {marketIndex}/100
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-xs">
        <div className="bg-white rounded p-2 text-center">
          <span className="text-gray-500 block">Talep</span>
          <span className="text-lg">{demandIndicator.icon}</span>
          <p className={`font-medium ${demandIndicator.color}`}>{demandIndicator.label}</p>
        </div>
        <div className="bg-white rounded p-2 text-center">
          <span className="text-gray-500 block">Arz</span>
          <span className="text-lg">{supplyIndicator.icon}</span>
          <p className={`font-medium ${supplyIndicator.color}`}>{supplyIndicator.label}</p>
        </div>
        <div className="bg-white rounded p-2 text-center">
          <span className="text-gray-500 block">Büyüme</span>
          <span className="text-lg">📊</span>
          <p className="font-medium text-blue-600">%{locationData.market.priceGrowthTrend}/yıl</p>
        </div>
        <div className="bg-white rounded p-2 text-center">
          <span className="text-gray-500 block">Risk</span>
          <span className="text-lg">{riskIndicator.icon}</span>
          <p className={`font-medium ${riskIndicator.color}`}>{riskIndicator.label}</p>
        </div>
      </div>
    </div>
  );
}

// Cost Breakdown Section with Inflation Explanation
function CostBreakdownSection({ 
  costs,
}: { 
  costs: CalculationResults['costs'];
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Maliyet Dağılımı</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">İnşaat Maliyeti:</span>
          <span className="font-medium">{formatCurrency(costs.constructionCost)}</span>
        </div>
        {costs.landCost > 0 && (
          <div className="flex justify-between border-b pb-2">
            <span className="text-gray-600">Arsa Maliyeti:</span>
            <span className="font-medium">{formatCurrency(costs.landCost)}</span>
          </div>
        )}
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">İzinler ve Harçlar:</span>
          <span className="font-medium">{formatCurrency(costs.permitsAndFees)}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Tasarım:</span>
          <span className="font-medium">{formatCurrency(costs.design)}</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Yedek (Contingency):</span>
          <span className="font-medium">{formatCurrency(costs.contingency)}</span>
        </div>
        
        {/* Inflation Impact Explanation */}
        <div className="bg-red-50 rounded p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-red-700 bg-red-100 px-2 py-1 rounded">📊 Enflasyon Etkisi</span>
          </div>
          <div className="bg-white rounded p-2 mb-2 text-xs text-gray-600">
            <p className="mb-1">
              <strong>Neden Enflasyon Ekleniyor?</strong>
            </p>
            <p>
              İnşaat maliyetleri proje süresince artacaktır. S-eğrisi modeli ile 
              harcamaların zamanlamasına göre enflasyon etkisi hesaplanır.
            </p>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Nominal Maliyet (bugünkü fiyatlarla):</span>
            <span>{formatCurrency(costs.totalNominalCost)}</span>
          </div>
          <div className="flex justify-between text-red-600">
            <span>Enflasyon Etkisi (+{formatPercentage(costs.inflationImpactPercent)}):</span>
            <span>+{formatCurrency(costs.inflationImpactTL)}</span>
          </div>
          <div className="flex justify-between font-bold text-red-700 pt-2 border-t border-red-200 mt-2">
            <span>GERÇEK MALİYET (enflasyonlu):</span>
            <span>{formatCurrency(costs.totalInflatedCost)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Arsa maliyeti başlangıçta ödenir, bu nedenle enflasyondan etkilenmez.
          </p>
        </div>
      </div>
    </div>
  );
}

// Sales Projection Section with NPV Explanation
function SalesProjectionSection({ sales }: { sales: CalculationResults['sales'] }) {
  // Calculate the annual discount rate for display (from monthly)
  const monthlyDiscountRate = 0.01; // 1% monthly default
  const annualDiscountRate = (Math.pow(1 + monthlyDiscountRate, 12) - 1) * 100;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Satış Tahmini</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Tahmini Ünite:</span>
          <span className="font-medium">{sales.estimatedUnits} adet</span>
        </div>
        <div className="flex justify-between border-b pb-2">
          <span className="text-gray-600">Güncel m² Fiyatı:</span>
          <span className="font-medium">{formatCurrency(sales.currentPricePerSqm)}/m²</span>
        </div>
        
        {/* Current to Future Value */}
        <div className="bg-green-50 rounded p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded">📈 Fiyat Artışı</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-700">Bugünkü Piyasa Değeri:</span>
            <span>{formatCurrency(sales.currentTotalSales)}</span>
          </div>
          <div className="flex justify-between text-green-600">
            <span>{sales.monthsUntilSale} ay sonra (+{formatPercentage(sales.appreciationImpactPercent)}):</span>
            <span>+{formatCurrency(sales.projectedTotalSales - sales.currentTotalSales)}</span>
          </div>
          <div className="flex justify-between font-bold text-green-700 pt-2 border-t border-green-200 mt-2">
            <span>GELECEKTEKİ SATIŞ DEĞERİ:</span>
            <span>{formatCurrency(sales.projectedTotalSales)}</span>
          </div>
        </div>
        
        {/* NPV Explanation */}
        <div className="bg-blue-50 rounded p-3 mt-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2 py-1 rounded">💵 NPV</span>
            <span className="text-xs text-gray-600">Net Bugünkü Değer</span>
          </div>
          <div className="bg-white rounded p-2 mb-2 text-xs text-gray-600">
            <p className="mb-1">
              <strong>NPV Nedir?</strong> Gelecekte alacağınız paranın bugünkü değeridir.
            </p>
            <p>
              Bugün 100 TL, 1 yıl sonra alacağınız 100 TL'den daha değerlidir çünkü:
              • Bugün yatırıma koyabilirsiniz
              • Enflasyon paranın değerini düşürür
              • Risk faktörü vardır
            </p>
          </div>
          <div className="flex justify-between text-gray-600 text-xs mb-1">
            <span>İskonto Oranı:</span>
            <span>~{annualDiscountRate.toFixed(1)}%/yıl (1%/ay)</span>
          </div>
          <div className="flex justify-between text-orange-600">
            <span className="text-sm">Zaman Değeri İskontosu:</span>
            <span>-{formatCurrency(sales.timeValueLoss)}</span>
          </div>
          <div className="flex justify-between font-bold text-blue-700 pt-2 border-t border-blue-200 mt-2">
            <span>BUGÜNKÜ DEĞER (NPV):</span>
            <span>{formatCurrency(sales.npvAdjustedSales)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 italic">
            Kar hesabında NPV kullanılır çünkü bugün yaptığınız yatırımı bugünkü değerlerle karşılaştırmalısınız.
          </p>
        </div>
      </div>
    </div>
  );
}

