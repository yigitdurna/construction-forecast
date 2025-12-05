/**
 * useImarCache Hook
 *
 * React hook for caching manual İmar entries in localStorage
 * Allows users to avoid re-entering data for previously looked-up parcels
 */

import { useState, useCallback, useEffect } from 'react';
import type { ManualImarParams } from '../utils/imarValidation';

/**
 * Cached İmar data structure
 */
export interface CachedImarData {
  parselKey: string; // Format: "ilce-ada-parsel" e.g., "kepez-6960-4"
  ilce: string;
  ada: string;
  parsel: string;
  parselAlani?: number; // Optional: from TKGM
  imarData: ManualImarParams;
  enteredAt: Date;
}

/**
 * localStorage key for İmar cache
 */
const CACHE_KEY = 'construction-forecast-imar-cache';

/**
 * Cache expiry time (90 days)
 */
const CACHE_EXPIRY_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Generate parsel key for caching
 *
 * @param ilce - District
 * @param ada - Block number
 * @param parsel - Parcel number
 * @returns Cache key
 */
export function getParselKey(ilce: string, ada: string, parsel: string): string {
  return `${ilce.toLowerCase()}-${ada}-${parsel}`;
}

/**
 * Load entire cache from localStorage
 *
 * @returns Map of parsel keys to cached data
 */
function loadCache(): Map<string, CachedImarData> {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (!stored) {
      return new Map();
    }

    const parsed = JSON.parse(stored);
    const cache = new Map<string, CachedImarData>();

    // Convert plain object to Map and parse dates
    for (const [key, value] of Object.entries(parsed)) {
      const entry = value as any;
      cache.set(key, {
        ...entry,
        enteredAt: new Date(entry.enteredAt),
      });
    }

    return cache;
  } catch (error) {
    console.error('Failed to load İmar cache:', error);
    return new Map();
  }
}

/**
 * Save cache to localStorage
 *
 * @param cache - Cache map to save
 */
function saveCache(cache: Map<string, CachedImarData>): void {
  try {
    // Convert Map to plain object for JSON serialization
    const obj: Record<string, CachedImarData> = {};
    cache.forEach((value, key) => {
      obj[key] = value;
    });

    localStorage.setItem(CACHE_KEY, JSON.stringify(obj));
  } catch (error) {
    console.error('Failed to save İmar cache:', error);
  }
}

/**
 * Remove expired entries from cache
 *
 * @param cache - Cache to clean
 * @returns Cleaned cache
 */
function cleanExpiredEntries(
  cache: Map<string, CachedImarData>
): Map<string, CachedImarData> {
  const now = new Date().getTime();
  const cleaned = new Map(cache);

  cache.forEach((entry, key) => {
    const enteredTime = new Date(entry.enteredAt).getTime();
    if (now - enteredTime > CACHE_EXPIRY_MS) {
      cleaned.delete(key);
    }
  });

  return cleaned;
}

/**
 * Hook options
 */
export interface UseImarCacheOptions {
  ilce?: string;
  ada?: string;
  parsel?: string;
}

/**
 * Hook return type
 */
export interface ImarCacheState {
  // Current cached entry (if exists for current parsel)
  cachedEntry: CachedImarData | null;

  // Actions
  saveEntry: (
    ilce: string,
    ada: string,
    parsel: string,
    imarData: ManualImarParams,
    parselAlani?: number
  ) => void;
  getEntry: (ilce: string, ada: string, parsel: string) => CachedImarData | null;
  clearEntry: (ilce: string, ada: string, parsel: string) => void;
  clearAll: () => void;

  // Statistics
  cacheSize: number;
  hasCache: boolean;
}

/**
 * React hook for İmar cache management
 *
 * @param options - Hook options
 * @returns Cache state and actions
 */
export function useImarCache(options: UseImarCacheOptions = {}): ImarCacheState {
  const { ilce, ada, parsel } = options;

  const [cache, setCache] = useState<Map<string, CachedImarData>>(() => {
    const loaded = loadCache();
    return cleanExpiredEntries(loaded);
  });

  // Get cached entry for current parsel (if provided)
  const cachedEntry =
    ilce && ada && parsel ? cache.get(getParselKey(ilce, ada, parsel)) || null : null;

  /**
   * Save İmar data to cache
   */
  const saveEntry = useCallback(
    (
      ilce: string,
      ada: string,
      parsel: string,
      imarData: ManualImarParams,
      parselAlani?: number
    ) => {
      const parselKey = getParselKey(ilce, ada, parsel);
      const entry: CachedImarData = {
        parselKey,
        ilce,
        ada,
        parsel,
        parselAlani,
        imarData,
        enteredAt: new Date(),
      };

      setCache((prevCache) => {
        const newCache = new Map(prevCache);
        newCache.set(parselKey, entry);
        saveCache(newCache);
        return newCache;
      });
    },
    []
  );

  /**
   * Get cached entry for a parsel
   */
  const getEntry = useCallback(
    (ilce: string, ada: string, parsel: string): CachedImarData | null => {
      const parselKey = getParselKey(ilce, ada, parsel);
      return cache.get(parselKey) || null;
    },
    [cache]
  );

  /**
   * Clear specific parsel from cache
   */
  const clearEntry = useCallback((ilce: string, ada: string, parsel: string) => {
    const parselKey = getParselKey(ilce, ada, parsel);

    setCache((prevCache) => {
      const newCache = new Map(prevCache);
      newCache.delete(parselKey);
      saveCache(newCache);
      return newCache;
    });
  }, []);

  /**
   * Clear all cache
   */
  const clearAll = useCallback(() => {
    setCache(new Map());
    localStorage.removeItem(CACHE_KEY);
  }, []);

  // Clean expired entries periodically (on mount)
  useEffect(() => {
    const cleaned = cleanExpiredEntries(cache);
    if (cleaned.size !== cache.size) {
      setCache(cleaned);
      saveCache(cleaned);
    }
  }, []); // Run once on mount

  return {
    cachedEntry,
    saveEntry,
    getEntry,
    clearEntry,
    clearAll,
    cacheSize: cache.size,
    hasCache: cache.size > 0,
  };
}

/**
 * Get all cached entries (for debugging/admin)
 *
 * @returns Array of all cached entries
 */
export function getAllCachedEntries(): CachedImarData[] {
  const cache = loadCache();
  return Array.from(cache.values());
}

/**
 * Export cache as JSON (for backup)
 *
 * @returns JSON string of cache
 */
export function exportCache(): string {
  const entries = getAllCachedEntries();
  return JSON.stringify(entries, null, 2);
}

/**
 * Import cache from JSON (for restore)
 *
 * @param json - JSON string to import
 */
export function importCache(json: string): void {
  try {
    const entries: CachedImarData[] = JSON.parse(json);
    const cache = new Map<string, CachedImarData>();

    entries.forEach((entry) => {
      cache.set(entry.parselKey, {
        ...entry,
        enteredAt: new Date(entry.enteredAt),
      });
    });

    saveCache(cache);
  } catch (error) {
    console.error('Failed to import cache:', error);
    throw new Error('Geçersiz cache verisi');
  }
}
