import { CostParameter } from '../types/costParameters';
import { QualityLevel } from '../types';

/**
 * DETAILED CONSTRUCTION COST PARAMETERS
 * Based on 2024 Turkish construction market data
 * All prices in TRY (Turkish Lira)
 */
export const COST_PARAMETERS: CostParameter[] = [
  // === STRUCTURE (Kaba Yapı) ===
  {
    id: 'structural_frame',
    category: 'structure',
    label: 'Structural Frame',
    labelTR: 'Betonarme Karkas',
    description: 'Reinforced concrete frame, columns, beams, slabs',
    unit: 'TL/m²',
    defaultValue: 5400,
    userValue: null,
    effectiveValue: 5400,
  rangeByQuality: {
    standard: { min: 4500, max: 6000, default: 5400 },
    mid:      { min: 5500, max: 7500, default: 6500 },
    luxury:   { min: 7000, max: 10000, default: 8500 },
  },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'foundation',
    category: 'structure',
    label: 'Foundation',
    labelTR: 'Temel',
    description: 'Foundation, excavation, waterproofing',
    unit: 'TL/m²',
    defaultValue: 1800,
    userValue: null,
    effectiveValue: 1800,
    rangeByQuality: {
      standard:    { min: 1500, max: 2200, default: 1800 },
      mid: { min: 1800, max: 2800, default: 2200 },
      luxury:      { min: 2500, max: 4000, default: 3000 },
    },
    appliesTo: 'land_sqm',
    source: 'default',
    isAdvanced: false,
  },

  // === ENVELOPE (Dış Cephe) ===
  {
    id: 'external_walls',
    category: 'envelope',
    label: 'External Walls',
    labelTR: 'Dış Duvarlar',
    description: 'Brick/block walls, insulation, plaster',
    unit: 'TL/m²',
    defaultValue: 2200,
    userValue: null,
    effectiveValue: 2200,
    rangeByQuality: {
      standard:    { min: 1800, max: 2800, default: 2200 },
      mid: { min: 2500, max: 3500, default: 3000 },
      luxury:      { min: 3500, max: 5500, default: 4500 },
    },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'windows_doors',
    category: 'envelope',
    label: 'Windows & Doors',
    labelTR: 'Pencere ve Kapılar',
    description: 'External windows, entrance doors, balcony doors',
    unit: 'TL/m²',
    defaultValue: 1500,
    userValue: null,
    effectiveValue: 1500,
    rangeByQuality: {
      standard:    { min: 1200, max: 2000, default: 1500 },
      mid: { min: 2000, max: 3500, default: 2800 },  // Thermal break
      luxury:      { min: 3500, max: 6000, default: 4800 },  // Triple glaze
    },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'roof',
    category: 'envelope',
    label: 'Roof',
    labelTR: 'Çatı',
    description: 'Roof structure, waterproofing, insulation',
    unit: 'TL/m²',
    defaultValue: 800,
    userValue: null,
    effectiveValue: 800,
    rangeByQuality: {
      standard:    { min: 600, max: 1000, default: 800 },
      mid: { min: 900, max: 1400, default: 1100 },
      luxury:      { min: 1400, max: 2200, default: 1800 },
    },
    appliesTo: 'land_sqm',  // Roof area ≈ land footprint
    source: 'default',
    isAdvanced: true,
  },

  // === MEP (Mekanik/Elektrik/Sıhhi Tesisat) ===
  {
    id: 'hvac',
    category: 'mep',
    label: 'HVAC / Cooling',
    labelTR: 'İklimlendirme',
    description: 'Heating, ventilation, air conditioning',
    unit: 'TL/m²',
    defaultValue: 1800,
    userValue: null,
    effectiveValue: 1800,
    rangeByQuality: {
      standard:    { min: 1200, max: 2000, default: 1500 },   // Split units
      mid: { min: 2200, max: 3500, default: 2800 },   // VRF system
      luxury:      { min: 3500, max: 5500, default: 4500 },   // Central + underfloor
    },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'electrical',
    category: 'mep',
    label: 'Electrical',
    labelTR: 'Elektrik Tesisatı',
    description: 'Wiring, panels, lighting, smart systems',
    unit: 'TL/m²',
    defaultValue: 1200,
    userValue: null,
    effectiveValue: 1200,
    rangeByQuality: {
      standard:    { min: 900, max: 1500, default: 1200 },
      mid: { min: 1400, max: 2200, default: 1800 },
      luxury:      { min: 2200, max: 4000, default: 3000 },   // Smart home
    },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'plumbing',
    category: 'mep',
    label: 'Plumbing',
    labelTR: 'Sıhhi Tesisat',
    description: 'Water supply, drainage, fixtures',
    unit: 'TL/m²',
    defaultValue: 1000,
    userValue: null,
    effectiveValue: 1000,
    rangeByQuality: {
      standard:    { min: 800, max: 1300, default: 1000 },
      mid: { min: 1200, max: 1800, default: 1500 },
      luxury:      { min: 1800, max: 3000, default: 2400 },
    },
    appliesTo: 'gross_sqm',
    source: 'default',
    isAdvanced: false,
  },

  // === INTERIOR (İç Mekan) ===
  {
    id: 'flooring',
    category: 'interior',
    label: 'Flooring',
    labelTR: 'Zemin Kaplaması',
    description: 'Floor finishes - tile, parquet, marble',
    unit: 'TL/m²',
    defaultValue: 1500,
    userValue: null,
    effectiveValue: 1500,
    rangeByQuality: {
      standard:    { min: 800, max: 1500, default: 1100 },    // Local ceramic
      mid: { min: 1500, max: 2800, default: 2000 },   // Imported porcelain
      luxury:      { min: 3000, max: 6000, default: 4500 },   // Marble/premium
    },
    appliesTo: 'net_sqm',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'kitchen',
    category: 'interior',
    label: 'Kitchen',
    labelTR: 'Mutfak',
    description: 'Cabinets, countertops, appliances',
    unit: 'TL',
    defaultValue: 150000,
    userValue: null,
    effectiveValue: 150000,
    rangeByQuality: {
      standard:    { min: 80000, max: 150000, default: 100000 },
      mid: { min: 150000, max: 300000, default: 200000 },
      luxury:      { min: 300000, max: 800000, default: 500000 },
    },
    appliesTo: 'fixed',  // Per unit, multiply by numUnits
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'bathroom',
    category: 'interior',
    label: 'Bathroom (per unit)',
    labelTR: 'Banyo (birim başına)',
    description: 'Tiles, fixtures, fittings per bathroom',
    unit: 'TL',
    defaultValue: 80000,
    userValue: null,
    effectiveValue: 80000,
    rangeByQuality: {
      standard:    { min: 40000, max: 80000, default: 60000 },
      mid: { min: 80000, max: 150000, default: 110000 },
      luxury:      { min: 150000, max: 350000, default: 250000 },
    },
    appliesTo: 'fixed',  // Per bathroom, estimate 2 per unit
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'interior_doors',
    category: 'interior',
    label: 'Interior Doors',
    labelTR: 'İç Kapılar',
    description: 'Room doors, frames, hardware',
    unit: 'TL/m²',
    defaultValue: 400,
    userValue: null,
    effectiveValue: 400,
    rangeByQuality: {
      standard:    { min: 250, max: 450, default: 350 },
      mid: { min: 400, max: 700, default: 550 },
      luxury:      { min: 700, max: 1500, default: 1000 },
    },
    appliesTo: 'net_sqm',
    source: 'default',
    isAdvanced: true,
  },
  {
    id: 'painting',
    category: 'interior',
    label: 'Painting & Wall Finishes',
    labelTR: 'Boya ve Duvar Kaplaması',
    description: 'Interior paint, wallpaper, decorative finishes',
    unit: 'TL/m²',
    defaultValue: 350,
    userValue: null,
    effectiveValue: 350,
    rangeByQuality: {
      standard:    { min: 200, max: 400, default: 300 },
      mid: { min: 350, max: 600, default: 450 },
      luxury:      { min: 600, max: 1200, default: 850 },
    },
    appliesTo: 'net_sqm',
    source: 'default',
    isAdvanced: true,
  },

  // === SITE (Saha İşleri) ===
  {
    id: 'landscaping',
    category: 'site',
    label: 'Landscaping',
    labelTR: 'Peyzaj',
    description: 'Garden, walkways, outdoor lighting',
    unit: 'TL/m²',
    defaultValue: 500,
    userValue: null,
    effectiveValue: 500,
    rangeByQuality: {
      standard:    { min: 300, max: 600, default: 400 },
      mid: { min: 500, max: 1000, default: 750 },
      luxury:      { min: 1000, max: 2000, default: 1500 },
    },
    appliesTo: 'land_sqm',
    source: 'default',
    isAdvanced: true,
  },
  {
    id: 'pool',
    category: 'site',
    label: 'Swimming Pool',
    labelTR: 'Yüzme Havuzu',
    description: 'Pool construction, equipment, decking',
    unit: 'TL',
    defaultValue: 750000,
    userValue: null,
    effectiveValue: 750000,
    rangeByQuality: {
      standard:    { min: 400000, max: 700000, default: 550000 },
      mid: { min: 600000, max: 1000000, default: 800000 },
      luxury:      { min: 1000000, max: 2500000, default: 1500000 },
    },
    appliesTo: 'fixed',
    source: 'default',
    isAdvanced: false,
  },

  // === SOFT COSTS (Yumuşak Maliyetler) ===
  {
    id: 'design_fees',
    category: 'soft',
    label: 'Design & Engineering',
    labelTR: 'Proje ve Mühendislik',
    description: 'Architect, structural, MEP design fees',
    unit: '%',
    defaultValue: 3,
    userValue: null,
    effectiveValue: 3,
    rangeByQuality: {
      standard:    { min: 2, max: 4, default: 3 },
      mid: { min: 3, max: 5, default: 4 },
      luxury:      { min: 4, max: 7, default: 5 },
    },
    appliesTo: 'subtotal',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'permits',
    category: 'soft',
    label: 'Permits & Fees',
    labelTR: 'İzin ve Harçlar',
    description: 'Building permits, municipal fees',
    unit: '%',
    defaultValue: 1.5,
    userValue: null,
    effectiveValue: 1.5,
    rangeByQuality: {
      standard:    { min: 1, max: 2, default: 1.5 },
      mid: { min: 1, max: 2, default: 1.5 },
      luxury:      { min: 1.5, max: 2.5, default: 2 },
    },
    appliesTo: 'subtotal',
    source: 'default',
    isAdvanced: true,
  },

  // === FINANCIAL (Finansal) ===
  {
    id: 'contingency',
    category: 'financial',
    label: 'Contingency',
    labelTR: 'Beklenmeyen Giderler',
    description: 'Risk buffer for unexpected costs',
    unit: '%',
    defaultValue: 12,
    userValue: null,
    effectiveValue: 12,
    rangeByQuality: {
      standard:    { min: 8, max: 15, default: 10 },
      mid: { min: 10, max: 18, default: 12 },
      luxury:      { min: 12, max: 20, default: 15 },
    },
    appliesTo: 'subtotal',
    source: 'default',
    isAdvanced: false,
  },
  {
    id: 'contractor_margin',
    category: 'financial',
    label: 'Contractor OH&P',
    labelTR: 'Müteahhit Kar Marjı',
    description: 'Contractor overhead and profit',
    unit: '%',
    defaultValue: 10,
    userValue: null,
    effectiveValue: 10,
    rangeByQuality: {
      standard:    { min: 8, max: 12, default: 10 },
      mid: { min: 8, max: 12, default: 10 },
      luxury:      { min: 10, max: 15, default: 12 },
    },
    appliesTo: 'subtotal',
    source: 'default',
    isAdvanced: false,
  },
];

/**
 * Get cost parameters with effective values calculated for a specific quality level
 */
export function getCostParametersForQuality(
  qualityLevel: QualityLevel,
  userOverrides: Record<string, number> = {}
): CostParameter[] {
  return COST_PARAMETERS.map(param => {
    const range = param.rangeByQuality[qualityLevel];
    const userValue = userOverrides[param.id] ?? null;
    const effectiveValue = userValue ?? range.default;

    return {
      ...param,
      userValue,
      effectiveValue,
    };
  });
}

/**
 * Calculate total construction cost from parameters
 */
export function calculateTotalCostFromParameters(
  parameters: CostParameter[],
  grossSqm: number,
  netSqm: number,
  landSqm: number,
  numUnits: number = 1
): {
  totalCost: number;
  breakdown: Record<string, number>;
} {
  let subtotal = 0;
  const breakdown: Record<string, number> = {};

  // First pass: calculate base costs
  parameters.forEach(param => {
    let cost = 0;
    switch (param.appliesTo) {
      case 'gross_sqm':
        cost = param.effectiveValue * grossSqm;
        break;
      case 'net_sqm':
        cost = param.effectiveValue * netSqm;
        break;
      case 'land_sqm':
        cost = param.effectiveValue * landSqm;
        break;
      case 'fixed':
        cost = param.effectiveValue * numUnits; // For per-unit items
        break;
      case 'subtotal':
        // Will be calculated in second pass
        return;
    }
    subtotal += cost;
    breakdown[param.id] = cost;
  });

  // Second pass: percentage-based costs
  parameters.forEach(param => {
    if (param.appliesTo === 'subtotal') {
      const cost = subtotal * (param.effectiveValue / 100);
      subtotal += cost;
      breakdown[param.id] = cost;
    }
  });

  return {
    totalCost: subtotal,
    breakdown,
  };
}

/**
 * QUALITY PRESET DESCRIPTIONS
 * Helps users understand what each quality level includes
 */
export const QUALITY_PRESETS: Record<string, {
  standard: { description: string; features: string[] };
  mid: { description: string; features: string[] };
  luxury: { description: string; features: string[] };
}> = {
  windows_doors: {
    standard: {
      description: 'PVC, çift cam, beyaz',
      features: ['Standart PVC profil', 'Çift cam (4+12+4)', 'Beyaz renk'],
    },
    mid: {
      description: 'Isı yalıtımlı PVC, low-e cam',
      features: ['Termal kesik profil', 'Low-E cam', 'Antrasit/Beyaz seçenekli'],
    },
    luxury: {
      description: 'Alüminyum minimal, üçlü cam',
      features: ['Alüminyum minimal profil', 'Üçlü cam', 'RAL renk seçimi', 'Akıllı ev entegrasyonu'],
    },
  },
  flooring: {
    standard: {
      description: 'Laminat parke veya yerli seramik',
      features: ['8mm laminat', 'AC4 sınıfı', 'Yerli seramik 60x60'],
    },
    mid: {
      description: 'İthal porselen veya kaliteli parke',
      features: ['60x60 ithal porselen', 'Mat/Parlak seçimi', 'Kaliteli laminat parke'],
    },
    luxury: {
      description: 'Doğal taş veya masif ahşap',
      features: ['Mermer', 'Masif parke', 'Isıtmalı zemin', 'Özel desenler'],
    },
  },
  hvac: {
    standard: {
      description: 'Split klima sistemi',
      features: ['Duvar tipi split', 'Oda başına ayrı ünite', 'Inverter teknoloji'],
    },
    mid: {
      description: 'VRF sistem veya merkezi klima',
      features: ['VRF sistem', 'Gizli tavan üniteleri', 'Merkezi kontrol'],
    },
    luxury: {
      description: 'Merkezi sistem + yerden ısıtma',
      features: ['Merkezi ısıtma/soğutma', 'Yerden ısıtma', 'Akıllı termostat', 'Hava kalitesi sensörleri'],
    },
  },
  kitchen: {
    standard: {
      description: 'MDF mutfak, yerli beyaz eşya',
      features: ['MDF kapak', 'Laminat tezgah', 'Yerli marka beyaz eşya', 'Standart armatür'],
    },
    mid: {
      description: 'Lake mutfak, ithal beyaz eşya',
      features: ['Lake kapak', 'Kuvars tezgah', 'Bosch/Siemens beyaz eşya', 'Paslanmaz armatür'],
    },
    luxury: {
      description: 'İtalyan mutfak, premium beyaz eşya',
      features: ['İtalyan tasarım', 'Mermer tezgah', 'Miele/Gaggenau', 'Akıllı buzdolabı', 'Şarap dolabı'],
    },
  },
  bathroom: {
    standard: {
      description: 'Yerli seramik, standart vitrifiye',
      features: ['Yerli seramik', 'Standart klozet', 'Duşakabin', 'Yerli armatür'],
    },
    mid: {
      description: 'İthal seramik, kaliteli vitrifiye',
      features: ['İthal seramik', 'Asma klozet', 'Cam duşakabin', 'Grohe/Hansgrohe armatür'],
    },
    luxury: {
      description: 'Premium seramik, tasarım vitrifiye',
      features: ['Büyük format porselenler', 'Akıllı klozet', 'Walk-in duş', 'Duravit/Villeroy & Boch', 'Jakuzi'],
    },
  },
  electrical: {
    standard: {
      description: 'Standart elektrik tesisatı',
      features: ['Standart priz/anahtar', 'LED aydınlatma', 'Temel güvenlik sistemi'],
    },
    mid: {
      description: 'Kaliteli tesisat, akıllı aydınlatma',
      features: ['Schneider/Legrand', 'Dimmerli aydınlatma', 'Kamera sistemi', 'Jeneratör bağlantısı'],
    },
    luxury: {
      description: 'Akıllı ev sistemi',
      features: ['Akıllı ev otomasyonu', 'Ses kontrollü sistemler', 'Entegre güvenlik', 'Ev sinema sistemi'],
    },
  },
  external_walls: {
    standard: {
      description: 'Tuğla duvar, mantolama',
      features: ['Tuğla/Gazbeton', '5cm EPS mantolama', 'Akrilik dış cephe boyası'],
    },
    mid: {
      description: 'Kaliteli yalıtım, kompozit cephe',
      features: ['8cm XPS yalıtım', 'Kompozit cephe paneli', 'Su bazlı boya'],
    },
    luxury: {
      description: 'Premium cephe sistemleri',
      features: ['10cm+ yalıtım', 'Doğal taş kaplama', 'Cam cephe sistemi', 'Havalandırmalı cephe'],
    },
  },
  structural_frame: {
    standard: {
      description: 'C25 beton, standart donatı',
      features: ['C25/30 beton', 'S420 donatı', 'Standart kalıp sistemi'],
    },
    mid: {
      description: 'C30 beton, optimize donatı',
      features: ['C30/37 beton', 'Optimize donatı planı', 'Tünel kalıp sistemi'],
    },
    luxury: {
      description: 'Yüksek dayanımlı beton',
      features: ['C35+ beton', 'Özel katkılı beton', 'Deprem izolatörü', 'Premium kalıp sistemi'],
    },
  },
};

/**
 * Get quality preset description for a parameter
 */
export function getQualityPresetDescription(
  parameterId: string,
  qualityLevel: QualityLevel
): { description: string; features: string[] } | null {
  const preset = QUALITY_PRESETS[parameterId];
  if (!preset) return null;
  return preset[qualityLevel] || null;
}
