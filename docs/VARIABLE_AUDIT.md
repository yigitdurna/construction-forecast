# Construction Feasibility Variable Audit

## Purpose
Document ALL variables needed for accurate Turkish construction feasibility analysis.
This audit will guide the redesign of the calculation engine.

---

## 1. LAND INPUTS (Arsa Bilgileri)

### 1.1 Location Data
| Variable | Turkish | Unit | Source | Current Status |
|----------|---------|------|--------|----------------|
| İlçe (District) | İlçe | - | User selection | ✅ Have |
| Mahalle (Neighborhood) | Mahalle | - | User input | ✅ Have |
| Ada (Block) | Ada | number | User input | ✅ Have |
| Parsel (Parcel) | Parsel | number | User input | ✅ Have |

### 1.2 Land Physical Data
| Variable | Turkish | Unit | Source | Current Status |
|----------|---------|------|--------|----------------|
| Parsel Alanı | Parsel Alanı | m² | TKGM or Manual | ✅ Have |
| Arsa m² Fiyatı | Arsa Birim Fiyatı | TL/m² | Manual (needs market data) | ⚠️ Manual only |
| Toplam Arsa Maliyeti | Toplam Arsa Maliyeti | TL | Calculated | ✅ Calculated |

### 1.3 Zoning Data (İmar Bilgileri)
| Variable | Turkish | Unit | Source | Current Status |
|----------|---------|------|--------|----------------|
| TAKS | Taban Alanı Kat Sayısı | ratio (0-1) | Municipality | ✅ Have |
| KAKS/EMSAL | Kat Alanı Kat Sayısı | ratio (0-5) | Municipality | ✅ Have |
| Çıkma Katsayısı | Çıkma Oranı | ratio (1.0-2.0) | Municipality | ✅ Have |
| Max Kat Adedi | Azami Kat Sayısı | floors | Municipality | ✅ Have |
| Max Yükseklik | Azami Yükseklik | meters | Municipality | ⚠️ Optional |
| Ön Çekme | Ön Bahçe Mesafesi | meters | Municipality | ⚠️ Optional |
| Yan Çekme | Yan Bahçe Mesafesi | meters | Municipality | ⚠️ Optional |
| Arka Çekme | Arka Bahçe Mesafesi | meters | Municipality | ⚠️ Optional |

---

## 2. BUILDING CALCULATION (İnşaat Hesabı)

### 2.1 Area Calculations (CRITICAL)
| Variable | Turkish | Formula | Current Status |
|----------|---------|---------|----------------|
| Taban Alanı | Taban Alanı | Parsel × TAKS | ✅ Correct |
| KAKS Alanı | KAKS Alanı | Parsel × KAKS | ✅ Correct |
| Toplam İnşaat Alanı | Brüt Alan | Parsel × KAKS × Çıkma | ✅ Correct |
| Kat Adedi | Kat Sayısı | KAKS / TAKS | ✅ Correct |
| Emsal Dışı Alanlar | Emsal Dışı | Varies (parking, stairs, etc.) | ⚠️ Estimated 30% |

### 2.2 Net vs Gross Breakdown (NEEDS ATTENTION)
| Area Type | Turkish | % of Gross | Notes |
|-----------|---------|------------|-------|
| Brüt İnşaat Alanı | Toplam İnşaat | 100% | Building total |
| Ortak Alanlar | Ortak Alanlar | ~15-20% | Stairs, corridors, lobbies |
| Teknik Alanlar | Teknik Alanlar | ~5-10% | MEP rooms, shafts |
| Otopark | Kapalı Otopark | ~10-15% | If basement parking |
| Satılabilir Alan | Net Satılabilir Alan | ~55-65% | Actual sellable |

**KEY INSIGHT**: insaathesabi.com uses ~55% net/gross ratio, we were using 85%.
This is a MAJOR source of error.

---

## 3. UNIT MIX (Daire Karışımı)

### 3.1 Unit Types
| Type | Turkish | Net m² Range | Typical m² |
|------|---------|--------------|------------|
| 1+1 | Bir Artı Bir | 45-65 m² | 55 m² |
| 2+1 | İki Artı Bir | 75-110 m² | 90 m² |
| 3+1 | Üç Artı Bir | 100-140 m² | 120 m² |
| 4+1 | Dört Artı Bir | 130-180 m² | 150 m² |
| 5+1 | Beş Artı Bir | 160-250 m² | 200 m² |

### 3.2 Unit Distribution (Market-Based)
| Type | Typical % | Antalya Market |
|------|-----------|----------------|
| 1+1 | 10-20% | High demand (investors, tourists) |
| 2+1 | 30-40% | Most popular (young families) |
| 3+1 | 30-40% | High demand (families) |
| 4+1 | 5-15% | Luxury segment |

---

## 4. CONSTRUCTION COSTS (İnşaat Maliyetleri)

### 4.1 Cost Application Base (CRITICAL DECISION)
**Question**: Apply costs to which area?

| Option | Turkish | Pros | Cons |
|--------|---------|------|------|
| GROSS Area | Brüt Alan | Industry standard, includes all construction | Higher total |
| NET Area | Net Alan | Simpler, relates to sellable | Underestimates |

**DECISION**: Use GROSS area (Brüt Alan) - this is industry standard.

### 4.2 Cost Categories (Turkish Standard - insaathesabi.com)

#### A. Kaba İnşaat (Rough Construction) - ~35-40%
| Item | Turkish | TL/m² (2024) | % of Total |
|------|---------|--------------|------------|
| Hafriyat | Excavation | 500-1,000 | 2-3% |
| Temel | Foundation | 1,500-2,500 | 5-8% |
| Betonarme | Concrete Frame | 4,000-6,000 | 15-20% |
| Demir | Reinforcement | 2,000-3,500 | 8-12% |
| Duvar | Masonry | 800-1,500 | 3-5% |

#### B. Tesisat (MEP) - ~12-18%
| Item | Turkish | TL/m² (2024) | % of Total |
|------|---------|--------------|------------|
| Elektrik | Electrical | 1,500-2,500 | 5-8% |
| Sıhhi Tesisat | Plumbing | 1,200-2,000 | 4-6% |
| Isıtma/Soğutma | HVAC | 1,000-2,500 | 3-6% |
| Yangın | Fire Safety | 300-600 | 1-2% |

#### C. İnce İşler (Finishes) - ~25-35%
| Item | Turkish | TL/m² (2024) | % of Total |
|------|---------|--------------|------------|
| Sıva & Boya | Plaster & Paint | 1,000-1,800 | 4-6% |
| Döşeme | Flooring | 1,500-3,000 | 5-10% |
| Seramik/Fayans | Tiles | 1,200-2,500 | 4-8% |
| Mutfak | Kitchen | 2,000-5,000 | 6-12% |
| Banyo | Bathroom | 1,500-3,500 | 5-10% |

#### D. Dış Cephe & Doğrama - ~8-12%
| Item | Turkish | TL/m² (2024) | % of Total |
|------|---------|--------------|------------|
| Pencere/Kapı | Windows/Doors | 1,500-3,000 | 5-8% |
| Dış Cephe | Facade | 800-2,000 | 3-5% |
| Çatı | Roof | 500-1,200 | 2-4% |

#### E. Diğer Giderler - ~10-15%
| Item | Turkish | TL/m² (2024) | % of Total |
|------|---------|--------------|------------|
| Şantiye Giderleri | Site Costs | 500-1,000 | 2-4% |
| SGK & İşçilik | Labor Overhead | 800-1,500 | 3-5% |
| Proje & Ruhsat | Design & Permits | 300-800 | 1-3% |
| Beklenmeyen | Contingency | 500-1,500 | 3-5% |

### 4.3 Total Cost Benchmarks (2024 TL/m² GROSS)

| Quality Level | Turkish | TL/m² Range | Typical |
|---------------|---------|-------------|---------|
| Ekonomik | Ekonomik | 12,000-16,000 | 14,000 |
| Standart | Standart | 16,000-22,000 | 19,000 |
| Orta-Üst | Orta-Üst | 22,000-30,000 | 25,000 |
| Lüks | Lüks | 30,000-45,000 | 35,000 |
| Ultra Lüks | Premium | 45,000+ | 55,000 |

**Source**: insaathesabi.com, contractor surveys, TCMB construction index

---

## 5. SALES PRICING (Satış Fiyatları)

### 5.1 Price Application Base
**IMPORTANT**: Sales prices are ALWAYS per NET m² (satılabilir alan)

### 5.2 Base Prices by District (Antalya - November 2024)
| District | TL/m² NET | Notes |
|----------|-----------|-------|
| Muratpaşa - Lara | 55,000-80,000 | Premium seaside |
| Muratpaşa - Center | 40,000-55,000 | Urban center |
| Konyaaltı - Beach | 50,000-70,000 | Beach premium |
| Konyaaltı - Center | 35,000-50,000 | Growing area |
| Kepez - New Dev | 30,000-40,000 | Developing |
| Kepez - Center | 25,000-35,000 | Affordable |
| Aksu | 22,000-30,000 | Suburban |
| Döşemealtı | 20,000-28,000 | Rural/suburban |

### 5.3 Price Adjustments
| Factor | Turkish | Adjustment |
|--------|---------|------------|
| Floor Level | Kat Farkı | Ground -5%, Top +10%, Penthouse +20% |
| View | Manzara | Sea +15-25%, City +5%, None 0% |
| Orientation | Cephe | South +5%, North -5% |
| Unit Size | Büyüklük | Larger units slightly lower per m² |
| Garden | Bahçe | Ground floor garden +10-15% |
| Terrace | Teras | Large terrace +5-10% |

### 5.4 Data Sources for Real Prices
| Source | URL | Data Type |
|--------|-----|-----------|
| Sahibinden | sahibinden.com | Listing prices |
| Hepsiemlak | hepsiemlak.com | Listing prices |
| Emlakjet | emlakjet.com | Listing prices |
| TCMB EVDS | evds2.tcmb.gov.tr | Price index |
| TÜİK | tuik.gov.tr | Official stats |
| Endeksa | endeksa.com | Analytics |

---

## 6. FINANCIAL PARAMETERS (Finansal Parametreler)

### 6.1 Timeline
| Parameter | Turkish | Default | Range |
|-----------|---------|---------|-------|
| İnşaat Süresi | Construction Duration | 18-24 months | 12-36 |
| Satış Süresi | Sales Period | 6-12 months | 3-24 |
| Toplam Süre | Total Duration | 24-36 months | 15-60 |

### 6.2 Economic Parameters
| Parameter | Turkish | Default | Source |
|-----------|---------|---------|--------|
| Aylık Enflasyon | Monthly Inflation | 2.5% | TCMB |
| Aylık Değer Artışı | Monthly Appreciation | 1.5% | Market |
| İskonto Oranı | Discount Rate | 1.0% | Opportunity cost |

### 6.3 Cost Distribution (S-Curve)
| Phase | Turkish | % of Cost | Months |
|-------|---------|-----------|--------|
| Başlangıç | Start | 15% | 1-4 |
| Yoğun | Peak | 65% | 5-14 |
| Bitiş | Finish | 20% | 15-18 |

---

## 7. PROFITABILITY CALCULATION (Karlılık Hesabı)

### 7.1 Revenue Calculation
```
Toplam Satış Geliri = Σ (Daire Adedi × Net m² × Birim Fiyat × Faktörler)
```

### 7.2 Cost Calculation
```
Toplam Maliyet = Arsa Maliyeti + (Brüt İnşaat Alanı × Birim Maliyet × Kalite Katsayısı)
```

### 7.3 Profit Metrics
| Metric | Turkish | Formula |
|--------|---------|---------|
| Brüt Kar | Gross Profit | Revenue - Cost |
| Kar Marjı | Profit Margin | (Profit / Revenue) × 100 |
| ROI | Yatırım Getirisi | (Profit / Cost) × 100 |
| NPV | Net Bugünkü Değer | DCF calculation |

---

## 8. IDENTIFIED ISSUES WITH CURRENT IMPLEMENTATION

### 8.1 Critical Issues
1. **Net/Gross Ratio**: Using 85% instead of ~55-65%
2. **Cost Base**: Now fixed (GROSS), but defaults may be wrong
3. **Missing Costs**: No land development, infrastructure costs
4. **No Basement**: Parking basement not modeled

### 8.2 Data Quality Issues
1. **No Real Market Data**: All prices are estimates
2. **No Regional Variation**: Same defaults for all districts
3. **Outdated Prices**: 2024 prices in high-inflation environment

### 8.3 UX Issues
1. **Too Many Steps**: 4-step wizard may be overkill for quick estimates
2. **Hidden Assumptions**: Users don't know what Net/Gross ratio is used
3. **No Comparison**: Can't easily compare scenarios
4. **No Quick Mode**: Must go through full wizard for any estimate

---

## 9. RECOMMENDATIONS

### 9.1 Immediate Fixes
1. [ ] Fix Net/Gross ratio to use realistic ~55-65% range
2. [ ] Update cost defaults to 2024 market rates
3. [ ] Add basement/parking as explicit option
4. [ ] Show all assumptions clearly in UI

### 9.2 Data Improvements
1. [ ] Integrate real estate listing data (scraping or API)
2. [ ] Add district-specific price defaults
3. [ ] Include TCMB construction cost index
4. [ ] Update prices monthly

### 9.3 UX Improvements
1. [ ] Add "Quick Estimate" mode (minimal inputs)
2. [ ] Show assumptions at each step
3. [ ] Add comparison view for scenarios
4. [ ] Make all parameters visible and editable

### 9.4 Calculation Improvements
1. [ ] Model basement parking explicitly
2. [ ] Add land development costs
3. [ ] Include infrastructure costs
4. [ ] Model pre-sales during construction

---

## 10. EXAMPLE CALCULATION (Validation)

### Input
- Location: Kepez, Antalya
- Land: 2,000 m² × 70,000 TL/m² = **140,000,000 TL**
- KAKS: 1.50
- Çıkma: 1.70

### Building Calculation
- KAKS Alanı: 2,000 × 1.50 = 3,000 m²
- Brüt İnşaat: 3,000 × 1.70 = **5,100 m² GROSS**
- Net Satılabilir: 5,100 × 0.58 = **2,958 m² NET**

### Cost Calculation (Standard Quality)
- Construction: 5,100 m² × 19,000 TL/m² = **96,900,000 TL**
- Land: **140,000,000 TL**
- **Total Cost: 236,900,000 TL**

### Revenue Calculation
- Sale Price: 38,000 TL/m² NET (Kepez average)
- Total Revenue: 2,958 m² × 38,000 = **112,404,000 TL**

### Result
- **LOSS**: 112.4M - 236.9M = **-124.5M TL**

**INSIGHT**: This shows the project is NOT FEASIBLE at these parameters!
Either:
- Land is too expensive (70,000 TL/m²)
- Or sale prices are too low (38,000 TL/m²)
- Or both

For break-even: Need either:
- Land at ~35,000 TL/m² (50% lower)
- Or sales at ~80,000 TL/m² (110% higher)
- Or higher KAKS (more buildable area)

---

## Document Status
- Created: December 7, 2025
- Author: Claude Code
- Purpose: Variable audit before redesign
- Next: Review with user, prioritize fixes
