/**
 * Financial Summary Component
 *
 * Step 4: Display comprehensive financial analysis with NPV and scenarios
 */

import { useState, useEffect } from 'react';
import { useFeasibility } from '../../context/FeasibilityContext';
import { useProjectStorage } from '../../hooks/useProjectStorage';
import { wizardStateToProject } from '../../utils/projectConverter';
import { generateFeasibilityPDF } from '../../services/pdfExport';
import type {
  ParselImarData,
  UnitMix,
  PricingConfig,
  FinancialResult,
} from '../../types/feasibility';
import { WIZARD_TEXT } from '../../types/feasibility';

export interface FinancialSummaryProps {
  step1Data: ParselImarData;
  step2Data: UnitMix;
  step3Data: PricingConfig;
  onResultChange: (result: FinancialResult) => void;
}

/**
 * FinancialSummary Component
 */
export function FinancialSummary({
  step1Data,
  step2Data,
  step3Data,
  onResultChange,
}: FinancialSummaryProps): JSX.Element {
  const { state, currentProjectId } = useFeasibility();
  const { getProject } = useProjectStorage();
  const [financialResult, setFinancialResult] = useState<FinancialResult | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Calculate financial metrics on mount or when inputs change
  useEffect(() => {
    calculateFinancials();
  }, [step1Data, step2Data, step3Data]);

  /**
   * Calculate comprehensive financial analysis
   */
  async function calculateFinancials() {
    setIsCalculating(true);

    try {
      const { totalNetArea } = step2Data; // USE NET AREA for both cost and revenue
      const { constructionCostPerM2, salePrices } = step3Data;

      // Calculate total construction cost (FIXED: use NET area, not GROSS)
      // Per user requirement: "for simplicity, this app uses NET usable area for both"
      const totalConstructionCost = totalNetArea * constructionCostPerM2;

      // Calculate total revenue from unit mix
      const totalRevenue = step2Data.units.reduce((sum, unit) => {
        const pricePerM2 = salePrices[unit.type];
        const unitRevenue = unit.netArea * unit.count * pricePerM2;
        return sum + unitRevenue;
      }, 0);

      // Basic profit metrics
      const grossProfit = totalRevenue - totalConstructionCost;
      const profitMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;
      const roi = totalConstructionCost > 0 ? (grossProfit / totalConstructionCost) * 100 : 0;

      // Estimate timeline for NPV calculation (simplified)
      // For apartments: 18 months construction + 6 months to sell
      const totalMonths = 24;

      // NPV-adjusted revenue (1% monthly discount rate)
      const discountRate = 0.01;
      const npvAdjustedRevenue = totalRevenue / Math.pow(1 + discountRate, totalMonths);
      const npvProfit = npvAdjustedRevenue - totalConstructionCost;
      const npvROI = totalConstructionCost > 0 ? (npvProfit / totalConstructionCost) * 100 : 0;

      const result: FinancialResult = {
        totalConstructionCost,
        totalCost: totalConstructionCost,
        totalRevenue: npvAdjustedRevenue,
        grossProfit: npvProfit,
        profitMargin: profitMargin * 100,
        roi,
        npvAdjustedRevenue,
        npvProfit,
        npvROI,
      };

      setFinancialResult(result);
      onResultChange(result);
    } catch (error) {
      console.error('Financial calculation error:', error);
    } finally {
      setIsCalculating(false);
    }
  }

  /**
   * Handle PDF export
   */
  async function handleExportPDF() {
    if (!financialResult) return;

    setIsExporting(true);
    try {
      // Get or create project from current state
      let project;
      if (currentProjectId) {
        project = getProject(currentProjectId);
      }

      if (!project) {
        // Create temporary project from current wizard state
        project = wizardStateToProject(state);
      }

      // Generate PDF
      await generateFeasibilityPDF(project, financialResult);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('PDF oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsExporting(false);
    }
  }

  if (isCalculating || !financialResult) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="text-sm text-gray-600">Finansal analiz hesaplanıyor...</p>
        </div>
      </div>
    );
  }

  // Calculate per-m² values for display
  const totalConstructionCostPerM2 = step2Data.totalNetArea > 0
    ? financialResult.totalConstructionCost / step2Data.totalNetArea
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {WIZARD_TEXT.step4.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          Proje finansal özeti - Tüm değerler zaman değeri (NPV) ile düzeltilmiştir.
        </p>
      </div>

      {/* Key Metrics Summary - BIG 4-CARD DISPLAY */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border-2 border-gray-300 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-600">💰 Toplam Maliyet</p>
          <p className="mt-3 text-2xl font-bold text-gray-900">
            {financialResult.totalConstructionCost.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </p>
          <p className="mt-2 text-xs text-gray-500">
            ({totalConstructionCostPerM2.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺/m²)
          </p>
        </div>
        <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-6 shadow-sm">
          <p className="text-sm font-medium text-blue-700">📈 Toplam Satış Geliri</p>
          <p className="mt-3 text-2xl font-bold text-blue-600">
            {financialResult.npvAdjustedRevenue.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </p>
          <p className="mt-2 text-xs text-blue-500">
            (NPV düzeltmeli)
          </p>
        </div>
        <div className={`rounded-lg border-2 p-6 shadow-sm ${
          financialResult.npvProfit > 0
            ? 'border-green-300 bg-green-50'
            : 'border-red-300 bg-red-50'
        }`}>
          <p className={`text-sm font-medium ${
            financialResult.npvProfit > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            ✨ Net Kar
          </p>
          <p className={`mt-3 text-2xl font-bold ${
            financialResult.npvProfit > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {financialResult.npvProfit.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} ₺
          </p>
          <p className={`mt-2 text-xs ${
            financialResult.npvProfit > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            (NPV düzeltmeli)
          </p>
        </div>
        <div className={`rounded-lg border-2 p-6 shadow-sm ${
          financialResult.profitMargin > 0
            ? 'border-green-300 bg-green-50'
            : 'border-red-300 bg-red-50'
        }`}>
          <p className={`text-sm font-medium ${
            financialResult.profitMargin > 0 ? 'text-green-700' : 'text-red-700'
          }`}>
            📊 Kar Marjı
          </p>
          <p className={`mt-3 text-2xl font-bold ${
            financialResult.profitMargin > 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {financialResult.profitMargin.toFixed(0)}%
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          Ek Metrikler
        </h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-sm text-gray-600">ROI (Yatırım Getirisi)</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              {financialResult.roi.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-sm text-gray-600">NPV ROI</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              {financialResult.npvROI.toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-sm text-gray-600">Proje Süresi</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              24 ay
            </span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-2">
            <span className="text-sm text-gray-600">NPV İskonto Oranı</span>
            <span className="font-mono text-sm font-semibold text-gray-900">
              1% / ay
            </span>
          </div>
        </div>
      </div>

      {/* NPV Explanation */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex">
          <svg
            className="h-5 w-5 text-yellow-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">NPV Nedir?</h3>
            <p className="mt-2 text-sm text-yellow-700">
              Net Bugünkü Değer (NPV), gelecekteki gelirlerin bugünkü değerini
              hesaplar. Paranın zaman değerini dikkate alır - bugünkü 1M TL,
              gelecekteki 1M TL'den daha değerlidir. Bu hesaplamada %1 aylık
              iskonto oranı kullanılmıştır.
            </p>
          </div>
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExportPDF}
          disabled={isExporting}
          className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <svg
                className="mr-2 h-4 w-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Oluşturuluyor...
            </>
          ) : (
            WIZARD_TEXT.buttons.export
          )}
        </button>
      </div>
    </div>
  );
}

export default FinancialSummary;
