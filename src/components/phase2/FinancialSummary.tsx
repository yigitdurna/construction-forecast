/**
 * Financial Summary Component
 *
 * Step 4: Display comprehensive financial analysis with NPV and scenarios
 */

import React, { useState, useEffect } from 'react';
import type {
  ParselImarData,
  UnitMix,
  PricingConfig,
  FinancialResult,
  ScenarioResult,
} from '../../types/feasibility';
import { WIZARD_TEXT } from '../../types/feasibility';
import {
  calculateProjectCosts,
  calculateFutureSalesPrice,
  calculateInflationAdjustedCosts,
  getDefaultTimeline,
} from '../../utils/calculations';
import { calculateAllScenarios } from '../../lib/scenarios';

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
  const [financialResult, setFinancialResult] = useState<FinancialResult | null>(
    null
  );
  const [isCalculating, setIsCalculating] = useState(false);

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
      const { parselData, zoningResult } = step1Data;
      const { totalGrossArea, totalNetArea } = step2Data;
      const { constructionCostPerM2, salePrices } = step3Data;

      // Calculate total construction cost
      const totalConstructionCost = totalGrossArea * constructionCostPerM2;

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

      // Get default timeline for NPV calculation
      const timeline = getDefaultTimeline('Apartman', totalGrossArea);
      const totalMonths = timeline.constructionMonths + timeline.monthsToSell;

      // NPV-adjusted revenue (1% monthly discount rate)
      const discountRate = 0.01;
      const npvAdjustedRevenue = totalRevenue / Math.pow(1 + discountRate, totalMonths);
      const npvProfit = npvAdjustedRevenue - totalConstructionCost;
      const npvROI = totalConstructionCost > 0 ? (npvProfit / totalConstructionCost) * 100 : 0;

      // Calculate scenarios
      const baseScenario: ScenarioResult = {
        name: 'Gerçekçi',
        totalCost: totalConstructionCost,
        totalRevenue: npvAdjustedRevenue,
        profit: npvProfit,
        margin: profitMargin * 100,
        roi,
        npvProfit,
        npvROI,
      };

      // Optimistic scenario (+8% revenue, -8% cost)
      const optimisticRevenue = totalRevenue * 1.08;
      const optimisticCost = totalConstructionCost * 0.92;
      const optimisticNPV = optimisticRevenue / Math.pow(1 + discountRate, totalMonths);
      const optimisticProfit = optimisticNPV - optimisticCost;
      const optimisticScenario: ScenarioResult = {
        name: 'İyimser',
        totalCost: optimisticCost,
        totalRevenue: optimisticNPV,
        profit: optimisticProfit,
        margin: optimisticNPV > 0 ? (optimisticProfit / optimisticNPV) * 100 : 0,
        roi: optimisticCost > 0 ? (optimisticProfit / optimisticCost) * 100 : 0,
        npvProfit: optimisticProfit,
        npvROI: optimisticCost > 0 ? (optimisticProfit / optimisticCost) * 100 : 0,
      };

      // Pessimistic scenario (-8% revenue, +15% cost)
      const pessimisticRevenue = totalRevenue * 0.92;
      const pessimisticCost = totalConstructionCost * 1.15;
      const pessimisticNPV = pessimisticRevenue / Math.pow(1 + discountRate, totalMonths);
      const pessimisticProfit = pessimisticNPV - pessimisticCost;
      const pessimisticScenario: ScenarioResult = {
        name: 'Kötümser',
        totalCost: pessimisticCost,
        totalRevenue: pessimisticNPV,
        profit: pessimisticProfit,
        margin: pessimisticNPV > 0 ? (pessimisticProfit / pessimisticNPV) * 100 : 0,
        roi: pessimisticCost > 0 ? (pessimisticProfit / pessimisticCost) * 100 : 0,
        npvProfit: pessimisticProfit,
        npvROI: pessimisticCost > 0 ? (pessimisticProfit / pessimisticCost) * 100 : 0,
      };

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
        scenarios: {
          optimistic: optimisticScenario,
          base: baseScenario,
          pessimistic: pessimisticScenario,
        },
      };

      setFinancialResult(result);
      onResultChange(result);
    } catch (error) {
      console.error('Financial calculation error:', error);
    } finally {
      setIsCalculating(false);
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

  const { scenarios } = financialResult;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900">
          {WIZARD_TEXT.step4.title}
        </h3>
        <p className="mt-1 text-sm text-gray-600">
          {WIZARD_TEXT.step4.description}
        </p>
      </div>

      {/* Key Metrics Summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          {WIZARD_TEXT.step4.summary}
        </h4>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">Toplam Maliyet</p>
            <p className="mt-2 font-mono text-2xl font-bold text-gray-900">
              {(financialResult.totalConstructionCost / 1000000).toFixed(1)}M TL
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">NPV Gelir</p>
            <p className="mt-2 font-mono text-2xl font-bold text-blue-600">
              {(financialResult.npvAdjustedRevenue / 1000000).toFixed(1)}M TL
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">NPV Kar</p>
            <p
              className={`mt-2 font-mono text-2xl font-bold ${
                financialResult.npvProfit > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {(financialResult.npvProfit / 1000000).toFixed(1)}M TL
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">Kar Marjı</p>
            <p
              className={`mt-2 font-mono text-2xl font-bold ${
                financialResult.profitMargin > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {financialResult.profitMargin.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">ROI</p>
            <p
              className={`mt-2 font-mono text-2xl font-bold ${
                financialResult.roi > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {financialResult.roi.toFixed(0)}%
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <p className="text-xs text-gray-600">NPV ROI</p>
            <p
              className={`mt-2 font-mono text-2xl font-bold ${
                financialResult.npvROI > 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {financialResult.npvROI.toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      {/* Scenario Analysis */}
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h4 className="text-base font-semibold text-gray-900 mb-4">
          {WIZARD_TEXT.step4.scenarios}
        </h4>
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Senaryo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Maliyet
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Gelir (NPV)
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Kar
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  Marj
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-600">
                  ROI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {/* Optimistic */}
              <tr className="bg-green-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-green-900">
                  {scenarios.optimistic.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.optimistic.totalCost / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.optimistic.totalRevenue / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-green-600">
                  {(scenarios.optimistic.profit / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.optimistic.margin.toFixed(0)}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.optimistic.roi.toFixed(0)}%
                </td>
              </tr>

              {/* Base */}
              <tr className="bg-blue-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-blue-900">
                  {scenarios.base.name} ⭐
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.base.totalCost / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.base.totalRevenue / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold text-blue-600">
                  {(scenarios.base.profit / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.base.margin.toFixed(0)}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.base.roi.toFixed(0)}%
                </td>
              </tr>

              {/* Pessimistic */}
              <tr className="bg-red-50">
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-red-900">
                  {scenarios.pessimistic.name}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.pessimistic.totalCost / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {(scenarios.pessimistic.totalRevenue / 1000000).toFixed(1)}M
                </td>
                <td
                  className={`whitespace-nowrap px-4 py-3 font-mono text-sm font-semibold ${
                    scenarios.pessimistic.profit > 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}
                >
                  {(scenarios.pessimistic.profit / 1000000).toFixed(1)}M
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.pessimistic.margin.toFixed(0)}%
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono text-sm text-gray-700">
                  {scenarios.pessimistic.roi.toFixed(0)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Scenario Explanation */}
        <div className="mt-4 rounded-lg bg-blue-50 p-4">
          <p className="text-sm text-blue-900">
            <strong>Senaryo Varsayımları:</strong> İyimser (+8% gelir, -8% maliyet),
            Gerçekçi (girilen değerler), Kötümser (-8% gelir, +15% maliyet). Tüm
            gelirler NPV ile ayarlanmıştır.
          </p>
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
          onClick={() => alert('PDF export özelliği yakında eklenecek')}
          className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {WIZARD_TEXT.buttons.export}
        </button>
      </div>
    </div>
  );
}

export default FinancialSummary;
