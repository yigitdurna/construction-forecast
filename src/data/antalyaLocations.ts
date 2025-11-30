/**
 * Antalya Real Estate Market Data
 * Updated: November 2025
 * IMPORTANT: This data should be updated monthly for accuracy
 *
 * Data sources:
 * - Türkiye İstatistik Kurumu (TÜİK) - Q3 2025
 * - Emlak Konut GYO - November 2025
 * - Zingat, Sahibinden, Hepsiemlak market averages - November 2025
 * - Local construction industry reports - Q4 2025
 * - Antalya Ticaret Odası - Market analysis
 * - Central Bank of Turkey - Real estate price index
 */

export interface LocationData {
  id: string;
  name: string;
  district: string;
  region: 'center' | 'coastal' | 'developing' | 'suburban';

  // Geographic Information
  geo?: {
    latitude?: number;
    longitude?: number;
    postalCode?: string;
    neighborhoods?: string[]; // Mahalleler
  };

  // Market Prices (TRY per m²)
  prices: {
    landPrice: number; // Arsa fiyatı
    salesPriceApartment: number; // Daire satış fiyatı
    salesPriceVilla: number; // Villa satış fiyatı
    rentalYield: number; // Kira getirisi (yıllık %)
    priceRange?: { // Optional price ranges for more accuracy
      min: number;
      max: number;
    };
  };

  // Market Conditions
  market: {
    demandLevel: 'very_high' | 'high' | 'medium' | 'low';
    supplyLevel: 'oversupply' | 'balanced' | 'undersupply';
    priceGrowthTrend: number; // Yıllık % artış trendi
    constructionActivity: 'very_active' | 'active' | 'moderate' | 'slow';
    foreignBuyerInterest: 'very_high' | 'high' | 'medium' | 'low';
    averageSaleTime?: number; // Ortalama satış süresi (ay)
    inventoryMonths?: number; // Kaç aylık envanter var
  };

  // Infrastructure & Quality
  infrastructure: {
    transportScore: number; // 1-10
    socialFacilities: number; // 1-10 (okul, hastane, AVM)
    beachAccess: boolean;
    viewQuality: number; // 1-10
    distanceToCenter?: number; // Merkeze km
    distanceToAirport?: number; // Havalimanına km
    distanceToBeach?: number; // Sahile km (if not beachfront)
  };

  // Investment Risk & Potential
  investment: {
    riskLevel: 'low' | 'medium' | 'high';
    developmentPotential: 'excellent' | 'good' | 'moderate' | 'limited';
    liquidity: 'high' | 'medium' | 'low'; // Satış kolaylığı
    projectedROI?: number; // Tahmini 5 yıllık ROI %
  };

  // Features & Characteristics
  features?: {
    seaView: boolean;
    mountainView: boolean;
    cityView: boolean;
    touristArea: boolean;
    historicArea: boolean;
    luxurySegment: boolean;
  };

  lastUpdated: string;
  dataConfidence: 'high' | 'medium' | 'estimated'; // Data güvenilirlik seviyesi
}

export const ANTALYA_LOCATIONS: LocationData[] = [
  // MERKEZ - Konyaaltı Sahil
  {
    id: 'konyaalti-sahil',
    name: 'Konyaaltı Sahil',
    district: 'Konyaaltı',
    region: 'coastal',
    prices: {
      landPrice: 45000,
      salesPriceApartment: 85000,
      salesPriceVilla: 120000,
      rentalYield: 4.2,
    },
    market: {
      demandLevel: 'very_high',
      supplyLevel: 'balanced',
      priceGrowthTrend: 18,
      constructionActivity: 'very_active',
      foreignBuyerInterest: 'very_high',
    },
    infrastructure: {
      transportScore: 9,
      socialFacilities: 9,
      beachAccess: true,
      viewQuality: 10,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'good',
      liquidity: 'high',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // MERKEZ - Lara
  {
    id: 'lara',
    name: 'Lara',
    district: 'Muratpaşa',
    region: 'coastal',
    geo: {
      latitude: 36.8569,
      longitude: 30.7848,
      postalCode: '07230',
      neighborhoods: ['Lara', 'Güzeloba', 'Fener'],
    },
    prices: {
      landPrice: 55000,
      salesPriceApartment: 95000,
      salesPriceVilla: 140000,
      rentalYield: 4.5,
      priceRange: {
        min: 85000,
        max: 110000,
      },
    },
    market: {
      demandLevel: 'very_high',
      supplyLevel: 'undersupply',
      priceGrowthTrend: 22,
      constructionActivity: 'very_active',
      foreignBuyerInterest: 'very_high',
      averageSaleTime: 3,
      inventoryMonths: 4,
    },
    infrastructure: {
      transportScore: 8,
      socialFacilities: 9,
      beachAccess: true,
      viewQuality: 10,
      distanceToCenter: 12,
      distanceToAirport: 8,
      distanceToBeach: 0,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'excellent',
      liquidity: 'high',
      projectedROI: 85,
    },
    features: {
      seaView: true,
      mountainView: true,
      cityView: false,
      touristArea: true,
      historicArea: false,
      luxurySegment: true,
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // MERKEZ - Muratpaşa Center
  {
    id: 'muratpasa-merkez',
    name: 'Muratpaşa Merkez',
    district: 'Muratpaşa',
    region: 'center',
    prices: {
      landPrice: 35000,
      salesPriceApartment: 65000,
      salesPriceVilla: 90000,
      rentalYield: 5.0,
    },
    market: {
      demandLevel: 'high',
      supplyLevel: 'balanced',
      priceGrowthTrend: 15,
      constructionActivity: 'active',
      foreignBuyerInterest: 'medium',
    },
    infrastructure: {
      transportScore: 10,
      socialFacilities: 10,
      beachAccess: false,
      viewQuality: 6,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'moderate',
      liquidity: 'high',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // GELIŞEN - Kepez
  {
    id: 'kepez',
    name: 'Kepez',
    district: 'Kepez',
    region: 'developing',
    prices: {
      landPrice: 18000,
      salesPriceApartment: 35000,
      salesPriceVilla: 50000,
      rentalYield: 6.5,
    },
    market: {
      demandLevel: 'high',
      supplyLevel: 'oversupply',
      priceGrowthTrend: 20,
      constructionActivity: 'very_active',
      foreignBuyerInterest: 'low',
    },
    infrastructure: {
      transportScore: 7,
      socialFacilities: 8,
      beachAccess: false,
      viewQuality: 7,
    },
    investment: {
      riskLevel: 'medium',
      developmentPotential: 'excellent',
      liquidity: 'medium',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // GELIŞEN - Döşemealtı
  {
    id: 'dosemealt',
    name: 'Döşemealtı',
    district: 'Döşemealtı',
    region: 'developing',
    prices: {
      landPrice: 12000,
      salesPriceApartment: 28000,
      salesPriceVilla: 45000,
      rentalYield: 7.0,
    },
    market: {
      demandLevel: 'medium',
      supplyLevel: 'balanced',
      priceGrowthTrend: 25,
      constructionActivity: 'active',
      foreignBuyerInterest: 'low',
    },
    infrastructure: {
      transportScore: 6,
      socialFacilities: 7,
      beachAccess: false,
      viewQuality: 8,
    },
    investment: {
      riskLevel: 'medium',
      developmentPotential: 'excellent',
      liquidity: 'medium',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // KUZEY SAHIL - Belek
  {
    id: 'belek',
    name: 'Belek',
    district: 'Serik',
    region: 'coastal',
    prices: {
      landPrice: 60000,
      salesPriceApartment: 110000,
      salesPriceVilla: 180000,
      rentalYield: 3.8,
    },
    market: {
      demandLevel: 'very_high',
      supplyLevel: 'undersupply',
      priceGrowthTrend: 20,
      constructionActivity: 'moderate',
      foreignBuyerInterest: 'very_high',
    },
    infrastructure: {
      transportScore: 7,
      socialFacilities: 8,
      beachAccess: true,
      viewQuality: 10,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'good',
      liquidity: 'high',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // DOĞU SAHIL - Alanya Merkez
  {
    id: 'alanya-merkez',
    name: 'Alanya Merkez',
    district: 'Alanya',
    region: 'coastal',
    prices: {
      landPrice: 28000,
      salesPriceApartment: 55000,
      salesPriceVilla: 85000,
      rentalYield: 5.5,
    },
    market: {
      demandLevel: 'high',
      supplyLevel: 'oversupply',
      priceGrowthTrend: 16,
      constructionActivity: 'active',
      foreignBuyerInterest: 'very_high',
    },
    infrastructure: {
      transportScore: 8,
      socialFacilities: 9,
      beachAccess: true,
      viewQuality: 9,
    },
    investment: {
      riskLevel: 'medium',
      developmentPotential: 'moderate',
      liquidity: 'high',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // BATI SAHIL - Kemer
  {
    id: 'kemer',
    name: 'Kemer',
    district: 'Kemer',
    region: 'coastal',
    prices: {
      landPrice: 38000,
      salesPriceApartment: 70000,
      salesPriceVilla: 110000,
      rentalYield: 4.0,
    },
    market: {
      demandLevel: 'high',
      supplyLevel: 'balanced',
      priceGrowthTrend: 17,
      constructionActivity: 'moderate',
      foreignBuyerInterest: 'high',
    },
    infrastructure: {
      transportScore: 7,
      socialFacilities: 7,
      beachAccess: true,
      viewQuality: 10,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'good',
      liquidity: 'medium',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // YENİ GELİŞEN - Kundu
  {
    id: 'kundu',
    name: 'Kundu',
    district: 'Aksu',
    region: 'coastal',
    prices: {
      landPrice: 42000,
      salesPriceApartment: 75000,
      salesPriceVilla: 115000,
      rentalYield: 4.3,
    },
    market: {
      demandLevel: 'high',
      supplyLevel: 'balanced',
      priceGrowthTrend: 19,
      constructionActivity: 'very_active',
      foreignBuyerInterest: 'high',
    },
    infrastructure: {
      transportScore: 8,
      socialFacilities: 8,
      beachAccess: true,
      viewQuality: 9,
    },
    investment: {
      riskLevel: 'low',
      developmentPotential: 'excellent',
      liquidity: 'high',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },

  // YENİ GELİŞEN - Varsak (Konyaaltı İç)
  {
    id: 'varsak',
    name: 'Varsak',
    district: 'Konyaaltı',
    region: 'suburban',
    prices: {
      landPrice: 22000,
      salesPriceApartment: 45000,
      salesPriceVilla: 65000,
      rentalYield: 5.8,
    },
    market: {
      demandLevel: 'medium',
      supplyLevel: 'balanced',
      priceGrowthTrend: 18,
      constructionActivity: 'active',
      foreignBuyerInterest: 'low',
    },
    infrastructure: {
      transportScore: 7,
      socialFacilities: 8,
      beachAccess: false,
      viewQuality: 9,
    },
    investment: {
      riskLevel: 'medium',
      developmentPotential: 'good',
      liquidity: 'medium',
    },
    lastUpdated: '2025-11',
    dataConfidence: 'high',
  },
];

/**
 * Get location data by name (case-insensitive, partial match)
 */
export function getLocationData(locationName: string): LocationData | undefined {
  const searchTerm = locationName.toLowerCase().trim();

  return ANTALYA_LOCATIONS.find(loc =>
    loc.name.toLowerCase().includes(searchTerm) ||
    loc.district.toLowerCase().includes(searchTerm) ||
    loc.id.toLowerCase().includes(searchTerm)
  );
}

/**
 * Get all location names for dropdown/autocomplete
 */
export function getAllLocationNames(): string[] {
  return ANTALYA_LOCATIONS.map(loc => loc.name);
}

/**
 * Calculate market condition index (0-100)
 * Higher = better market conditions for investment
 */
export function calculateMarketIndex(location: LocationData): number {
  const demandScore = {
    very_high: 25,
    high: 20,
    medium: 12,
    low: 5,
  }[location.market.demandLevel];

  const supplyScore = {
    oversupply: 5,
    balanced: 15,
    undersupply: 25,
  }[location.market.supplyLevel];

  const liquidityScore = {
    high: 20,
    medium: 12,
    low: 5,
  }[location.investment.liquidity];

  const riskScore = {
    low: 15,
    medium: 10,
    high: 5,
  }[location.investment.riskLevel];

  const infrastructureScore = (
    location.infrastructure.transportScore +
    location.infrastructure.socialFacilities +
    location.infrastructure.viewQuality
  ) / 3 * 1.5; // Max 15

  return Math.round(demandScore + supplyScore + liquidityScore + riskScore + infrastructureScore);
}
