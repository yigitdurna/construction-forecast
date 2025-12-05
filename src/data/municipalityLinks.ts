/**
 * Municipality İmar Sorgu (Zoning Query) Links Configuration
 *
 * Provides links to municipality websites where users can manually lookup
 * İmar Durumu (zoning status) for their parcels.
 *
 * All Antalya municipalities use NetCAD-based systems with JavaScript
 * anti-scraping protection, making API automation impossible.
 */

export interface MunicipalityLinkConfig {
  district: string;
  name: string;
  imarUrl: string;
  system: 'KEOS' | 'KBS';
  typicalTaks: number;
  typicalKaks: number;
  typicalKatAdedi: number;
  note: string;
  instructions: string[];
}

/**
 * Municipality links and typical values for Antalya districts
 */
export const MUNICIPALITY_IMAR_LINKS: Record<
  string,
  MunicipalityLinkConfig
> = {
  kepez: {
    district: 'kepez',
    name: 'Kepez Belediyesi',
    imarUrl: 'https://keos.kepez-bld.gov.tr/imardurumu/',
    system: 'KEOS',
    typicalTaks: 0.30,
    typicalKaks: 0.60,
    typicalKatAdedi: 2,
    note: 'KEOS Kent Bilgi Sistemi kullanır',
    instructions: [
      'Kepez İmar Sorgu sayfasını açın',
      'Mahalle, Ada, Parsel bilgilerini girin',
      'Sorgula butonuna tıklayın',
      'İmar Durumu Belgesinde TAKS, KAKS ve Kat Adedi değerlerini bulun',
      'Bu değerleri uygulamamıza girin',
    ],
  },
  muratpasa: {
    district: 'muratpasa',
    name: 'Muratpaşa Belediyesi',
    imarUrl: 'https://keos.muratpasa-bld.gov.tr/imardurumu/',
    system: 'KEOS',
    typicalTaks: 0.35,
    typicalKaks: 1.05,
    typicalKatAdedi: 3,
    note: 'KEOS Kent Bilgi Sistemi kullanır',
    instructions: [
      'Muratpaşa İmar Sorgu sayfasını açın',
      'Mahalle, Ada, Parsel bilgilerini girin',
      'Sorgula butonuna tıklayın',
      'İmar Durumu Belgesinde TAKS, EMSAL/KAKS ve Kat Adedi değerlerini bulun',
      'Bu değerleri uygulamamıza girin',
    ],
  },
  konyaalti: {
    district: 'konyaalti',
    name: 'Konyaaltı Belediyesi',
    imarUrl: 'https://harita.konyaalti.bel.tr/imardurumu/',
    system: 'KEOS',
    typicalTaks: 0.30,
    typicalKaks: 0.90,
    typicalKatAdedi: 3,
    note: 'KEOS Kent Bilgi Sistemi kullanır',
    instructions: [
      'Konyaaltı İmar Sorgu sayfasını açın',
      'Mahalle, Ada, Parsel bilgilerini girin',
      'Sorgula butonuna tıklayın',
      'İmar Durumu Belgesinde TAKS, KAKS ve Kat Adedi değerlerini bulun',
      'Bu değerleri uygulamamıza girin',
    ],
  },
  // Fallback for other districts
  default: {
    district: 'default',
    name: 'Antalya Büyükşehir Belediyesi',
    imarUrl: 'https://kbs.antalya.bel.tr/imardurumu/',
    system: 'KBS',
    typicalTaks: 0.30,
    typicalKaks: 1.00,
    typicalKatAdedi: 3,
    note: 'KBS Kent Bilgi Sistemi kullanır',
    instructions: [
      'İmar sorgu sayfasını açın',
      'Ada, Parsel bilgilerini girin',
      'Sorgula butonuna tıklayın',
      'İmar Durumu Belgesinde TAKS, KAKS/EMSAL ve Kat Adedi değerlerini bulun',
      'Bu değerleri uygulamamıza girin',
    ],
  },
};

/**
 * Get municipality config for a district
 *
 * @param ilce - District name (kepez, muratpasa, konyaalti, etc.)
 * @returns Municipality configuration
 */
export function getMunicipalityConfig(
  ilce: string
): MunicipalityLinkConfig {
  const normalized = ilce.toLowerCase().trim();
  return (
    MUNICIPALITY_IMAR_LINKS[normalized] || MUNICIPALITY_IMAR_LINKS.default
  );
}

/**
 * Get typical İmar values for a district
 * Useful for placeholder values and examples
 *
 * @param ilce - District name
 * @returns Typical TAKS, KAKS, Kat Adedi
 */
export function getTypicalImarValues(ilce: string): {
  taks: number;
  kaks: number;
  katAdedi: number;
} {
  const config = getMunicipalityConfig(ilce);
  return {
    taks: config.typicalTaks,
    kaks: config.typicalKaks,
    katAdedi: config.typicalKatAdedi,
  };
}

/**
 * Format İmar query URL with ada/parsel (for direct linking if supported)
 *
 * Note: Most municipalities don't support direct URL parameters due to
 * session-based authentication, but this can be useful for bookmarking.
 *
 * @param ilce - District name
 * @param ada - Ada (block) number
 * @param parsel - Parsel (parcel) number
 * @returns İmar query URL (may not include parameters)
 */
export function getImarQueryUrl(
  ilce: string,
  _ada?: string,
  _parsel?: string
): string {
  const config = getMunicipalityConfig(ilce);

  // Most municipality systems don't support URL parameters
  // Return base URL for user to manually enter ada/parsel
  return config.imarUrl;
}

/**
 * Example İmar values by building type
 */
export const EXAMPLE_IMAR_VALUES = {
  villa: {
    name: 'Villa (Müstakil Ev)',
    taks: 0.30,
    kaks: 0.60,
    katAdedi: 2,
    description: 'Tipik villa projesi (2 katlı müstakil)',
  },
  apartmentLow: {
    name: 'Düşük Katlı Apartman',
    taks: 0.35,
    kaks: 1.05,
    katAdedi: 3,
    description: '3 katlı konut binası',
  },
  apartmentMid: {
    name: 'Orta Katlı Apartman',
    taks: 0.30,
    kaks: 1.50,
    katAdedi: 5,
    description: '5 katlı konut binası',
  },
  apartmentHigh: {
    name: 'Yüksek Katlı Apartman',
    taks: 0.25,
    kaks: 2.00,
    katAdedi: 8,
    description: '8 katlı konut binası',
  },
};
