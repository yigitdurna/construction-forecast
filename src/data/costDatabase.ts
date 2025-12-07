/**
 * Master Cost Database
 *
 * Single source of truth for all construction cost parameters.
 * Based on ÖZGÜNTUR RELIFE UNIQUE real project data (December 2025).
 *
 * KEY DECISIONS:
 * - Single quality level (ÖZGÜNTUR standard) - no economy/luxury tiers
 * - All costs validated against real project data where possible
 * - Sources tracked for transparency and future updates
 *
 * @maintainer Construction Forecast Team
 * @lastUpdated 2025-12-07
 */

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type CostCategory =
  | 'kabaYapi'      // Rough Construction
  | 'tesisat'       // MEP (Mechanical, Electrical, Plumbing)
  | 'inceIsler'     // Finishes
  | 'disCephe'      // Facade
  | 'projeResmi'    // Soft Costs (Design, Permits)
  | 'finansal'      // Financial (Contingency, Overhead)
  | 'malzeme'       // Materials (reference prices)
  | 'parametre';    // Project Parameters

export type ConfidenceLevel = 'yuksek' | 'orta' | 'dusuk';

export type DataSource =
  | 'gercekProje'   // Real project data (ÖZGÜNTUR)
  | 'sektor'        // Industry averages
  | 'bakanlik'      // Ministry data
  | 'tuik'          // TÜİK statistics
  | 'piyasa'        // Market research
  | 'hesaplanan';   // Calculated/derived

export interface CostDatabaseItem {
  /** Unique identifier */
  id: string;
  /** Category for grouping */
  category: CostCategory;
  /** Display name (Turkish) */
  label: string;
  /** English description */
  description: string;
  /** Unit of measurement */
  unit: 'TL/m²' | 'TL/adet' | 'TL/m' | 'TL' | '%' | 'oran' | 'adet' | 'm²';
  /** Standard value (ÖZGÜNTUR quality level) */
  value: number;
  /** Data source */
  source: DataSource;
  /** Source description */
  sourceLabel: string;
  /** Source URL if available */
  sourceUrl?: string;
  /** Last updated date */
  lastUpdated: string;
  /** Confidence level */
  confidence: ConfidenceLevel;
  /** Additional notes */
  notes?: string;
  /** Is this user-editable? */
  editable: boolean;
  /** Is this applied to GROSS or NET area? */
  appliedTo?: 'gross' | 'net' | 'parsel' | 'birim' | 'sabit';
  /** Real project validated value (if different from value) */
  validatedValue?: number;
  /** Real project validation source */
  validatedSource?: string;
}

// =============================================================================
// MASTER COST DATABASE
// =============================================================================

export const COST_DATABASE: CostDatabaseItem[] = [

  // ===========================================================================
  // PARAMETRELER - Project Configuration Parameters
  // ===========================================================================

  {
    id: 'netBrutOrani',
    category: 'parametre',
    label: 'Net/Brüt Oranı',
    description: 'Net usable area as percentage of gross area',
    unit: 'oran',
    value: 0.77,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR RELIFE UNIQUE',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Previously assumed 85%, real data shows 76.9%. Major correction!',
    editable: true,
    validatedValue: 0.769,
    validatedSource: 'DXF analysis TİP-1: 122.05m² NET / 158.6m² BRÜT = 76.9%',
  },
  {
    id: 'banyoSayisi',
    category: 'parametre',
    label: 'Banyo Sayısı (3+1 için)',
    description: 'Number of bathrooms per 3+1 unit',
    unit: 'adet',
    value: 2,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR RELIFE UNIQUE',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: '3+1 units have 2 full bathrooms (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 2,
    validatedSource: 'Material list: 128 WCs for 64 units = 2/unit',
  },
  {
    id: 'aydinlatmaSayisi',
    category: 'parametre',
    label: 'Aydınlatma Armatürü (adet/daire)',
    description: 'Lighting fixtures per unit',
    unit: 'adet',
    value: 74,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR RELIFE UNIQUE',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'ÖZGÜNTUR standard: 74 fixtures per 120m² unit',
    editable: true,
    validatedValue: 74,
    validatedSource: 'Material list: 4,736 fixtures / 64 units = 74/unit',
  },

  // ===========================================================================
  // KABA YAPI - Rough Construction (~35-40% of total)
  // ===========================================================================

  {
    id: 'temel',
    category: 'kabaYapi',
    label: 'Temel',
    description: 'Foundation - excavation, formwork, rebar, concrete',
    unit: 'TL/m²',
    value: 2200,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    sourceUrl: 'https://insaathesabi.com/',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² of ground floor (taban alanı). ÖZGÜNTUR quality.',
    editable: true,
    appliedTo: 'parsel',
  },
  {
    id: 'karkas',
    category: 'kabaYapi',
    label: 'Karkas (Demir + Beton)',
    description: 'Reinforced concrete frame structure',
    unit: 'TL/m²',
    value: 5200,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    sourceUrl: 'https://www.sanalsantiye.com/',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS. Includes concrete (~3,000 TL/m³) + rebar (~28 TL/kg)',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'duvar',
    category: 'kabaYapi',
    label: 'Duvar (Tuğla/Gazbeton)',
    description: 'Masonry walls - brick or aerated concrete',
    unit: 'TL/m²',
    value: 1100,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS floor area (not wall area)',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'cati',
    category: 'kabaYapi',
    label: 'Çatı',
    description: 'Roof construction and covering',
    unit: 'TL/m²',
    value: 750,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² roof area (typically = taban alanı)',
    editable: true,
    appliedTo: 'parsel',
  },

  // ===========================================================================
  // TESİSAT - MEP (~12-18% of total)
  // ===========================================================================

  {
    id: 'elektrikTesisat',
    category: 'tesisat',
    label: 'Elektrik Tesisatı',
    description: 'Electrical installation - wiring, panels, outlets',
    unit: 'TL/m²',
    value: 1300,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS. Does not include fixtures',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'suTesisat',
    category: 'tesisat',
    label: 'Sıhhi Tesisat',
    description: 'Plumbing - pipes, drains, water supply',
    unit: 'TL/m²',
    value: 1500,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS. Does not include fixtures',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'isitma',
    category: 'tesisat',
    label: 'Isıtma/Soğutma Sistemi',
    description: 'HVAC - heating and cooling systems',
    unit: 'TL/m²',
    value: 1400,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Central system. Split AC: ~25,000 TL/unit per room',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'asansor',
    category: 'tesisat',
    label: 'Asansör',
    description: 'Elevator installation per shaft',
    unit: 'TL/adet',
    value: 1300000,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: '8-person standard elevator (ÖZGÜNTUR quality)',
    editable: true,
    appliedTo: 'birim',
  },

  // ===========================================================================
  // İNCE İŞLER - Finishes (~25-35% of total)
  // ===========================================================================

  {
    id: 'sivaBoya',
    category: 'inceIsler',
    label: 'Sıva & Boya',
    description: 'Plastering and painting (interior)',
    unit: 'TL/m²',
    value: 1600,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS. Includes ~2.5x wall area factor',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'seramik',
    category: 'inceIsler',
    label: 'Seramik/Fayans',
    description: 'Ceramic tiles for wet areas, kitchen, corridors',
    unit: 'TL/m²',
    value: 700,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Kütahya Seramik)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Per m² of ceramic area (~85 m²/unit in real project)',
    editable: true,
    appliedTo: 'net',
    validatedValue: 700,
    validatedSource: 'Kütahya 60x120 Riva Fildişi, 60x60 Vista Bone',
  },
  {
    id: 'parke',
    category: 'inceIsler',
    label: 'Laminat Parke',
    description: 'Laminate flooring for living areas, bedrooms',
    unit: 'TL/m²',
    value: 700,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Per m² of parke area (~80 m²/unit in real project)',
    editable: true,
    appliedTo: 'net',
    validatedValue: 700,
    validatedSource: 'Material list: Laminat Parke',
  },
  {
    id: 'mutfakDolap',
    category: 'inceIsler',
    label: 'Mutfak (Dolap + Tezgah)',
    description: 'Kitchen cabinets and countertop per unit',
    unit: 'TL/adet',
    value: 110000,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Complete kitchen per unit (ÖZGÜNTUR quality)',
    editable: true,
    appliedTo: 'birim',
  },
  {
    id: 'banyoKomple',
    category: 'inceIsler',
    label: 'Banyo Komple (Vitrifiye + Batarya)',
    description: 'Complete bathroom fixtures per bathroom',
    unit: 'TL/adet',
    value: 120000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Grohe, Duravit)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'WC, basin, faucets, shower set, drain. Grohe/Duravit',
    editable: true,
    appliedTo: 'birim',
    validatedValue: 120000,
    validatedSource: 'Material list: Grohe, Duravit Starck 3, Hüppe Galata',
  },
  {
    id: 'icKapi',
    category: 'inceIsler',
    label: 'İç Kapılar',
    description: 'Interior doors per unit (~5 doors)',
    unit: 'TL/adet',
    value: 70000,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Total for ~5 interior doors per unit (ÖZGÜNTUR quality)',
    editable: true,
    appliedTo: 'birim',
  },
  {
    id: 'aydinlatma',
    category: 'inceIsler',
    label: 'Aydınlatma Armatürleri',
    description: 'Lighting fixtures per unit',
    unit: 'TL/adet',
    value: 44000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (GOYA, ARMADA)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: '74 fixtures/unit × ~600 TL avg each',
    editable: true,
    appliedTo: 'birim',
    validatedValue: 44000,
    validatedSource: '74 fixtures × ~600 TL avg = 44,400 TL',
  },

  // ===========================================================================
  // DIŞ CEPHE - Facade (~8-12% of total)
  // ===========================================================================

  {
    id: 'pencere',
    category: 'disCephe',
    label: 'Pencere (PVC/Alüminyum)',
    description: 'Windows - PVC or aluminum frames with double glazing',
    unit: 'TL/m²',
    value: 5500,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² window area. Typical: GROSS × 0.15',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'disCepheKaplama',
    category: 'disCephe',
    label: 'Dış Cephe Kaplaması',
    description: 'Exterior cladding/finish',
    unit: 'TL/m²',
    value: 1600,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² facade area',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'yalitim',
    category: 'disCephe',
    label: 'Mantolama (Isı Yalıtımı)',
    description: 'Thermal insulation - mandatory by regulation',
    unit: 'TL/m²',
    value: 550,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² facade area. Mandatory for building permit',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'girisKapisi',
    category: 'disCephe',
    label: 'Daire Giriş Kapısı (Çelik)',
    description: 'Steel security entrance door per unit',
    unit: 'TL/adet',
    value: 12000,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Steel security door per unit (ÖZGÜNTUR quality)',
    editable: true,
    appliedTo: 'birim',
  },

  // ===========================================================================
  // PROJE & RESMİ GİDERLER - Soft Costs (~5-8% of total)
  // ===========================================================================

  {
    id: 'mimariProje',
    category: 'projeResmi',
    label: 'Mimari Proje',
    description: 'Architectural design',
    unit: 'TL/m²',
    value: 160,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'statikProje',
    category: 'projeResmi',
    label: 'Statik Proje',
    description: 'Structural engineering',
    unit: 'TL/m²',
    value: 80,
    source: 'sektor',
    sourceLabel: 'Sektör Ortalaması',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m² GROSS',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'yapiRuhsati',
    category: 'projeResmi',
    label: 'Yapı Ruhsatı',
    description: 'Building permit fees',
    unit: 'TL',
    value: 350000,
    source: 'sektor',
    sourceLabel: 'Belediye',
    lastUpdated: '2025-12-07',
    confidence: 'dusuk',
    notes: 'Varies significantly by municipality and project size',
    editable: true,
    appliedTo: 'sabit',
  },

  // ===========================================================================
  // FİNANSAL - Financial Costs (~15-25% of subtotal)
  // ===========================================================================

  {
    id: 'beklenmeyen',
    category: 'finansal',
    label: 'Beklenmeyen Giderler',
    description: 'Contingency reserve',
    unit: '%',
    value: 12,
    source: 'sektor',
    sourceLabel: 'Sektör Standardı',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Percentage of construction subtotal',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'genelGider',
    category: 'finansal',
    label: 'Genel Gider',
    description: 'Overhead - site office, utilities, management',
    unit: '%',
    value: 10,
    source: 'sektor',
    sourceLabel: 'Sektör Standardı',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Percentage of construction subtotal',
    editable: true,
    appliedTo: 'gross',
  },
  {
    id: 'muteahhitKar',
    category: 'finansal',
    label: 'Müteahhit Karı',
    description: "Builder's profit margin",
    unit: '%',
    value: 12,
    source: 'sektor',
    sourceLabel: 'Sektör Standardı',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'If using contractor. Self-build = 0%',
    editable: true,
    appliedTo: 'gross',
  },

  // ===========================================================================
  // MALZEME - Material Reference Prices (ÖZGÜNTUR brands)
  // ===========================================================================

  {
    id: 'betonM3',
    category: 'malzeme',
    label: 'Beton (C30)',
    description: 'Ready-mix concrete per cubic meter',
    unit: 'TL/m²',
    value: 3000,
    source: 'piyasa',
    sourceLabel: 'Piyasa Fiyatı',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per m³. Typical usage: 0.25-0.30 m³ per m² GROSS',
    editable: true,
  },
  {
    id: 'demirKg',
    category: 'malzeme',
    label: 'İnşaat Demiri',
    description: 'Reinforcement steel per kg',
    unit: 'TL/m²',
    value: 28,
    source: 'piyasa',
    sourceLabel: 'Piyasa Fiyatı',
    lastUpdated: '2025-12-07',
    confidence: 'orta',
    notes: 'Per kg. Typical usage: 80-100 kg per m² GROSS',
    editable: true,
  },
  {
    id: 'evyeFranke',
    category: 'malzeme',
    label: 'Evye (Franke Maris)',
    description: 'Kitchen sink - Franke brand',
    unit: 'TL/adet',
    value: 8000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Franke)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Granite sink (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 8000,
    validatedSource: 'Material list: Franke Maris granite',
  },
  {
    id: 'klozetDuravit',
    category: 'malzeme',
    label: 'Klozet (Duravit Starck 3)',
    description: 'Wall-hung WC - Duravit brand',
    unit: 'TL/adet',
    value: 8000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Duravit)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Designer WC (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 8000,
    validatedSource: 'Material list: Duravit Starck 3 asma klozet',
  },
  {
    id: 'rezervuarGrohe',
    category: 'malzeme',
    label: 'Gömme Rezervuar (Grohe Uniset)',
    description: 'Concealed cistern - Grohe brand',
    unit: 'TL/adet',
    value: 6000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Grohe)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Premium cistern (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 6000,
    validatedSource: 'Material list: Grohe Uniset gömme rezervuar',
  },
  {
    id: 'bataryaGrohe',
    category: 'malzeme',
    label: 'Lavabo Bataryası (Grohe)',
    description: 'Basin faucet - Grohe brand',
    unit: 'TL/adet',
    value: 3500,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Grohe)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Premium faucet (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 3500,
    validatedSource: 'Material list: Grohe lavabo bataryası',
  },
  {
    id: 'dusSetiRainshower',
    category: 'malzeme',
    label: 'Rainshower Duş Seti',
    description: 'Rainshower set with head, arm, hose',
    unit: 'TL/adet',
    value: 8000,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Complete set (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 8000,
    validatedSource: 'Material list: Rainshower set × 128 (2/unit)',
  },
  {
    id: 'dusKanali',
    category: 'malzeme',
    label: 'Duş Kanalı (Hüppe Galata)',
    description: 'Channel shower drain - Hüppe brand',
    unit: 'TL/adet',
    value: 3500,
    source: 'gercekProje',
    sourceLabel: 'ÖZGÜNTUR (Hüppe)',
    lastUpdated: '2025-12-07',
    confidence: 'yuksek',
    notes: 'Linear drain (ÖZGÜNTUR standard)',
    editable: true,
    validatedValue: 3500,
    validatedSource: 'Material list: Hüppe Galata kanal',
  },
];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get all items in a category
 */
export function getItemsByCategory(category: CostCategory): CostDatabaseItem[] {
  return COST_DATABASE.filter(item => item.category === category);
}

/**
 * Get item by ID
 */
export function getItemById(id: string): CostDatabaseItem | undefined {
  return COST_DATABASE.find(item => item.id === id);
}

/**
 * Get value for an item (single quality level - ÖZGÜNTUR standard)
 */
export function getValue(id: string): number {
  const item = getItemById(id);
  return item?.value ?? 0;
}

/**
 * Get all items with real project validation
 */
export function getValidatedItems(): CostDatabaseItem[] {
  return COST_DATABASE.filter(item => item.validatedValue !== undefined);
}

/**
 * Calculate total cost per m² (all TL/m² items, ÖZGÜNTUR quality)
 */
export function calculateTotalPerM2(): number {
  let total = 0;
  const perM2Items = COST_DATABASE.filter(
    item => item.unit === 'TL/m²' &&
    item.category !== 'malzeme' &&
    item.category !== 'parametre'
  );

  for (const item of perM2Items) {
    total += item.value;
  }

  return total;
}

/**
 * Export database as CSV-friendly format
 */
export function exportAsCSV(): string {
  const headers = [
    'ID',
    'Kategori',
    'Etiket',
    'Açıklama',
    'Birim',
    'Değer',
    'Kaynak',
    'Güncelleme',
    'Güvenilirlik',
    'Doğrulanmış',
    'Notlar',
  ].join(',');

  const rows = COST_DATABASE.map(item => [
    item.id,
    item.category,
    `"${item.label}"`,
    `"${item.description}"`,
    item.unit,
    item.value,
    item.sourceLabel,
    item.lastUpdated,
    item.confidence,
    item.validatedValue ?? '',
    `"${item.notes ?? ''}"`,
  ].join(','));

  return [headers, ...rows].join('\n');
}

// =============================================================================
// DATABASE INFO
// =============================================================================

export const COST_DATABASE_INFO = {
  version: '2.0.0',
  lastUpdated: '2025-12-07',
  itemCount: COST_DATABASE.length,
  validatedCount: getValidatedItems().length,
  qualityLevel: 'ÖZGÜNTUR Standard (Single Tier)',
  baseProject: {
    name: 'ÖZGÜNTUR RELIFE UNIQUE',
    location: 'Antalya',
    units: 64,
    unitType: '3+1',
    netAreaPerUnit: '118-122 m²',
  },
  sources: [
    { name: 'ÖZGÜNTUR Real Project', type: 'gercekProje', confidence: 'yuksek' },
    { name: 'Sektör Ortalaması', type: 'sektor', confidence: 'orta' },
    { name: 'İnşaat Hesabı', type: 'sektor', url: 'https://insaathesabi.com/' },
    { name: 'Sanal Şantiye', type: 'sektor', url: 'https://www.sanalsantiye.com/' },
  ],
  keyCorrections: [
    { parameter: 'NET/BRÜT Oranı', old: 0.85, new: 0.77, reason: 'Real project data shows 76.9%' },
    { parameter: 'Banyo Sayısı', old: 1, new: 2, reason: '3+1 units have 2 bathrooms' },
    { parameter: 'Aydınlatma', old: 50, new: 74, reason: '74 fixtures per 120m² unit' },
  ],
};
