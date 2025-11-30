/**
 * Unit Types and Characteristics for Optimal Mix Calculation
 * 
 * Price multipliers are based on Turkish real estate market data:
 * - Smaller units (1+1, 2+1) typically command 5-15% higher price per m²
 * - Larger units (4+1, villas) may have lower per-m² but higher total value
 * - Location type affects optimal mix (tourist vs family areas)
 */

import { ProjectType } from '../types';

export interface UnitTypeData {
  id: string;
  label: string;           // "1+1", "2+1", "3+1", "Villa"
  labelTR: string;         // Turkish label
  avgSize: number;         // Average m² per unit
  minSize: number;         // Minimum practical size
  maxSize: number;         // Maximum practical size
  priceMultiplier: number; // Multiplier vs base price (1.0 = base)
  demandByLocation: {
    tourist: number;       // 1-10 demand in tourist areas
    family: number;        // 1-10 demand in family areas
    luxury: number;        // 1-10 demand in luxury areas
    suburban: number;      // 1-10 demand in suburban areas
  };
  targetBuyer: string;     // Description of target buyer
  applicableProjectTypes: ProjectType[];
}

/**
 * Standard apartment unit types
 */
export const APARTMENT_UNIT_TYPES: UnitTypeData[] = [
  {
    id: 'studio',
    label: 'Studio',
    labelTR: 'Stüdyo',
    avgSize: 45,
    minSize: 35,
    maxSize: 55,
    priceMultiplier: 1.15, // 15% premium per m² (high demand, efficient)
    demandByLocation: {
      tourist: 9,    // Very popular for short-term rentals
      family: 3,     // Low demand from families
      luxury: 5,     // Moderate in luxury (pied-à-terre)
      suburban: 2,   // Low demand
    },
    targetBuyer: 'Yatırımcı, kısa dönem kiralama, bekar profesyoneller',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed', 'mixed_use'],
  },
  {
    id: '1+1',
    label: '1+1',
    labelTR: '1+1 Daire',
    avgSize: 65,
    minSize: 55,
    maxSize: 80,
    priceMultiplier: 1.12, // 12% premium (very popular)
    demandByLocation: {
      tourist: 10,   // Highest demand for rentals
      family: 4,     // Young couples
      luxury: 6,     // Investment units
      suburban: 3,   // Limited demand
    },
    targetBuyer: 'Yatırımcı, genç çiftler, bekarlar',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed', 'mixed_use'],
  },
  {
    id: '2+1',
    label: '2+1',
    labelTR: '2+1 Daire',
    avgSize: 95,
    minSize: 80,
    maxSize: 120,
    priceMultiplier: 1.08, // 8% premium (balanced demand)
    demandByLocation: {
      tourist: 8,    // Good for family rentals
      family: 9,     // High demand
      luxury: 7,     // Popular choice
      suburban: 7,   // Good demand
    },
    targetBuyer: 'Küçük aileler, çiftler, yatırımcı',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed', 'mixed_use'],
  },
  {
    id: '3+1',
    label: '3+1',
    labelTR: '3+1 Daire',
    avgSize: 130,
    minSize: 110,
    maxSize: 160,
    priceMultiplier: 1.0, // Base price (reference)
    demandByLocation: {
      tourist: 5,    // Less suitable for short-term
      family: 10,    // Highest family demand
      luxury: 8,     // Good demand
      suburban: 9,   // Very popular
    },
    targetBuyer: 'Aileler, uzun dönem ikamet',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed', 'mixed_use'],
  },
  {
    id: '4+1',
    label: '4+1',
    labelTR: '4+1 Daire',
    avgSize: 170,
    minSize: 150,
    maxSize: 200,
    priceMultiplier: 0.95, // 5% discount per m² (larger units)
    demandByLocation: {
      tourist: 3,    // Limited demand
      family: 8,     // Large families
      luxury: 9,     // Luxury segment
      suburban: 6,   // Moderate demand
    },
    targetBuyer: 'Büyük aileler, lüks segment',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed', 'mixed_use'],
  },
  {
    id: '5+1',
    label: '5+1',
    labelTR: '5+1 Daire',
    avgSize: 220,
    minSize: 190,
    maxSize: 280,
    priceMultiplier: 0.92, // 8% discount (niche market)
    demandByLocation: {
      tourist: 2,
      family: 6,
      luxury: 8,
      suburban: 4,
    },
    targetBuyer: 'Çok büyük aileler, penthouse arayanlar',
    applicableProjectTypes: ['apartment', 'apartment_with_pool', 'mixed'],
  },
];

/**
 * Villa unit types
 */
export const VILLA_UNIT_TYPES: UnitTypeData[] = [
  {
    id: 'villa_small',
    label: 'Small Villa',
    labelTR: 'Küçük Villa (2+1)',
    avgSize: 150,
    minSize: 120,
    maxSize: 180,
    priceMultiplier: 1.05, // Slight premium for efficiency
    demandByLocation: {
      tourist: 7,
      family: 6,
      luxury: 5,
      suburban: 8,
    },
    targetBuyer: 'Çiftler, emekliler, tatil evi arayanlar',
    applicableProjectTypes: ['villa', 'villa_with_pool', 'mixed'],
  },
  {
    id: 'villa_medium',
    label: 'Medium Villa',
    labelTR: 'Orta Villa (3+1)',
    avgSize: 200,
    minSize: 180,
    maxSize: 250,
    priceMultiplier: 1.0, // Base price
    demandByLocation: {
      tourist: 8,
      family: 9,
      luxury: 7,
      suburban: 9,
    },
    targetBuyer: 'Aileler, tatil evi yatırımcıları',
    applicableProjectTypes: ['villa', 'villa_with_pool', 'mixed'],
  },
  {
    id: 'villa_large',
    label: 'Large Villa',
    labelTR: 'Büyük Villa (4+1)',
    avgSize: 280,
    minSize: 250,
    maxSize: 350,
    priceMultiplier: 0.95, // Slight discount for size
    demandByLocation: {
      tourist: 6,
      family: 8,
      luxury: 9,
      suburban: 7,
    },
    targetBuyer: 'Büyük aileler, lüks segment',
    applicableProjectTypes: ['villa', 'villa_with_pool', 'mixed'],
  },
  {
    id: 'villa_luxury',
    label: 'Luxury Villa',
    labelTR: 'Lüks Villa (5+1)',
    avgSize: 400,
    minSize: 350,
    maxSize: 500,
    priceMultiplier: 0.90, // Niche market
    demandByLocation: {
      tourist: 4,
      family: 5,
      luxury: 10,
      suburban: 4,
    },
    targetBuyer: 'Ultra lüks segment, yabancı yatırımcılar',
    applicableProjectTypes: ['villa', 'villa_with_pool'],
  },
];

/**
 * Commercial unit types
 */
export const COMMERCIAL_UNIT_TYPES: UnitTypeData[] = [
  {
    id: 'shop_small',
    label: 'Small Shop',
    labelTR: 'Küçük Dükkan',
    avgSize: 50,
    minSize: 30,
    maxSize: 80,
    priceMultiplier: 1.25, // High premium for retail
    demandByLocation: {
      tourist: 8,
      family: 6,
      luxury: 7,
      suburban: 5,
    },
    targetBuyer: 'Perakende yatırımcıları, küçük işletmeler',
    applicableProjectTypes: ['commercial', 'mixed_use'],
  },
  {
    id: 'shop_medium',
    label: 'Medium Shop',
    labelTR: 'Orta Dükkan',
    avgSize: 100,
    minSize: 80,
    maxSize: 150,
    priceMultiplier: 1.15,
    demandByLocation: {
      tourist: 7,
      family: 7,
      luxury: 8,
      suburban: 6,
    },
    targetBuyer: 'Zincir mağazalar, orta ölçekli işletmeler',
    applicableProjectTypes: ['commercial', 'mixed_use'],
  },
  {
    id: 'office_small',
    label: 'Small Office',
    labelTR: 'Küçük Ofis',
    avgSize: 60,
    minSize: 40,
    maxSize: 100,
    priceMultiplier: 1.10,
    demandByLocation: {
      tourist: 4,
      family: 5,
      luxury: 8,
      suburban: 6,
    },
    targetBuyer: 'Serbest meslek, küçük şirketler',
    applicableProjectTypes: ['commercial', 'mixed_use'],
  },
  {
    id: 'office_medium',
    label: 'Medium Office',
    labelTR: 'Orta Ofis',
    avgSize: 150,
    minSize: 100,
    maxSize: 250,
    priceMultiplier: 1.0,
    demandByLocation: {
      tourist: 3,
      family: 4,
      luxury: 9,
      suburban: 5,
    },
    targetBuyer: 'Orta ölçekli şirketler',
    applicableProjectTypes: ['commercial', 'mixed_use'],
  },
];

/**
 * Get unit types applicable for a project type
 */
export function getUnitTypesForProject(projectType: ProjectType): UnitTypeData[] {
  switch (projectType) {
    case 'apartment':
    case 'apartment_with_pool':
      return APARTMENT_UNIT_TYPES;
    case 'villa':
    case 'villa_with_pool':
      return VILLA_UNIT_TYPES;
    case 'commercial':
      return COMMERCIAL_UNIT_TYPES;
    case 'mixed':
      return [...APARTMENT_UNIT_TYPES, ...VILLA_UNIT_TYPES.slice(0, 2)];
    case 'mixed_use':
      return [...APARTMENT_UNIT_TYPES.slice(0, 4), ...COMMERCIAL_UNIT_TYPES.slice(0, 2)];
    default:
      return APARTMENT_UNIT_TYPES;
  }
}

/**
 * Get location type from location name
 */
export function getLocationType(location: string): 'tourist' | 'family' | 'luxury' | 'suburban' {
  const touristAreas = ['Konyaaltı Sahil', 'Lara', 'Belek', 'Kemer', 'Kundu', 'Alanya Merkez'];
  const luxuryAreas = ['Lara', 'Konyaaltı Sahil', 'Belek'];
  const suburbanAreas = ['Kepez', 'Döşemealtı', 'Varsak'];
  
  if (luxuryAreas.includes(location)) return 'luxury';
  if (touristAreas.includes(location)) return 'tourist';
  if (suburbanAreas.includes(location)) return 'suburban';
  return 'family'; // Default for residential areas like Muratpaşa
}

/**
 * Get all unit types
 */
export function getAllUnitTypes(): UnitTypeData[] {
  return [...APARTMENT_UNIT_TYPES, ...VILLA_UNIT_TYPES, ...COMMERCIAL_UNIT_TYPES];
}
