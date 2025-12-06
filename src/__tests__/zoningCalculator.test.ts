/**
 * Zoning Calculator Tests
 *
 * Comprehensive test suite for Turkish zoning calculations
 */

import { describe, it, expect } from 'vitest';
import {
  calculateZoning,
  validateZoningParams,
  calculateEffectiveKAKS,
  calculateRequiredParselArea,
  calculateAreaBreakdown,
  formatZoningSummary,
} from '../services/zoningCalculator';
import type { ZoningParams } from '../types/zoning';

describe('Zoning Calculator', () => {
  describe('validateZoningParams', () => {
    it('should pass validation for valid parameters', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors).toHaveLength(0);
    });

    it('should reject negative parsel alanı', () => {
      const params: ZoningParams = {
        parselAlani: -100,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_parsel_area')).toBe(true);
    });

    it('should reject zero parsel alanı', () => {
      const params: ZoningParams = {
        parselAlani: 0,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_parsel_area')).toBe(true);
    });

    it('should reject TAKS > 1.0', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 1.5,
        kaks: 2.0,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'taks_exceeds_limit')).toBe(true);
    });

    it('should reject negative TAKS', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: -0.3,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_taks')).toBe(true);
    });

    it('should reject negative KAKS', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: -1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_kaks')).toBe(true);
    });

    it('should reject çıkma katsayısı < 1.0', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 0.5,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_cikma')).toBe(true);
    });

    it('should reject invalid maxYukseklik', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
        maxYukseklik: -10,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.type === 'invalid_height')).toBe(true);
    });

    it('should handle Infinity and NaN values', () => {
      const params: ZoningParams = {
        parselAlani: Infinity,
        taks: NaN,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const errors = validateZoningParams(params);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('calculateZoning - Test Case from Prompt', () => {
    it('should match expected results for Ada 6960, Parsel 4 (Muratpaşa, Güzeloba)', () => {
      // Test case from PHASE_2_1_FOUNDATION.md
      // Formula: Parsel × KAKS × Çıkma (simple multiplication)
      // Source: Antalya Büyükşehir Belediyesi İmar Yönetmeliği (1999)
      // Verified: Muratpaşa KEOS and Kent Konseyi 2025 report
      const params: ZoningParams = {
        parselAlani: 2146,    // m²
        taks: 0.30,
        kaks: 0.60,           // EMSAL
        cikmaKatsayisi: 1.70,
        maxYukseklik: 17.50,  // meters
      };

      const result = calculateZoning(params);

      // Expected results:
      // tabanAlani = 2146 × 0.30 = 643.8 m²
      expect(result.tabanAlani).toBeCloseTo(643.8, 1);

      // toplamInsaatAlani = 2146 × 0.60 × 1.70 = 2188.92 m²
      // Example from Kent Konseyi 2025: 1087 × 0.80 × 1.70 = 1478.32 m²
      expect(result.toplamInsaatAlani).toBeCloseTo(2188.92, 1);

      // katAdedi = 0.60 / 0.30 = 2 floors
      // (also: 17.50m / 3m ≈ 5.8 floors, but KAKS limits to 2)
      expect(result.katAdedi).toBe(2);

      // Should NOT be height limited (KAKS is more restrictive)
      expect(result.isHeightLimited).toBe(false);
      expect(result.isFloorLimited).toBe(false);

      // Kat başına alan = taban alanı
      expect(result.katBasinaAlan).toBeCloseTo(643.8, 1);

      // Emsal dışı max = 30% of total
      expect(result.emsalDisiMax).toBeCloseTo(2188.92 * 0.30, 1);

      // Validate applied coefficients
      expect(result.appliedTAKS).toBe(0.30);
      expect(result.appliedKAKS).toBe(0.60);
      expect(result.appliedCikma).toBe(1.70);
    });
  });

  describe('calculateZoning - Standard Cases', () => {
    it('should calculate correctly for typical residential project', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const result = calculateZoning(params);

      // Taban Alanı = 1000 × 0.30 = 300 m²
      expect(result.tabanAlani).toBe(300);

      // Toplam İnşaat = 1000 × 1.50 × 1.60 = 2400 m²
      expect(result.toplamInsaatAlani).toBeCloseTo(2400, 1);

      // Kat Adedi = 1.50 / 0.30 = 5 floors
      expect(result.katAdedi).toBe(5);

      // Emsal Dışı Max = 2400 × 0.30 = 720 m²
      expect(result.emsalDisiMax).toBeCloseTo(720, 1);

      // Brüt Kullanım = 2400 - 720 = 1680 m²
      expect(result.brutKullanimAlani).toBeCloseTo(1680, 1);

      // Net Kullanım = 1680 × 0.85 = 1428 m²
      expect(result.netKullanimAlani).toBeCloseTo(1428, 1);
    });

    it('should handle single-story building (KAKS = TAKS)', () => {
      const params: ZoningParams = {
        parselAlani: 500,
        taks: 0.40,
        kaks: 0.40,
        cikmaKatsayisi: 1.0,
      };

      const result = calculateZoning(params);

      // Kat Adedi = 0.40 / 0.40 = 1 floor
      expect(result.katAdedi).toBe(1);

      // Taban Alanı = 500 × 0.40 = 200 m²
      expect(result.tabanAlani).toBe(200);

      // Toplam İnşaat = 500 × 0.40 × 1.0 = 200 m²
      expect(result.toplamInsaatAlani).toBe(200);
    });

    it('should handle high-rise building', () => {
      const params: ZoningParams = {
        parselAlani: 2000,
        taks: 0.25,
        kaks: 2.50,
        cikmaKatsayisi: 1.50,
        maxYukseklik: 45.0, // 15 floors × 3m
      };

      const result = calculateZoning(params);

      // KAKS-based floors = 2.50 / 0.25 = 10 floors
      expect(result.katAdedi).toBe(10);

      // Should NOT be height limited (45m allows 15 floors)
      expect(result.isHeightLimited).toBe(false);

      // Taban Alanı = 2000 × 0.25 = 500 m²
      expect(result.tabanAlani).toBe(500);

      // Toplam İnşaat = 2000 × 2.50 × 1.50 = 7500 m²
      expect(result.toplamInsaatAlani).toBe(7500);
    });

    it('should apply height limit when more restrictive than KAKS', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 2.40,           // Would allow 8 floors
        cikmaKatsayisi: 1.60,
        maxYukseklik: 15.0,   // Only allows 5 floors (15m / 3m)
      };

      const result = calculateZoning(params);

      // Height-limited to 5 floors (not 8)
      expect(result.katAdedi).toBe(5);
      expect(result.isHeightLimited).toBe(true);

      // Toplam İnşaat = 1000 × 2.40 × 1.60 = 3840 m²
      expect(result.toplamInsaatAlani).toBe(3840);
    });

    it('should apply explicit floor limit when provided', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 2.40,           // Would allow 8 floors
        cikmaKatsayisi: 1.60,
        maxKatAdedi: 4,       // Explicit limit: 4 floors
      };

      const result = calculateZoning(params);

      // Floor-limited to 4
      expect(result.katAdedi).toBe(4);
      expect(result.isFloorLimited).toBe(true);
      expect(result.isHeightLimited).toBe(false);
    });

    it('should handle zero TAKS (no building allowed)', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.0,
        kaks: 0.0,
        cikmaKatsayisi: 1.0,
      };

      const result = calculateZoning(params);

      expect(result.tabanAlani).toBe(0);
      expect(result.toplamInsaatAlani).toBe(0);
      expect(result.katAdedi).toBe(0);
    });

    it('should use custom net/gross ratio', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
        netGrossRatio: 0.75, // Lower efficiency (high-rise)
      };

      const result = calculateZoning(params);

      // Toplam = 1000 × 1.50 × 1.60 = 2400 m²
      // Emsal Dışı = 2400 × 0.30 = 720 m²
      // Brüt Kullanım = 2400 - 720 = 1680 m²
      expect(result.brutKullanimAlani).toBeCloseTo(1680, 1);

      // Net Kullanım = 1680 × 0.75 = 1260 m²
      expect(result.netKullanimAlani).toBeCloseTo(1260, 1);
      expect(result.appliedNetGrossRatio).toBe(0.75);
    });

    it('should use custom emsal dışı ratio', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
        emsalDisiOran: 0.25, // 25% instead of default 30%
      };

      const result = calculateZoning(params);

      // Toplam = 1000 × 1.50 × 1.60 = 2400 m²
      // Emsal Dışı = 2400 × 0.25 = 600 m²
      expect(result.emsalDisiMax).toBeCloseTo(600, 1);

      // Brüt Kullanım = 2400 - 600 = 1800 m²
      expect(result.brutKullanimAlani).toBeCloseTo(1800, 1);
    });
  });

  describe('calculateZoning - Edge Cases', () => {
    it('should throw error for invalid parameters', () => {
      const params: ZoningParams = {
        parselAlani: -1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      expect(() => calculateZoning(params)).toThrow();
    });

    it('should throw error for TAKS > 1.0', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 1.5,
        kaks: 2.0,
        cikmaKatsayisi: 1.60,
      };

      expect(() => calculateZoning(params)).toThrow();
    });

    it('should handle very small parcel', () => {
      const params: ZoningParams = {
        parselAlani: 150,     // Minimum viable
        taks: 0.30,
        kaks: 1.20,
        cikmaKatsayisi: 1.40,
      };

      const result = calculateZoning(params);

      expect(result.tabanAlani).toBe(45);
      // Toplam = 150 × 1.20 × 1.40 = 252 m²
      expect(result.toplamInsaatAlani).toBeCloseTo(252);
      expect(result.katAdedi).toBe(4);
    });

    it('should handle very large parcel', () => {
      const params: ZoningParams = {
        parselAlani: 50000,   // 5 hectares
        taks: 0.20,
        kaks: 1.00,
        cikmaKatsayisi: 1.50,
      };

      const result = calculateZoning(params);

      expect(result.tabanAlani).toBe(10000);
      // Toplam = 50000 × 1.00 × 1.50 = 75000 m²
      expect(result.toplamInsaatAlani).toBe(75000);
      expect(result.katAdedi).toBe(5);
    });
  });

  describe('calculateEffectiveKAKS', () => {
    it('should calculate effective KAKS from height limit', () => {
      const parselAlani = 1000;
      const taks = 0.30;
      const maxYukseklik = 21.0; // 7 floors × 3m

      const effectiveKAKS = calculateEffectiveKAKS(parselAlani, taks, maxYukseklik);

      // 7 floors × 0.30 TAKS = 2.10 effective KAKS
      expect(effectiveKAKS).toBe(2.10);
    });

    it('should handle custom floor height', () => {
      const parselAlani = 1000;
      const taks = 0.30;
      const maxYukseklik = 20.0;
      const floorHeight = 4.0; // Taller floors

      const effectiveKAKS = calculateEffectiveKAKS(
        parselAlani,
        taks,
        maxYukseklik,
        floorHeight
      );

      // 5 floors × 0.30 TAKS = 1.50 effective KAKS
      expect(effectiveKAKS).toBe(1.50);
    });
  });

  describe('calculateRequiredParselArea', () => {
    it('should calculate required parcel size for desired area', () => {
      const desiredTotalArea = 3000; // Want 3000 m² total
      const kaks = 1.50;
      const cikmaKatsayisi = 1.60;

      const requiredParsel = calculateRequiredParselArea(
        desiredTotalArea,
        kaks,
        cikmaKatsayisi
      );

      // Formula: Parsel = Toplam / (KAKS × Çıkma)
      // Parsel = 3000 / (1.50 × 1.60) = 3000 / 2.40 = 1250 m²
      expect(requiredParsel).toBeCloseTo(1250, 1);
    });

    it('should use default çıkma of 1.0 if not provided', () => {
      const desiredTotalArea = 2000;
      const kaks = 1.50;

      const requiredParsel = calculateRequiredParselArea(desiredTotalArea, kaks);

      // Parsel = 2000 / (1.50 × 1.0) = 2000 / 1.50 ≈ 1333.33 m²
      expect(requiredParsel).toBeCloseTo(1333.33, 1);
    });

    it('should throw error for invalid KAKS', () => {
      expect(() => calculateRequiredParselArea(3000, 0, 1.6)).toThrow();
      expect(() => calculateRequiredParselArea(3000, -1.5, 1.6)).toThrow();
    });

    it('should throw error for invalid çıkma', () => {
      expect(() => calculateRequiredParselArea(3000, 1.5, 0)).toThrow();
      expect(() => calculateRequiredParselArea(3000, 1.5, -1.0)).toThrow();
    });
  });

  describe('calculateAreaBreakdown', () => {
    it('should break down areas correctly', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const zoningResult = calculateZoning(params);
      const breakdown = calculateAreaBreakdown(zoningResult);

      // Total should match
      expect(breakdown.toplamInsaat).toBe(zoningResult.toplamInsaatAlani);

      // Emsal kapsami + Emsal dışı = Total
      expect(breakdown.emsalKapsami + breakdown.emsalDisi).toBeCloseTo(
        breakdown.toplamInsaat,
        1
      );

      // Emsal kapsami breakdown should sum correctly
      const emsalKapsamiSum =
        breakdown.konutAlani + breakdown.ortakKullanim + breakdown.teknikAlan;
      expect(emsalKapsamiSum).toBeCloseTo(breakdown.emsalKapsami, 1);

      // Emsal dışı breakdown should sum correctly
      const emsalDisiSum =
        breakdown.asansor + breakdown.merdiven + breakdown.otopark + breakdown.siginaklar;
      expect(emsalDisiSum).toBeCloseTo(breakdown.emsalDisi, 1);
    });
  });

  describe('formatZoningSummary', () => {
    it('should format summary correctly', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 1.50,
        cikmaKatsayisi: 1.60,
      };

      const zoningResult = calculateZoning(params);
      const summary = formatZoningSummary(zoningResult);

      expect(summary.tabanAlani).toContain('300');
      expect(summary.tabanAlani).toContain('m²');

      // Toplam = 1000 × 1.50 × 1.60 = 2400 m²
      expect(summary.toplamInsaat).toContain('2400');
      expect(summary.toplamInsaat).toContain('m²');

      expect(summary.katAdedi).toContain('5');
      expect(summary.katAdedi).toContain('kat');

      // Net = 1428 m² (from calculation: 2400 - 720 emsal dışı × 0.85)
      expect(summary.netKullanim).toContain('1428');
      expect(summary.netKullanim).toContain('m²');

      // Kapasite = ~14 konut (1428 / 100)
      expect(summary.kapasite).toContain('14');
      expect(summary.kapasite).toContain('konut');
    });

    it('should indicate height limitation in summary', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 2.40,
        cikmaKatsayisi: 1.60,
        maxYukseklik: 15.0,
      };

      const zoningResult = calculateZoning(params);
      const summary = formatZoningSummary(zoningResult);

      expect(summary.katAdedi).toContain('yükseklik sınırlı');
    });

    it('should indicate floor limitation in summary', () => {
      const params: ZoningParams = {
        parselAlani: 1000,
        taks: 0.30,
        kaks: 2.40,
        cikmaKatsayisi: 1.60,
        maxKatAdedi: 4,
      };

      const zoningResult = calculateZoning(params);
      const summary = formatZoningSummary(zoningResult);

      expect(summary.katAdedi).toContain('kat adedi sınırlı');
    });
  });
});
