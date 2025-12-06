/**
 * Cost Breakdown Editor Component
 *
 * Expandable cost categories with editable line items
 * Shows progress bars and allows per-item cost adjustments
 */

import { useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CostItem {
  id: string;
  name: string;
  perM2: number; // TL/m²
}

export interface CostCategory {
  id: string;
  name: string;
  items: CostItem[];
}

export interface CostBreakdownData {
  categories: CostCategory[];
  totalCostPerM2: number; // Sum of all items
  totalCost: number; // totalCostPerM2 × netArea
}

// ============================================================================
// Default Cost Structure (Antalya 2024-2025)
// ============================================================================

const DEFAULT_COST_CATEGORIES: CostCategory[] = [
  {
    id: 'kaba',
    name: 'Kaba İnşaat',
    items: [
      { id: 'beton', name: 'Beton', perM2: 3500 },
      { id: 'demir', name: 'Demir', perM2: 2800 },
      { id: 'kalip', name: 'Kalıp İşçiliği', perM2: 1500 },
      { id: 'duvar', name: 'Duvar & Tuğla', perM2: 1400 },
    ],
  },
  {
    id: 'tesisat',
    name: 'Tesisat (MEY)',
    items: [
      { id: 'elektrik', name: 'Elektrik', perM2: 2000 },
      { id: 'su', name: 'Su Tesisatı', perM2: 1800 },
      { id: 'dogalgaz', name: 'Doğalgaz', perM2: 800 },
      { id: 'hvac', name: 'Havalandırma', perM2: 900 },
    ],
  },
  {
    id: 'ince',
    name: 'İnce İşaat',
    items: [
      { id: 'siva', name: 'Sıva & Boya', perM2: 1500 },
      { id: 'seramik', name: 'Seramik & Fayans', perM2: 2200 },
      { id: 'parke', name: 'Parke', perM2: 1100 },
      { id: 'alcipan', name: 'Alçıpan', perM2: 1000 },
    ],
  },
  {
    id: 'dograma',
    name: 'Doğrama',
    items: [
      { id: 'pencere', name: 'PVC Pencere', perM2: 1800 },
      { id: 'ickapi', name: 'İç Kapılar', perM2: 900 },
      { id: 'diskapi', name: 'Dış Kapı', perM2: 600 },
    ],
  },
  {
    id: 'cephe',
    name: 'Dış Cephe',
    items: [
      { id: 'kaplama', name: 'Dış Cephe Kaplaması', perM2: 1800 },
      { id: 'mantolama', name: 'Isı Yalıtımı (Mantolama)', perM2: 1200 },
      { id: 'suyalitim', name: 'Su Yalıtımı', perM2: 1000 },
    ],
  },
  {
    id: 'iscilik',
    name: 'İşçilik',
    items: [
      { id: 'genel', name: 'Genel İşçilik', perM2: 3500 },
      { id: 'sgk', name: 'SGK & İSG', perM2: 1200 },
      { id: 'santiye', name: 'Şantiye Giderleri', perM2: 800 },
    ],
  },
  {
    id: 'proje',
    name: 'Proje & Ruhsat',
    items: [
      { id: 'mimari', name: 'Mimari Proje', perM2: 600 },
      { id: 'statik', name: 'Statik Proje', perM2: 400 },
      { id: 'harc', name: 'Belediye Harçları', perM2: 400 },
      { id: 'denetim', name: 'Yapı Denetim', perM2: 300 },
    ],
  },
];

// ============================================================================
// Progress Bar Component
// ============================================================================

interface ProgressBarProps {
  percentage: number;
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

function ProgressBar({ percentage, color = 'blue' }: ProgressBarProps) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className="w-32 h-3 bg-gray-200 rounded-full overflow-hidden">
      <div
        className={`h-full ${colorClasses[color]} transition-all duration-300`}
        style={{ width: `${Math.min(Math.max(percentage, 0), 100)}%` }}
      />
    </div>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface CostBreakdownEditorProps {
  netArea: number; // m² from apartment builder
  onCostChange: (data: CostBreakdownData) => void;
}

export function CostBreakdownEditor({
  netArea,
  onCostChange,
}: CostBreakdownEditorProps): JSX.Element {
  // State: categories with expansion tracking
  const [categories, setCategories] = useState<CostCategory[]>(
    DEFAULT_COST_CATEGORIES
  );
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  /**
   * Calculate totals and percentages
   */
  const calculations = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    let grandTotal = 0;

    categories.forEach((cat) => {
      const catTotal = cat.items.reduce((sum, item) => sum + item.perM2, 0);
      categoryTotals[cat.id] = catTotal;
      grandTotal += catTotal;
    });

    const categoryPercentages: Record<string, number> = {};
    categories.forEach((cat) => {
      categoryPercentages[cat.id] =
        grandTotal > 0 ? (categoryTotals[cat.id] / grandTotal) * 100 : 0;
    });

    return {
      categoryTotals,
      categoryPercentages,
      totalCostPerM2: grandTotal,
      totalCost: grandTotal * netArea,
    };
  }, [categories, netArea]);

  /**
   * Notify parent of cost changes
   */
  useMemo(() => {
    onCostChange({
      categories,
      totalCostPerM2: calculations.totalCostPerM2,
      totalCost: calculations.totalCost,
    });
  }, [categories, calculations, onCostChange]);

  /**
   * Toggle category expansion
   */
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  /**
   * Update item cost
   */
  const updateItemCost = (
    categoryId: string,
    itemId: string,
    newPerM2: number
  ) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === categoryId
          ? {
              ...cat,
              items: cat.items.map((item) =>
                item.id === itemId ? { ...item, perM2: newPerM2 } : item
              ),
            }
          : cat
      )
    );
  };

  /**
   * Handle item cost change
   */
  const handleItemCostChange = (
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    if (value === '') {
      updateItemCost(categoryId, itemId, 0);
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      updateItemCost(categoryId, itemId, parsed);
    }
  };

  /**
   * Handle item cost blur
   */
  const handleItemCostBlur = (
    categoryId: string,
    itemId: string,
    value: string
  ) => {
    if (value === '' || isNaN(parseFloat(value))) {
      const defaultItem = DEFAULT_COST_CATEGORIES
        .find(cat => cat.id === categoryId)
        ?.items.find(item => item.id === itemId);
      updateItemCost(categoryId, itemId, defaultItem?.perM2 || 0);
    }
  };

  /**
   * Reset category to defaults
   */
  const resetCategory = (categoryId: string) => {
    const defaultCat = DEFAULT_COST_CATEGORIES.find((c) => c.id === categoryId);
    if (!defaultCat) return;

    setCategories((prev) =>
      prev.map((cat) => (cat.id === categoryId ? { ...defaultCat } : cat))
    );
  };

  /**
   * Format currency
   */
  const formatCurrency = (amount: number): string => {
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(1)}M ₺`;
    }
    return `${(amount / 1000).toFixed(1)}K ₺`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h4 className="text-base font-semibold text-gray-900">
          Maliyet Detayları
        </h4>
        <p className="text-sm text-gray-600">
          Her kategoriyi genişletip kalem bazında düzenleyebilirsiniz.
        </p>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {categories.map((category) => {
          const isExpanded = expandedCategories.has(category.id);
          const categoryTotal = calculations.categoryTotals[category.id];
          const categoryPercent = calculations.categoryPercentages[category.id];
          const categoryCost = categoryTotal * netArea;

          return (
            <div
              key={category.id}
              className="rounded-lg border border-gray-200 bg-white overflow-hidden"
            >
              {/* Category Header (Collapsed View) */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium text-gray-900 w-32">
                    {category.name}
                  </span>
                  <ProgressBar percentage={categoryPercent} />
                  <span className="text-sm text-gray-600 w-16 text-right">
                    {categoryPercent.toFixed(0)}%
                  </span>
                  <span className="text-sm font-mono font-semibold text-gray-900 w-24 text-right">
                    {formatCurrency(categoryCost)}
                  </span>
                </div>
                <svg
                  className={`h-5 w-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Expanded View (Item Details) */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50 px-4 py-3">
                  <div className="space-y-2">
                    {category.items.map((item) => {
                      const itemCost = item.perM2 * netArea;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between bg-white rounded px-3 py-2 border border-gray-200"
                        >
                          <span className="text-sm text-gray-700 flex-1">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              value={item.perM2 === 0 ? '' : item.perM2}
                              onChange={(e) =>
                                handleItemCostChange(
                                  category.id,
                                  item.id,
                                  e.target.value
                                )
                              }
                              onBlur={(e) =>
                                handleItemCostBlur(
                                  category.id,
                                  item.id,
                                  e.target.value
                                )
                              }
                              min={0}
                              placeholder="0"
                              className="w-24 px-2 py-1 text-sm text-right font-mono border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-500 w-12">
                              TL/m²
                            </span>
                            <span className="text-xs text-gray-400 w-8">×</span>
                            <span className="text-xs text-gray-600 w-16 text-right">
                              {netArea.toLocaleString('tr-TR', {
                                maximumFractionDigits: 0,
                              })}
                            </span>
                            <span className="text-xs text-gray-400 w-8">=</span>
                            <span className="text-sm font-mono font-semibold text-gray-900 w-20 text-right">
                              {formatCurrency(itemCost)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Reset Button */}
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => resetCategory(category.id)}
                      className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                      🔄 Varsayılanlara Dön
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Grand Total */}
      <div className="border-t-2 border-gray-300 pt-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg px-4 py-3 border-2 border-blue-200">
          <span className="text-base font-bold text-gray-900">
            TOPLAM MALİYET
          </span>
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-gray-700">
              {calculations.totalCostPerM2.toLocaleString('tr-TR', {
                maximumFractionDigits: 0,
              })}{' '}
              TL/m²
            </span>
            <span className="text-xl font-mono font-bold text-blue-700">
              {formatCurrency(calculations.totalCost)}
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3">
        <div className="flex">
          <svg
            className="h-5 w-5 text-yellow-600 mt-0.5"
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
            <p className="text-sm text-yellow-800">
              <strong>Not:</strong> Tüm maliyetler NET kullanım alanı (
              {netArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
              ) üzerinden hesaplanmıştır. Fiyatları düzenleyerek özel senaryolar
              oluşturabilirsiniz.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostBreakdownEditor;
