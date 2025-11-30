import { SalesParameter } from '../types/salesParameters';
import { getLocationData, LocationData } from './antalyaLocations';
import { ProjectType, QualityLevel } from '../types';

/**
 * SALES & MARKET PARAMETERS
 * Based on 2024 Antalya real estate market data
 * 
 * These parameters are initialized from location data when available,
 * and can be overridden by the user.
 */

/**
 * Get base sales price from location data based on project type
 */
function getBasePriceFromLocation(
  locationData: LocationData | undefined, 
  projectType: ProjectType
): number {
  if (!locationData) {
    return 42000; // Default fallback
  }
  
  switch (projectType) {
    case 'villa':
    case 'villa_with_pool':
      return locationData.prices.salesPriceVilla;
    case 'apartment':
    case 'apartment_with_pool':
      return locationData.prices.salesPriceApartment;
    case 'commercial':
      return locationData.prices.salesPriceApartment * 1.25;
    case 'mixed_use':
    case 'mixed':
    default:
      return (locationData.prices.salesPriceApartment + locationData.prices.salesPriceVilla) / 2;
  }
}

/**
 * Get location multiplier based on location characteristics
 */
function getLocationMultiplier(locationData: LocationData | undefined): number {
  if (!locationData) {
    return 1.0;
  }
  
  let multiplier = 1.0;
  
  // Beach access premium
  if (locationData.infrastructure.beachAccess) {
    multiplier += 0.10;
  }
  
  // View quality premium (scaled 0-10% based on score)
  multiplier += (locationData.infrastructure.viewQuality / 100);
  
  // Demand level adjustment
  switch (locationData.market.demandLevel) {
    case 'very_high': multiplier += 0.05; break;
    case 'high': multiplier += 0.02; break;
    case 'medium': break;
    case 'low': multiplier -= 0.05; break;
  }
  
  return multiplier;
}

/**
 * Get quality multiplier based on quality level
 */
function getQualityMultiplier(qualityLevel: QualityLevel): number {
  switch (qualityLevel) {
    case 'standard': return 0.85;
    case 'mid': return 1.0;
    case 'luxury': return 1.25;
    default: return 1.0;
  }
}

/**
 * Get amenity premium based on project type
 */
function getAmenityPremium(projectType: ProjectType): number {
  if (projectType.includes('pool')) {
    return 10; // 10% for pool projects
  }
  return 5; // 5% default
}

/**
 * Create base sales parameters template
 */
function createBaseSalesParameters(): SalesParameter[] {
  return [
    {
      id: 'base_price_sqm',
      label: 'Base Price per m²',
      labelTR: 'Bölge Baz Fiyatı',
      description: 'Current average sale price in district',
      unit: 'TL/m²',
      defaultValue: 42000,
      userValue: null,
      effectiveValue: 42000,
      source: 'district_data',
      editable: true,
      min: 15000,
      max: 200000,
    },
    {
      id: 'location_multiplier',
      label: 'Location Premium',
      labelTR: 'Konum Çarpanı',
      description: 'Premium for beachfront, views, tourism proximity',
      unit: 'x',
      defaultValue: 1.0,
      userValue: null,
      effectiveValue: 1.0,
      source: 'district_data',
      editable: true,
      min: 0.8,
      max: 2.0,
    },
    {
      id: 'quality_multiplier',
      label: 'Quality Premium',
      labelTR: 'Kalite Çarpanı',
      description: 'Price multiplier for selected quality level',
      unit: 'x',
      defaultValue: 1.0,
      userValue: null,
      effectiveValue: 1.0,
      source: 'default',
      editable: true,
      min: 0.8,
      max: 2.5,
    },
    {
      id: 'amenity_premium',
      label: 'Amenity Premium',
      labelTR: 'Tesis Primi',
      description: 'Extra value for pool, gym, security, etc.',
      unit: '%',
      defaultValue: 5,
      userValue: null,
      effectiveValue: 5,
      source: 'calculated',
      editable: true,
      min: 0,
      max: 25,
    },
    {
      id: 'market_condition',
      label: 'Market Condition',
      labelTR: 'Pazar Koşulu',
      description: 'Current market sentiment multiplier',
      unit: 'x',
      defaultValue: 1.0,
      userValue: null,
      effectiveValue: 1.0,
      source: 'default',
      editable: true,
      min: 0.7,
      max: 1.3,
    },
  ];
}

/**
 * Get sales parameters initialized from location data
 * This is the main function to use when you have location context
 */
export function getSalesParametersForLocation(
  location: string,
  projectType: ProjectType,
  qualityLevel: QualityLevel,
  userOverrides: Record<string, number> = {}
): SalesParameter[] {
  const locationData = getLocationData(location);
  const baseParams = createBaseSalesParameters();
  
  // Calculate location-aware defaults
  const locationDefaults: Record<string, number> = {
    base_price_sqm: getBasePriceFromLocation(locationData, projectType),
    location_multiplier: getLocationMultiplier(locationData),
    quality_multiplier: getQualityMultiplier(qualityLevel),
    amenity_premium: getAmenityPremium(projectType),
    market_condition: 1.0,
  };
  
  return baseParams.map(param => {
    const locationDefault = locationDefaults[param.id] ?? param.defaultValue;
    const userValue = userOverrides[param.id] ?? null;
    const effectiveValue = userValue ?? locationDefault;
    
    return {
      ...param,
      defaultValue: locationDefault,
      userValue,
      effectiveValue,
      source: userValue !== null ? 'user' : (locationData ? 'district_data' : 'default'),
    };
  });
}

/**
 * Get sales parameters with user overrides applied (legacy function)
 * Kept for backwards compatibility
 */
export function getSalesParameters(
  userOverrides: Record<string, number> = {}
): SalesParameter[] {
  const baseParams = createBaseSalesParameters();
  return baseParams.map(param => ({
    ...param,
    userValue: userOverrides[param.id] ?? null,
    effectiveValue: userOverrides[param.id] ?? param.defaultValue,
  }));
}

/**
 * Calculate final sales price from parameters
 */
export function calculateSalesPriceFromParameters(
  parameters: SalesParameter[],
  netSqm: number
): {
  basePricePerSqm: number;
  finalPricePerSqm: number;
  totalValue: number;
  multipliers: Record<string, number>;
} {
  const basePrice = parameters.find(p => p.id === 'base_price_sqm')?.effectiveValue ?? 42000;
  let multiplier = 1;

  const multipliers: Record<string, number> = {};

  parameters.forEach(param => {
    if (param.id !== 'base_price_sqm') {
      if (param.unit === 'x') {
        multiplier *= param.effectiveValue;
        multipliers[param.id] = param.effectiveValue;
      } else if (param.unit === '%') {
        multiplier *= (1 + param.effectiveValue / 100);
        multipliers[param.id] = param.effectiveValue / 100;
      }
    }
  });

  const finalPricePerSqm = basePrice * multiplier;
  const totalValue = finalPricePerSqm * netSqm;

  return {
    basePricePerSqm: basePrice,
    finalPricePerSqm,
    totalValue,
    multipliers,
  };
}
