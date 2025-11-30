import dataConfig from '../data/dataConfig.json';

/**
 * Data quality and source information
 */
export interface DataSourceInfo {
  value: number;
  source: string;
  lastUpdated: string;
  confidenceLevel: 'high' | 'medium' | 'low';
  isOutdated: boolean;
  daysOld: number;
}

/**
 * Calculate how many days old a date string is
 */
function getDaysOld(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Check if data is outdated (> 90 days old)
 */
function isDataOutdated(dateString: string): boolean {
  return getDaysOld(dateString) > 90;
}

/**
 * Get construction cost with source information
 */
export function getConstructionCostWithSource(quality: 'standard' | 'mid' | 'luxury'): DataSourceInfo {
  const costData = dataConfig.constructionCosts;
  const qualityData = costData.pricePerSqm[quality];

  return {
    value: qualityData.value,
    source: `${costData.dataSource} - ${qualityData.source}`,
    lastUpdated: costData.lastUpdated,
    confidenceLevel: costData.confidenceLevel as 'high' | 'medium' | 'low',
    isOutdated: isDataOutdated(costData.lastUpdated),
    daysOld: getDaysOld(costData.lastUpdated),
  };
}

/**
 * Get land price with source information
 */
export function getLandPriceWithSource(location: string): DataSourceInfo {
  const landData = dataConfig.landPrices;
  const normalizedLocation = location.toLowerCase().trim();
  const districtData = landData.districtPrices[normalizedLocation as keyof typeof landData.districtPrices] || landData.districtPrices.default;

  return {
    value: districtData.pricePerSqm,
    source: `${landData.dataSource} - ${districtData.source}`,
    lastUpdated: districtData.lastUpdated,
    confidenceLevel: landData.confidenceLevel as 'high' | 'medium' | 'low',
    isOutdated: isDataOutdated(districtData.lastUpdated),
    daysOld: getDaysOld(districtData.lastUpdated),
  };
}

/**
 * Get sales price with source information
 */
export function getSalesPriceWithSource(
  projectType: 'apartment' | 'villa' | 'mixed',
  quality: 'standard' | 'mid' | 'luxury'
): DataSourceInfo {
  const salesData = dataConfig.salesPrices;
  const priceData = salesData.pricePerSqm[projectType][quality];

  return {
    value: priceData.value,
    source: `${salesData.dataSource} - ${priceData.source}`,
    lastUpdated: salesData.lastUpdated,
    confidenceLevel: salesData.confidenceLevel as 'high' | 'medium' | 'low',
    isOutdated: isDataOutdated(salesData.lastUpdated),
    daysOld: getDaysOld(salesData.lastUpdated),
  };
}

/**
 * Get inflation rate with source information
 */
export function getInflationRateWithSource(): DataSourceInfo {
  const inflationData = dataConfig.economicIndicators.inflation.monthly;

  return {
    value: inflationData.value,
    source: inflationData.source,
    lastUpdated: inflationData.lastUpdated,
    confidenceLevel: inflationData.confidenceLevel as 'high' | 'medium' | 'low',
    isOutdated: isDataOutdated(inflationData.lastUpdated),
    daysOld: getDaysOld(inflationData.lastUpdated),
  };
}

/**
 * Get property appreciation rate with source information
 */
export function getAppreciationRateWithSource(): DataSourceInfo {
  const appreciationData = dataConfig.economicIndicators.propertyAppreciation.monthly;

  return {
    value: appreciationData.value,
    source: appreciationData.source,
    lastUpdated: appreciationData.lastUpdated,
    confidenceLevel: appreciationData.confidenceLevel as 'high' | 'medium' | 'low',
    isOutdated: isDataOutdated(appreciationData.lastUpdated),
    daysOld: getDaysOld(appreciationData.lastUpdated),
  };
}

/**
 * Get all data sources summary for display
 */
export function getAllDataSources() {
  return {
    metadata: dataConfig.metadata,
    constructionCosts: {
      source: dataConfig.constructionCosts.dataSource,
      lastUpdated: dataConfig.constructionCosts.lastUpdated,
      confidence: dataConfig.constructionCosts.confidenceLevel,
      updateFrequency: dataConfig.constructionCosts.updateFrequency,
      isOutdated: isDataOutdated(dataConfig.constructionCosts.lastUpdated),
      daysOld: getDaysOld(dataConfig.constructionCosts.lastUpdated),
    },
    landPrices: {
      source: dataConfig.landPrices.dataSource,
      lastUpdated: dataConfig.landPrices.lastUpdated,
      confidence: dataConfig.landPrices.confidenceLevel,
      updateFrequency: dataConfig.landPrices.updateFrequency,
      isOutdated: isDataOutdated(dataConfig.landPrices.lastUpdated),
      daysOld: getDaysOld(dataConfig.landPrices.lastUpdated),
    },
    salesPrices: {
      source: dataConfig.salesPrices.dataSource,
      lastUpdated: dataConfig.salesPrices.lastUpdated,
      confidence: dataConfig.salesPrices.confidenceLevel,
      updateFrequency: dataConfig.salesPrices.updateFrequency,
      isOutdated: isDataOutdated(dataConfig.salesPrices.lastUpdated),
      daysOld: getDaysOld(dataConfig.salesPrices.lastUpdated),
    },
    economicIndicators: {
      inflation: {
        source: dataConfig.economicIndicators.inflation.monthly.source,
        lastUpdated: dataConfig.economicIndicators.inflation.monthly.lastUpdated,
        confidence: dataConfig.economicIndicators.inflation.monthly.confidenceLevel,
        isOutdated: isDataOutdated(dataConfig.economicIndicators.inflation.monthly.lastUpdated),
        daysOld: getDaysOld(dataConfig.economicIndicators.inflation.monthly.lastUpdated),
      },
      appreciation: {
        source: dataConfig.economicIndicators.propertyAppreciation.monthly.source,
        lastUpdated: dataConfig.economicIndicators.propertyAppreciation.monthly.lastUpdated,
        confidence: dataConfig.economicIndicators.propertyAppreciation.monthly.confidenceLevel,
        isOutdated: isDataOutdated(dataConfig.economicIndicators.propertyAppreciation.monthly.lastUpdated),
        daysOld: getDaysOld(dataConfig.economicIndicators.propertyAppreciation.monthly.lastUpdated),
      },
    },
    dataQuality: dataConfig.dataQuality,
  };
}

/**
 * Get confidence level badge color
 */
export function getConfidenceBadgeColor(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high':
      return 'bg-green-100 text-green-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get confidence level label in Turkish
 */
export function getConfidenceLabelTR(level: 'high' | 'medium' | 'low'): string {
  switch (level) {
    case 'high':
      return 'Yüksek';
    case 'medium':
      return 'Orta';
    case 'low':
      return 'Düşük';
    default:
      return 'Bilinmiyor';
  }
}

/**
 * Format date in Turkish locale
 */
export function formatDateTR(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
