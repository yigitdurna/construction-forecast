import { ProjectType, QualityLevel } from '../types'
import { getLocationData } from './antalyaLocations'

/**
 * REFERENCE DATA - 2024 Antalya Region Estimates
 * These are DEFAULT values used as fallback when location data is not available
 * All prices in Turkish Lira (TRY)
 */

// Construction costs per m² based on quality level (TRY/m²)
export const CONSTRUCTION_COSTS: Record<QualityLevel, number> = {
  standard: 8000,  // Basic quality construction
  mid: 12000,      // Mid-range quality
  luxury: 18000,   // High-end luxury construction
}

// Average sales prices per m² by project type and quality (TRY/m²)
export const SALES_PRICES: Record<ProjectType, Record<QualityLevel, number>> = {
  apartment: {
    standard: 35000,
    mid: 50000,
    luxury: 75000,
  },
  apartment_with_pool: {
    standard: 38000,
    mid: 55000,
    luxury: 82000,
  },
  villa: {
    standard: 40000,
    mid: 60000,
    luxury: 100000,
  },
  villa_with_pool: {
    standard: 45000,
    mid: 68000,
    luxury: 115000,
  },
  mixed: {
    standard: 37000,
    mid: 55000,
    luxury: 85000,
  },
  commercial: {
    standard: 45000,
    mid: 65000,
    luxury: 95000,
  },
  mixed_use: {
    standard: 42000,
    mid: 62000,
    luxury: 92000,
  },
}

// Average land prices per m² in Antalya region (TRY/m²)
export const LAND_PRICES: Record<string, number> = {
  default: 5000,
  // Can be expanded with specific district prices
  'merkez': 7000,
  'konyaaltı': 8000,
  'lara': 6500,
  'kepez': 4500,
  'aksu': 4000,
}

// Percentage-based additional costs
export const COST_MULTIPLIERS = {
  permitsAndFees: 0.08,    // 8% of construction cost
  design: 0.05,            // 5% of construction cost
  contingency: 0.10,       // 10% of total costs (buffer)
}

// Average unit sizes for estimation (m²)
export const AVERAGE_UNIT_SIZES: Record<ProjectType, number> = {
  apartment: 120,  // Average apartment size
  apartment_with_pool: 130,  // Slightly larger with pool facilities
  villa: 200,      // Average villa size
  villa_with_pool: 220,  // Larger villa with pool
  mixed: 140,      // Mixed development average
  commercial: 100,  // Commercial unit (shop/office)
  mixed_use: 120,  // Mixed use average
}

/**
 * Get land price for a specific location
 * Uses real market data from antalyaLocations.ts if available
 * Falls back to default if location not found
 */
export function getLandPrice(location: string): number {
  // Try to get real location data first
  const locationData = getLocationData(location)
  if (locationData) {
    return locationData.prices.landPrice
  }

  // Fallback to old lookup table
  const normalizedLocation = location.toLowerCase().trim()
  return LAND_PRICES[normalizedLocation] || LAND_PRICES.default
}

/**
 * Get construction cost per m² based on quality
 */
export function getConstructionCost(quality: QualityLevel): number {
  return CONSTRUCTION_COSTS[quality]
}

/**
 * Get sales price per m² based on project type, quality, and location
 * Uses real market data from antalyaLocations.ts if available
 */
export function getSalesPrice(projectType: ProjectType, quality: QualityLevel, location?: string): number {
  // If location is provided, try to get real market data
  if (location) {
    const locationData = getLocationData(location)
    if (locationData) {
      // Use location-specific pricing based on project type
      switch (projectType) {
        case 'villa':
          return locationData.prices.salesPriceVilla
        case 'villa_with_pool':
          return locationData.prices.salesPriceVilla * 1.15 // 15% premium for pool
        case 'apartment':
          return locationData.prices.salesPriceApartment
        case 'apartment_with_pool':
          return locationData.prices.salesPriceApartment * 1.08 // 8% premium for pool
        case 'commercial':
          return locationData.prices.salesPriceApartment * 1.25 // Commercial premium
        case 'mixed_use':
          return (locationData.prices.salesPriceApartment * 1.15 + locationData.prices.salesPriceVilla) / 2
        case 'mixed':
        default:
          // For mixed, use average of apartment and villa
          return (locationData.prices.salesPriceApartment + locationData.prices.salesPriceVilla) / 2
      }
    }
  }

  // Fallback to default lookup table
  return SALES_PRICES[projectType][quality]
}
