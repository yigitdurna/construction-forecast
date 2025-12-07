/**
 * Research-Based Construction Costs (2024-2025)
 *
 * Sources:
 * - Çevre Şehircilik Bakanlığı - Yapı Yaklaşık Birim Maliyetleri 2024/2025
 * - TÜİK İnşaat Maliyet Endeksi
 * - Sanal Şantiye (sanalsantiye.com)
 * - İnşaat Hesabı (insaathesabi.com)
 *
 * Note: These are ACTUAL MARKET costs, not tax basis values from Resmi Gazete.
 * Tax basis values (Emlak Vergisi) are much lower (6,768 TL/m² for Lüks).
 */

export type CostCategory =
  | 'kabaYapi'
  | 'inceIsler'
  | 'tesisat'
  | 'genelGider';

export type QualityLevel = 'standart' | 'orta' | 'luks';

export interface CostItem {
  id: string;
  label: string;
  category: CostCategory;
  description: string;
  unit: 'TL/m²' | 'TL' | '%';
  /** Default value for each quality level */
  values: Record<QualityLevel, number>;
  /** Data source for transparency */
  source: 'sektor' | 'tuik' | 'bakanlik' | 'hesaplanan';
  sourceLabel: string;
  /** Can user edit this? */
  editable: boolean;
  /** Is this a percentage of subtotal? */
  isPercentage?: boolean;
}

export interface CostBreakdown {
  items: CostItem[];
  lastUpdated: string;
  dataVersion: string;
}

/**
 * Construction cost items with research-based defaults
 */
export const CONSTRUCTION_COST_ITEMS: CostItem[] = [
  // === KABA YAPI (35% of total) ===
  {
    id: 'temel',
    label: 'Temel',
    category: 'kabaYapi',
    description: 'Kazı, kalıp, demir, beton',
    unit: 'TL/m²',
    values: { standart: 1800, orta: 2500, luks: 3500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'karkas',
    label: 'Karkas (Demir + Beton)',
    category: 'kabaYapi',
    description: 'Betonarme taşıyıcı sistem',
    unit: 'TL/m²',
    values: { standart: 4500, orta: 5500, luks: 6500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'duvar',
    label: 'Duvar',
    category: 'kabaYapi',
    description: 'Tuğla/gazbeton duvar örme',
    unit: 'TL/m²',
    values: { standart: 900, orta: 1200, luks: 1500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'cati',
    label: 'Çatı',
    category: 'kabaYapi',
    description: 'Çatı konstrüksiyonu ve örtüsü',
    unit: 'TL/m²',
    values: { standart: 600, orta: 800, luks: 1000 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },

  // === İNCE İŞLER (40% of total) ===
  {
    id: 'sivaBoya',
    label: 'Sıva & Boya',
    category: 'inceIsler',
    description: 'İç ve dış cephe sıva, boya',
    unit: 'TL/m²',
    values: { standart: 1200, orta: 1800, luks: 2500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'seramikParke',
    label: 'Seramik & Parke',
    category: 'inceIsler',
    description: 'Zemin kaplamaları',
    unit: 'TL/m²',
    values: { standart: 1500, orta: 2200, luks: 3000 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'kapiPencere',
    label: 'Kapı & Pencere',
    category: 'inceIsler',
    description: 'İç kapılar, PVC/Alüminyum doğrama',
    unit: 'TL/m²',
    values: { standart: 2000, orta: 2800, luks: 3500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'mutfakBanyo',
    label: 'Mutfak & Banyo',
    category: 'inceIsler',
    description: 'Dolap, tezgah, vitrifiye',
    unit: 'TL/m²',
    values: { standart: 2000, orta: 2700, luks: 3500 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },

  // === TESİSAT (15% of total) ===
  {
    id: 'elektrik',
    label: 'Elektrik Tesisatı',
    category: 'tesisat',
    description: 'Kablolama, priz, aydınlatma',
    unit: 'TL/m²',
    values: { standart: 1000, orta: 1400, luks: 1800 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },
  {
    id: 'suKalorifer',
    label: 'Su & Kalorifer',
    category: 'tesisat',
    description: 'Sıhhi tesisat, ısıtma sistemi',
    unit: 'TL/m²',
    values: { standart: 1500, orta: 2100, luks: 2800 },
    source: 'sektor',
    sourceLabel: 'Sektör Ort.',
    editable: true,
  },

  // === GENEL GİDERLER (10-15% of subtotal) ===
  {
    id: 'genelGider',
    label: 'Genel Gider',
    category: 'genelGider',
    description: 'Şantiye giderleri, yönetim, sigorta',
    unit: '%',
    values: { standart: 10, orta: 12, luks: 15 },
    source: 'hesaplanan',
    sourceLabel: 'Hesaplanan',
    editable: true,
    isPercentage: true,
  },
];

/**
 * Category labels for grouping
 */
export const CATEGORY_LABELS: Record<CostCategory, string> = {
  kabaYapi: 'Kaba Yapı',
  inceIsler: 'İnce İşler',
  tesisat: 'Tesisat',
  genelGider: 'Genel Giderler',
};

/**
 * Quality level labels
 */
export const QUALITY_LABELS: Record<QualityLevel, string> = {
  standart: 'Standart',
  orta: 'Orta',
  luks: 'Lüks',
};

/**
 * Quality level descriptions
 */
export const QUALITY_DESCRIPTIONS: Record<QualityLevel, string> = {
  standart: 'Ekonomik malzeme, temel kalite',
  orta: 'Orta kalite malzeme (önerilen)',
  luks: 'Yüksek kalite, premium malzeme',
};

/**
 * Calculate total cost per m² for a quality level
 */
export function calculateTotalCostPerM2(
  quality: QualityLevel,
  overrides?: Record<string, number>
): number {
  let subtotal = 0;
  let genelGiderPercent = 0;

  for (const item of CONSTRUCTION_COST_ITEMS) {
    const value = overrides?.[item.id] ?? item.values[quality];

    if (item.isPercentage) {
      genelGiderPercent = value;
    } else {
      subtotal += value;
    }
  }

  const genelGider = subtotal * (genelGiderPercent / 100);
  return subtotal + genelGider;
}

/**
 * Get cost breakdown for a quality level
 */
export function getCostBreakdown(
  quality: QualityLevel,
  overrides?: Record<string, number>
): {
  items: Array<{ id: string; label: string; value: number; category: CostCategory }>;
  subtotal: number;
  genelGider: number;
  total: number;
} {
  const items: Array<{ id: string; label: string; value: number; category: CostCategory }> = [];
  let subtotal = 0;
  let genelGiderPercent = 0;

  for (const item of CONSTRUCTION_COST_ITEMS) {
    const value = overrides?.[item.id] ?? item.values[quality];

    if (item.isPercentage) {
      genelGiderPercent = value;
    } else {
      items.push({
        id: item.id,
        label: item.label,
        value,
        category: item.category,
      });
      subtotal += value;
    }
  }

  const genelGider = subtotal * (genelGiderPercent / 100);

  return {
    items,
    subtotal,
    genelGider,
    total: subtotal + genelGider,
  };
}

/**
 * Get items grouped by category
 */
export function getItemsByCategory(
  quality: QualityLevel
): Record<CostCategory, Array<{ item: CostItem; value: number }>> {
  const result: Record<CostCategory, Array<{ item: CostItem; value: number }>> = {
    kabaYapi: [],
    inceIsler: [],
    tesisat: [],
    genelGider: [],
  };

  for (const item of CONSTRUCTION_COST_ITEMS) {
    result[item.category].push({
      item,
      value: item.values[quality],
    });
  }

  return result;
}

/**
 * Data version info
 */
export const COST_DATA_INFO = {
  version: '2024.12',
  lastUpdated: '2024-12-07',
  sources: [
    { name: 'Sektör Ortalamaları', url: 'https://www.sanalsantiye.com/' },
    { name: 'TÜİK', url: 'https://data.tuik.gov.tr/Kategori/GetKategori?p=Insaat-ve-Konut-116' },
    { name: 'İnşaat Hesabı', url: 'https://insaathesabi.com/blog/insaat-maliyeti-hesaplama/' },
  ],
  notes: [
    'Fiyatlar NET alan üzerinden hesaplanmaktadır',
    'Arsa maliyeti dahil değildir',
    'Bölgesel farklar +/- %15 olabilir',
  ],
};

/**
 * Default totals per quality level (for quick reference)
 */
export const DEFAULT_TOTALS: Record<QualityLevel, number> = {
  standart: calculateTotalCostPerM2('standart'),
  orta: calculateTotalCostPerM2('orta'),
  luks: calculateTotalCostPerM2('luks'),
};
