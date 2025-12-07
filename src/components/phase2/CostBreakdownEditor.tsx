/**
 * Cost Breakdown Editor Component
 *
 * Turkish construction cost categories based on industry standards
 * Reference: insaathesabi.com methodology (2024-2025)
 *
 * KEY PRINCIPLE: All costs are applied to GROSS area (building total)
 * This matches how Turkish contractors calculate and quote projects.
 */

import { useState, useMemo } from 'react';

// ============================================================================
// Types
// ============================================================================

export interface CostItem {
  id: string;
  name: string;
  perM2: number; // TL/m² GROSS (building total)
}

export interface CostCategory {
  id: string;
  name: string;
  icon: string;
  items: CostItem[];
  percentage?: number; // Expected % of total (for reference)
}

export interface CostBreakdownData {
  categories: CostCategory[];
  totalCostPerM2: number; // Sum of all items (per GROSS m²)
  totalCost: number; // totalCostPerM2 × grossArea
  grossArea: number; // Building total area used
}

// ============================================================================
// Turkish Construction Cost Structure (2024-2025)
// Based on insaathesabi.com methodology and Turkish market data
// Updated December 2024 with real contractor quotes
//
// IMPORTANT: All values are per GROSS m² (building total)
// Total: ~27,500 TL/m² for mid-quality apartment construction
// Sources: Turkish contractor associations, Antalya construction companies
// ============================================================================

const DEFAULT_COST_CATEGORIES: CostCategory[] = [
  {
    id: 'kaba',
    name: 'Kaba İnşaat',
    icon: '🏗️',
    percentage: 44, // ~12,000 TL/m²
    items: [
      { id: 'hafriyat', name: 'Hafriyat & Temel Kazısı', perM2: 1150 },
      { id: 'beton', name: 'Beton İşleri', perM2: 4600 },
      { id: 'demir', name: 'Demir İşleri', perM2: 3450 },
      { id: 'kalip', name: 'Kalıp İşçiliği', perM2: 1700 },
      { id: 'duvar', name: 'Duvar İşleri (Tuğla/Gazbeton)', perM2: 1100 },
    ],
  },
  {
    id: 'tesisat',
    name: 'Tesisat (MEP)',
    icon: '🔧',
    percentage: 16, // ~4,500 TL/m²
    items: [
      { id: 'elektrik', name: 'Elektrik Tesisatı', perM2: 1450 },
      { id: 'su', name: 'Su Tesisatı', perM2: 870 },
      { id: 'kanal', name: 'Kanalizasyon', perM2: 580 },
      { id: 'dogalgaz', name: 'Doğalgaz Tesisatı', perM2: 440 },
      { id: 'hvac', name: 'Isıtma/Soğutma (HVAC)', perM2: 1160 },
    ],
  },
  {
    id: 'ince',
    name: 'İnce İnşaat',
    icon: '🎨',
    percentage: 22, // ~6,000 TL/m²
    items: [
      { id: 'siva', name: 'Sıva İşleri', perM2: 900 },
      { id: 'boya', name: 'Boya Badana', perM2: 600 },
      { id: 'seramik', name: 'Seramik & Fayans', perM2: 1200 },
      { id: 'parke', name: 'Parke/Zemin Kaplama', perM2: 900 },
      { id: 'alcipan', name: 'Alçıpan/Asma Tavan', perM2: 750 },
      { id: 'mutfak', name: 'Mutfak Dolabı', perM2: 900 },
      { id: 'banyo', name: 'Banyo Vitrifiye', perM2: 750 },
    ],
  },
  {
    id: 'dograma',
    name: 'Doğrama & Cephe',
    icon: '🪟',
    percentage: 13, // ~3,500 TL/m²
    items: [
      { id: 'pencere', name: 'PVC/Alüminyum Pencere', perM2: 1200 },
      { id: 'diskapi', name: 'Dış Kapı (Çelik)', perM2: 300 },
      { id: 'ickapi', name: 'İç Kapılar', perM2: 450 },
      { id: 'cephe', name: 'Dış Cephe Kaplaması', perM2: 850 },
      { id: 'mantolama', name: 'Isı Yalıtımı (Mantolama)', perM2: 700 },
    ],
  },
  {
    id: 'diger',
    name: 'Diğer Giderler',
    icon: '📋',
    percentage: 5, // ~1,500 TL/m²
    items: [
      { id: 'proje', name: 'Proje & Mühendislik', perM2: 375 },
      { id: 'denetim', name: 'Yapı Denetim', perM2: 185 },
      { id: 'harc', name: 'Belediye Harçları', perM2: 250 },
      { id: 'sgk', name: 'SGK & İş Güvenliği', perM2: 380 },
      { id: 'santiye', name: 'Şantiye Giderleri', perM2: 310 },
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
  grossArea: number; // Building total m² (toplamInsaatAlani)
  netArea: number; // Net sellable m² (for display reference)
  onCostChange: (data: CostBreakdownData) => void;
}

export function CostBreakdownEditor({
  grossArea,
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
   * All costs are per GROSS m² (building total)
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
      totalCost: grandTotal * grossArea, // Use GROSS area for total cost
    };
  }, [categories, grossArea]);

  /**
   * Notify parent of cost changes
   */
  useMemo(() => {
    onCostChange({
      categories,
      totalCostPerM2: calculations.totalCostPerM2,
      totalCost: calculations.totalCost,
      grossArea, // Include gross area in the data
    });
  }, [categories, calculations, onCostChange, grossArea]);

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
          const categoryCost = categoryTotal * grossArea;

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
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-lg">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-900 w-36">
                    {category.name}
                  </span>
                  <ProgressBar percentage={categoryPercent} />
                  <span className="text-sm text-gray-600 w-14 text-right">
                    {categoryPercent.toFixed(0)}%
                  </span>
                  <span className="text-sm font-mono font-semibold text-gray-900 w-28 text-right">
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
                      const itemCost = item.perM2 * grossArea;
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
                              {grossArea.toLocaleString('tr-TR', {
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
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
        <div className="flex">
          <svg
            className="h-5 w-5 text-blue-600 mt-0.5"
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
            <p className="text-sm text-blue-800">
              <strong>Alan Bilgisi:</strong> Maliyetler <strong>toplam inşaat alanı</strong> ({grossArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²) üzerinden hesaplanır.
              Bu alan; daireler, ortak alanlar, merdiven, asansör, otopark dahil tüm kapalı alandır.
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Satılabilir NET alan: {netArea.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} m²
              (Net/Brüt oranı: {grossArea > 0 ? ((netArea / grossArea) * 100).toFixed(0) : 0}%)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CostBreakdownEditor;
