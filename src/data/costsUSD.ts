/**
 * USD-Based Construction Costs
 *
 * Phase 3.2 - Construction costs in USD to handle TL volatility
 * Base costs are indexed to ~$1,015/m² ≈ 35,000 TL at 34.50 USD/TRY
 */

import type { CostCategoryUSD } from '../types/costs';

/**
 * Default USD-based cost structure for Antalya construction
 *
 * Total: ~$1,015/m² ≈ 35,000 TL at 34.50 USD/TRY
 *
 * Labor ratios indicate what portion of the cost is labor:
 * - 0.0 = All materials (e.g., permits)
 * - 0.5 = 50% labor, 50% materials (e.g., masonry)
 * - 1.0 = All labor (e.g., general labor, professional services)
 */
export const DEFAULT_COSTS_USD: CostCategoryUSD[] = [
  {
    id: 'kaba',
    name: 'Structural',
    nameTR: 'Kaba İnşaat',
    items: [
      {
        id: 'beton',
        name: 'Concrete',
        nameTR: 'Beton',
        perM2USD: 100,
        laborRatio: 0.3,
      },
      {
        id: 'demir',
        name: 'Rebar',
        nameTR: 'Demir',
        perM2USD: 80,
        laborRatio: 0.1,
      },
      {
        id: 'kalip',
        name: 'Formwork',
        nameTR: 'Kalıp İşçiliği',
        perM2USD: 45,
        laborRatio: 0.7,
      },
      {
        id: 'duvar',
        name: 'Masonry',
        nameTR: 'Duvar & Tuğla',
        perM2USD: 40,
        laborRatio: 0.5,
      },
    ],
  },
  {
    id: 'tesisat',
    name: 'MEP',
    nameTR: 'Tesisat (MEY)',
    items: [
      {
        id: 'elektrik',
        name: 'Electrical',
        nameTR: 'Elektrik',
        perM2USD: 60,
        laborRatio: 0.4,
      },
      {
        id: 'su',
        name: 'Plumbing',
        nameTR: 'Su Tesisatı',
        perM2USD: 55,
        laborRatio: 0.4,
      },
      {
        id: 'dogalgaz',
        name: 'Gas',
        nameTR: 'Doğalgaz',
        perM2USD: 25,
        laborRatio: 0.3,
      },
      {
        id: 'hvac',
        name: 'HVAC',
        nameTR: 'Havalandırma',
        perM2USD: 28,
        laborRatio: 0.3,
      },
    ],
  },
  {
    id: 'ince',
    name: 'Finishes',
    nameTR: 'İnce İşaat',
    items: [
      {
        id: 'siva',
        name: 'Plaster & Paint',
        nameTR: 'Sıva & Boya',
        perM2USD: 45,
        laborRatio: 0.6,
      },
      {
        id: 'seramik',
        name: 'Tiles',
        nameTR: 'Seramik & Fayans',
        perM2USD: 65,
        laborRatio: 0.4,
      },
      {
        id: 'parke',
        name: 'Flooring',
        nameTR: 'Parke',
        perM2USD: 35,
        laborRatio: 0.3,
      },
      {
        id: 'alcipan',
        name: 'Drywall',
        nameTR: 'Alçıpan',
        perM2USD: 30,
        laborRatio: 0.5,
      },
    ],
  },
  {
    id: 'dograma',
    name: 'Doors & Windows',
    nameTR: 'Doğrama',
    items: [
      {
        id: 'pencere',
        name: 'Windows',
        nameTR: 'PVC Pencere',
        perM2USD: 55,
        laborRatio: 0.2,
      },
      {
        id: 'ickapi',
        name: 'Interior Doors',
        nameTR: 'İç Kapılar',
        perM2USD: 28,
        laborRatio: 0.3,
      },
      {
        id: 'diskapi',
        name: 'Entrance Door',
        nameTR: 'Dış Kapı',
        perM2USD: 18,
        laborRatio: 0.2,
      },
    ],
  },
  {
    id: 'cephe',
    name: 'Facade',
    nameTR: 'Dış Cephe',
    items: [
      {
        id: 'kaplama',
        name: 'Facade Cladding',
        nameTR: 'Dış Cephe Kaplaması',
        perM2USD: 55,
        laborRatio: 0.4,
      },
      {
        id: 'mantolama',
        name: 'Insulation',
        nameTR: 'Isı Yalıtımı (Mantolama)',
        perM2USD: 38,
        laborRatio: 0.3,
      },
      {
        id: 'suyalitim',
        name: 'Waterproofing',
        nameTR: 'Su Yalıtımı',
        perM2USD: 30,
        laborRatio: 0.3,
      },
    ],
  },
  {
    id: 'iscilik',
    name: 'Labor',
    nameTR: 'İşçilik',
    items: [
      {
        id: 'genel',
        name: 'General Labor',
        nameTR: 'Genel İşçilik',
        perM2USD: 105,
        laborRatio: 1.0,
      },
      {
        id: 'sgk',
        name: 'Insurance & Safety',
        nameTR: 'SGK & İSG',
        perM2USD: 35,
        laborRatio: 1.0,
      },
      {
        id: 'santiye',
        name: 'Site Costs',
        nameTR: 'Şantiye Giderleri',
        perM2USD: 25,
        laborRatio: 0.8,
      },
    ],
  },
  {
    id: 'proje',
    name: 'Design & Permits',
    nameTR: 'Proje & Ruhsat',
    items: [
      {
        id: 'mimari',
        name: 'Architectural',
        nameTR: 'Mimari Proje',
        perM2USD: 18,
        laborRatio: 1.0,
      },
      {
        id: 'statik',
        name: 'Structural',
        nameTR: 'Statik Proje',
        perM2USD: 12,
        laborRatio: 1.0,
      },
      {
        id: 'harc',
        name: 'Permits',
        nameTR: 'Belediye Harçları',
        perM2USD: 12,
        laborRatio: 0.0, // Government fees, no labor
      },
      {
        id: 'denetim',
        name: 'Inspection',
        nameTR: 'Yapı Denetim',
        perM2USD: 9,
        laborRatio: 1.0,
      },
    ],
  },
];

/**
 * Calculate total USD cost per m²
 */
export function getTotalCostPerM2USD(categories: CostCategoryUSD[] = DEFAULT_COSTS_USD): number {
  return categories.reduce((total, category) => {
    const categoryTotal = category.items.reduce((sum, item) => sum + item.perM2USD, 0);
    return total + categoryTotal;
  }, 0);
}

/**
 * Get category breakdown in USD
 */
export function getCategoryTotalsUSD(categories: CostCategoryUSD[] = DEFAULT_COSTS_USD): Record<string, number> {
  const totals: Record<string, number> = {};

  categories.forEach((category) => {
    totals[category.id] = category.items.reduce((sum, item) => sum + item.perM2USD, 0);
  });

  return totals;
}
