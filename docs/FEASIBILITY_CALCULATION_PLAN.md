# Construction Feasibility Calculator - Master Plan

## Document Purpose
This document defines EXACTLY what we need to calculate construction feasibility accurately.
NO CODE will be written until this plan is approved.

---

## Part 1: First Principles - How Does a Contractor Calculate Feasibility?

A contractor in Antalya asks one question: **"If I build on this land, will I make money?"**

To answer, they follow these steps:

### Step 1: Understand What They CAN Build (Zoning Limits)
- How big is the land?
- What does zoning allow? (TAKS, KAKS, height, floors)
- Maximum buildable area = Land × KAKS × Çıkma coefficient

### Step 2: DESIGN What They WILL Build (User Decision)
This is CRITICAL - the contractor DECIDES:
- How many floors?
- Basement for parking?
- What unit types? (1+1, 2+1, 3+1, 4+1)
- How many of each?
- What sizes?

**This is NOT auto-calculated. It's a design decision based on market knowledge.**

### Step 3: Estimate Costs (Item by Item)
For EACH cost item:
- What is it? (concrete, steel, labor, etc.)
- How much is needed? (quantity based on design)
- What's today's price?
- When will I buy it? (timeline month)
- What will the price be then? (inflation adjustment)

### Step 4: Estimate Revenue (Unit by Unit)
For EACH unit:
- Type, size, floor
- Market price per m² for this type/location
- When will I sell?
- Price at sale time (appreciation adjustment)

### Step 5: Calculate Profitability
- Total Revenue - Total Cost = Profit
- Apply NPV if considering time value of money

---

## Part 2: Complete Variable List

### A. LAND INPUTS (User provides or fetches from TKGM)

| # | Variable | Turkish Name | Unit | How to Get |
|---|----------|--------------|------|------------|
| A1 | District | İlçe | - | User selects |
| A2 | Neighborhood | Mahalle | - | User enters |
| A3 | Block Number | Ada | number | User enters |
| A4 | Parcel Number | Parsel | number | User enters |
| A5 | Land Area | Parsel Alanı | m² | TKGM API or manual |
| A6 | Land Unit Price | Arsa m² Fiyatı | TL/m² | Manual (market research) |
| A7 | **Total Land Cost** | Toplam Arsa Maliyeti | TL | **Calculated: A5 × A6** |

### B. ZONING INPUTS (From municipality or manual)

| # | Variable | Turkish Name | Unit | How to Get |
|---|----------|--------------|------|------------|
| B1 | TAKS | Taban Alanı Kat Sayısı | ratio (0-1) | Municipality API or manual |
| B2 | KAKS/EMSAL | Kat Alanı Kat Sayısı | ratio (0-5) | Municipality API or manual |
| B3 | Çıkma Coefficient | Çıkma Katsayısı | ratio (1.0-2.0) | Municipality API or manual |
| B4 | Max Floors | Azami Kat Sayısı | floors | Municipality or manual |
| B5 | Max Height | Azami Yükseklik | meters | Municipality or manual |

### C. CALCULATED BUILDING LIMITS (System calculates from A + B)

| # | Variable | Turkish Name | Formula |
|---|----------|--------------|---------|
| C1 | Ground Floor Max | Taban Alanı | A5 × B1 |
| C2 | KAKS Area | KAKS Alanı | A5 × B2 |
| C3 | Total Buildable GROSS | Toplam İnşaat Alanı | A5 × B2 × B3 |
| C4 | Max Floors (by KAKS) | Kat Adedi | B2 / B1 |
| C5 | Max Floors (by height) | Kat Adedi | B5 / 3.0 |
| C6 | **Effective Max Floors** | Efektif Kat | min(B4, C4, C5) |

**At this point, user knows: "I can build up to C3 m² GROSS in C6 floors"**

---

### D. BUILDING DESIGN (User enters - this is the DESIGN DECISION)

The user designs their building. They enter:

#### D1. Floor Configuration

| # | Variable | Turkish Name | Unit | User Enters |
|---|----------|--------------|------|-------------|
| D1.1 | Has Basement? | Bodrum Var mı? | yes/no | User decides |
| D1.2 | Basement Area | Bodrum Alanı | m² | User enters (≤ C1) |
| D1.3 | Basement Use | Bodrum Kullanımı | - | Parking / Storage / Commercial |
| D1.4 | Number of Floors | Kat Sayısı | floors | User enters (≤ C6) |
| D1.5 | Floor Area | Kat Alanı | m² | User enters (typically = C1) |

#### D2. Unit Configuration (THE CRITICAL PART)

User enters EACH unit type they plan to build:

| # | Variable | Turkish Name | Unit | User Enters |
|---|----------|--------------|------|-------------|
| D2.1 | Unit Type | Daire Tipi | 1+1, 2+1, etc. | User selects |
| D2.2 | NET Area per Unit | Net Alan | m² | User enters (e.g., 85 m²) |
| D2.3 | GROSS Area per Unit | Brüt Alan | m² | User enters or calculated |
| D2.4 | Number of Units | Daire Adedi | count | User enters |
| D2.5 | Floor(s) | Kat(lar) | floor numbers | User enters |

**Example User Input:**
```
Unit Type | NET m² | GROSS m² | Count | Floors
----------|--------|----------|-------|--------
1+1       | 55     | 70       | 4     | 1,2
2+1       | 85     | 105      | 12    | 1,2,3,4
3+1       | 110    | 135      | 4     | 3,4,5
4+1       | 140    | 170      | 2     | Penthouse
```

#### D3. Calculated from Design

| # | Variable | Turkish Name | Formula |
|---|----------|--------------|---------|
| D3.1 | Total Units | Toplam Daire | Sum of D2.4 |
| D3.2 | Total NET Area | Toplam Net Alan | Sum of (D2.2 × D2.4) |
| D3.3 | Total GROSS Area (units) | Daire Brüt Alanı | Sum of (D2.3 × D2.4) |
| D3.4 | Common Areas | Ortak Alanlar | C3 - D3.3 |
| D3.5 | Net/Gross Ratio | Net/Brüt Oranı | D3.2 / C3 |

#### D4. Design Validation

System checks:
- ✅ Total GROSS ≤ C3 (within buildable limit)
- ✅ Units per floor fit within floor area
- ✅ Floor count ≤ C6
- ⚠️ Warning if Net/Gross < 50% or > 70% (unusual)

---

### E. CONSTRUCTION COSTS (Item by Item)

This is where accuracy matters. For EACH cost category:

#### E1. Cost Structure

| # | Variable | Unit | Notes |
|---|----------|------|-------|
| E1.1 | Cost Item Name | - | e.g., "Beton İşleri" |
| E1.2 | Unit of Measure | - | m², m³, kg, adet, fixed |
| E1.3 | Quantity | varies | Calculated from design |
| E1.4 | Current Unit Price | TL/unit | Market price TODAY |
| E1.5 | Purchase Month | 1-24 | When in timeline |
| E1.6 | Monthly Inflation Rate | % | Applied to get future price |
| E1.7 | **Future Unit Price** | TL/unit | E1.4 × (1 + E1.6)^E1.5 |
| E1.8 | **Item Total Cost** | TL | E1.3 × E1.7 |

#### E2. Cost Categories (Turkish Industry Standard)

**Category 1: KABA İNŞAAT (Rough Construction) - Months 1-8**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Hafriyat | Excavation | Basement volume | m³ | 150-250 TL/m³ |
| Temel | Foundation | Ground floor area | m² | 1,500-2,500 TL/m² |
| Beton | Concrete | GROSS area × 0.25 m³/m² | m³ | 2,500-3,500 TL/m³ |
| Demir | Reinforcement | GROSS area × 80 kg/m² | kg | 25-35 TL/kg |
| Kalıp | Formwork | GROSS area | m² | 400-600 TL/m² |
| Duvar | Masonry | GROSS area × 0.8 | m² | 300-500 TL/m² |

**Category 2: TESİSAT (MEP) - Months 6-14**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Elektrik | Electrical | GROSS area | m² | 1,200-2,000 TL/m² |
| Sıhhi Tesisat | Plumbing | GROSS area | m² | 800-1,500 TL/m² |
| Doğalgaz | Gas | Per unit | adet | 15,000-25,000 TL/unit |
| Asansör | Elevator | Per shaft | adet | 800,000-1,500,000 TL |
| Isıtma/Soğutma | HVAC | GROSS area | m² | 600-1,500 TL/m² |

**Category 3: İNCE İŞLER (Finishes) - Months 10-18**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Sıva | Plaster | GROSS area × 2.5 | m² | 150-250 TL/m² |
| Boya | Paint | GROSS area × 2.5 | m² | 100-180 TL/m² |
| Döşeme | Flooring | NET area | m² | 400-1,200 TL/m² |
| Seramik | Tiles | Wet areas | m² | 500-1,500 TL/m² |
| Mutfak | Kitchen | Per unit | adet | 80,000-250,000 TL |
| Banyo | Bathroom | Per bathroom | adet | 40,000-120,000 TL |
| İç Kapı | Interior Doors | Per door | adet | 8,000-20,000 TL |

**Category 4: DIŞ CEPHE & DOĞRAMA (Facade & Joinery) - Months 8-16**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Pencere | Windows | Window area | m² | 4,000-8,000 TL/m² |
| Dış Kapı | Exterior Doors | Per door | adet | 15,000-40,000 TL |
| Cephe Kaplaması | Facade | Facade area | m² | 800-2,500 TL/m² |
| Çatı | Roof | Roof area | m² | 500-1,200 TL/m² |
| Balkon | Balcony Rails | Linear meters | m | 2,000-5,000 TL/m |

**Category 5: ÇEVRE DÜZENLEMESİ (Site Work) - Months 16-20**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Peyzaj | Landscaping | Open area | m² | 300-800 TL/m² |
| Otopark Döşeme | Parking Floor | Parking area | m² | 400-800 TL/m² |
| Site Yolları | Site Roads | Road area | m² | 500-1,000 TL/m² |
| Çevre Duvarı | Perimeter Wall | Linear meters | m | 3,000-8,000 TL/m |
| Aydınlatma | Site Lighting | Fixed | TL | 50,000-150,000 TL |

**Category 6: PROJE & RESMİ GİDERLER (Soft Costs) - Months 0-2**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Mimari Proje | Architectural | GROSS area | m² | 80-200 TL/m² |
| Statik Proje | Structural | GROSS area | m² | 40-80 TL/m² |
| Mekanik Proje | MEP Design | GROSS area | m² | 30-60 TL/m² |
| Yapı Ruhsatı | Building Permit | Fixed + m² | TL | 100,000-500,000 TL |
| İskan | Occupancy | Fixed | TL | 50,000-200,000 TL |

**Category 7: FİNANSAL GİDERLER (Financial Costs)**

| Item | Turkish | Quantity Based On | Unit | Typical Price (2024) |
|------|---------|-------------------|------|---------------------|
| Beklenmeyen | Contingency | % of subtotal | % | 10-15% |
| Finansman | Financing Cost | If loan used | % | Varies |
| SGK & Vergiler | Social Security | % of labor | % | 20-25% of labor |
| Genel Gider | Overhead | % of subtotal | % | 5-10% |
| Kar Payı | Builder Profit | % of subtotal | % | 10-15% |

---

### F. REVENUE ESTIMATION (Unit by Unit)

#### F1. Per Unit Revenue

| # | Variable | Turkish | Unit | Source |
|---|----------|---------|------|--------|
| F1.1 | Unit Type | Daire Tipi | - | From design (D2) |
| F1.2 | NET Area | Net Alan | m² | From design (D2.2) |
| F1.3 | Floor | Kat | number | From design (D2.5) |
| F1.4 | Base Price/m² | Baz m² Fiyatı | TL/m² | Market data for district |
| F1.5 | Type Multiplier | Tip Katsayısı | ratio | 1+1: 1.05, 4+1: 0.95 etc. |
| F1.6 | Floor Multiplier | Kat Katsayısı | ratio | Ground: 0.95, High: 1.05 |
| F1.7 | **Current Unit Price** | Güncel Fiyat | TL | F1.2 × F1.4 × F1.5 × F1.6 |
| F1.8 | Months Until Sale | Satışa Kalan Ay | months | Construction + sales period |
| F1.9 | Monthly Appreciation | Aylık Değer Artışı | % | Market trend |
| F1.10 | **Future Sale Price** | Satış Fiyatı | TL | F1.7 × (1 + F1.9)^F1.8 |

#### F2. Market Price Data Needed

For each district, we need base prices per m² (NET) by unit type:

| District | 1+1 | 2+1 | 3+1 | 4+1 | Data Source |
|----------|-----|-----|-----|-----|-------------|
| Kepez | ? | ? | ? | ? | Need real data |
| Muratpaşa | ? | ? | ? | ? | Need real data |
| Konyaaltı | ? | ? | ? | ? | Need real data |
| ... | | | | | |

**Data Sources to Research:**
- Sahibinden.com (listing prices)
- Hepsiemlak.com (listing prices)
- Emlakjet.com (listing prices)
- Endeksa.com (analytics)
- Local real estate agents

---

### G. TIMELINE PARAMETERS

| # | Variable | Turkish | Unit | Typical Value |
|---|----------|---------|------|---------------|
| G1 | Construction Duration | İnşaat Süresi | months | 18-24 |
| G2 | Sales Period | Satış Süresi | months | 6-12 |
| G3 | Monthly Inflation | Aylık Enflasyon | % | 2-3% |
| G4 | Monthly Appreciation | Aylık Değer Artışı | % | 1-2% |
| G5 | Discount Rate (for NPV) | İskonto Oranı | % | 1-2% |

---

### H. FINAL CALCULATIONS

| # | Calculation | Turkish | Formula |
|---|-------------|---------|---------|
| H1 | Total Land Cost | Arsa Maliyeti | A7 |
| H2 | Total Construction Cost | İnşaat Maliyeti | Sum of all E items |
| H3 | **Total Cost** | Toplam Maliyet | H1 + H2 |
| H4 | Total Revenue | Toplam Gelir | Sum of all F1.10 |
| H5 | **Gross Profit** | Brüt Kar | H4 - H3 |
| H6 | Profit Margin | Kar Marjı | H5 / H4 × 100 |
| H7 | ROI | Yatırım Getirisi | H5 / H3 × 100 |
| H8 | NPV | Net Bugünkü Değer | DCF of (H4 - H3) |

---

## Part 3: Data Source Classification

### Can Get from API (Automated)
| Variable | API Source | Status |
|----------|------------|--------|
| Land Area | TKGM | ⚠️ Needs testing |
| TAKS, KAKS, Çıkma | Municipality (Kepez KEOS) | ⚠️ Partially working |
| Max Floors, Height | Municipality | ⚠️ Partially working |

### Must Be Manual Input (User enters)
| Variable | Why Manual |
|----------|------------|
| Land Price | Negotiated, varies widely |
| Unit Configuration | Design decision |
| Unit Sizes | Design decision |
| Quality Level | Design decision |
| Sale Price per m² | Market judgment |

### Can Be Defaulted (With override option)
| Variable | Default Source | Override |
|----------|---------------|----------|
| Construction costs | Industry averages | User can adjust |
| Inflation rate | TCMB data | User can adjust |
| Appreciation rate | Market trends | User can adjust |
| Timeline | Based on size | User can adjust |

---

## Part 4: Proposed User Flow

### Screen 1: Land & Zoning
```
┌─────────────────────────────────────────────┐
│ 1. ARSA BİLGİLERİ                           │
├─────────────────────────────────────────────┤
│ İlçe: [Kepez ▼]                             │
│ Mahalle: [____________]                      │
│ Ada: [_____]  Parsel: [_____]               │
│                                             │
│ [TKGM'den Getir] veya [Manuel Giriş]        │
├─────────────────────────────────────────────┤
│ Parsel Alanı: [2,000] m²                    │
│ Arsa m² Fiyatı: [70,000] TL                 │
│ Toplam Arsa: 140,000,000 TL                 │
├─────────────────────────────────────────────┤
│ 2. İMAR BİLGİLERİ                           │
├─────────────────────────────────────────────┤
│ TAKS: [0.30]   KAKS: [1.50]  Çıkma: [1.70]  │
│ Max Kat: [5]   Max Yükseklik: [15.50] m     │
├─────────────────────────────────────────────┤
│ HESAPLANAN LİMİTLER:                        │
│ • Taban Alanı: 600 m²                       │
│ • Toplam İnşaat Hakkı: 5,100 m² BRÜT        │
│ • Azami Kat: 5                              │
└─────────────────────────────────────────────┘
                    [İleri →]
```

### Screen 2: Building Design (USER CONTROLS THIS)
```
┌─────────────────────────────────────────────┐
│ 3. BİNA TASARIMI                            │
├─────────────────────────────────────────────┤
│ Yapılabilir Alan: 5,100 m² BRÜT             │
├─────────────────────────────────────────────┤
│ Bodrum Katı: [✓] Var   Alan: [600] m²       │
│ Kullanım: [Otopark ▼]                       │
├─────────────────────────────────────────────┤
│ Kat Sayısı: [5]  Kat Alanı: [600] m²        │
├─────────────────────────────────────────────┤
│ 4. DAİRE KARIŞIMI (Siz belirleyin)          │
├─────────────────────────────────────────────┤
│ Tip    │ Net m² │ Brüt m² │ Adet │ Toplam  │
│ -------|--------|---------|------|---------|
│ 1+1    │ [55]   │ [70]    │ [4]  │ 280 m²  │
│ 2+1    │ [85]   │ [105]   │ [12] │ 1,260m² │
│ 3+1    │ [110]  │ [135]   │ [4]  │ 540 m²  │
│ 4+1    │ [140]  │ [170]   │ [2]  │ 340 m²  │
│                [+ Tip Ekle]                 │
├─────────────────────────────────────────────┤
│ ÖZET:                                       │
│ • Toplam Daire: 22 adet                     │
│ • Toplam Net Alan: 2,060 m²                 │
│ • Toplam Brüt Alan: 2,420 m² (of 5,100)     │
│ • Kalan (Ortak Alan): 2,680 m²              │
│ • Net/Brüt Oranı: 40% [⚠️ Düşük!]          │
├─────────────────────────────────────────────┤
│ [✓] Tasarım uygun (limit içinde)            │
└─────────────────────────────────────────────┘
            [← Geri]  [İleri →]
```

### Screen 3: Construction Costs
```
┌─────────────────────────────────────────────┐
│ 5. İNŞAAT MALİYETLERİ                       │
├─────────────────────────────────────────────┤
│ Kalite Seviyesi: [Standart ▼]               │
│ (Ekonomik / Standart / Orta-Üst / Lüks)     │
├─────────────────────────────────────────────┤
│ Hızlı Hesap: [19,000] TL/m² × 5,100 m²      │
│ Tahmini İnşaat: 96,900,000 TL               │
├─────────────────────────────────────────────┤
│ [Detaylı Maliyet Girişi ▼]                  │
│ ┌─────────────────────────────────────────┐ │
│ │ Kaba İnşaat          │ 38,760,000 TL   │ │
│ │ Tesisat              │ 14,535,000 TL   │ │
│ │ İnce İşler           │ 29,070,000 TL   │ │
│ │ Dış Cephe & Doğrama  │ 9,690,000 TL    │ │
│ │ Diğer Giderler       │ 4,845,000 TL    │ │
│ │ ─────────────────────│─────────────────│ │
│ │ TOPLAM               │ 96,900,000 TL   │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Enflasyon (aylık): [2.5]%                   │
│ İnşaat Süresi: [18] ay                      │
│ Enflasyonlu Maliyet: ~121,000,000 TL        │
└─────────────────────────────────────────────┘
            [← Geri]  [İleri →]
```

### Screen 4: Sale Prices
```
┌─────────────────────────────────────────────┐
│ 6. SATIŞ FİYATLARI                          │
├─────────────────────────────────────────────┤
│ Bölge Ortalaması (Kepez): 35,000 TL/m² NET  │
├─────────────────────────────────────────────┤
│ Tip    │ Adet │ Net m² │ Fiyat/m² │ Toplam │
│ -------|------|--------|----------|--------|
│ 1+1    │ 4    │ 55     │ [38,000] │ 8.36M  │
│ 2+1    │ 12   │ 85     │ [35,000] │ 35.7M  │
│ 3+1    │ 4    │ 110    │ [34,000] │ 14.96M │
│ 4+1    │ 2    │ 140    │ [32,000] │ 8.96M  │
│ -------|------|--------|----------|--------|
│ TOPLAM │ 22   │ 2,060  │ Ort:35K  │ 67.98M │
├─────────────────────────────────────────────┤
│ Değer Artışı (aylık): [1.5]%                │
│ Satış Süresi: [6] ay (inşaat sonrası)       │
│ Gelecek Değer: ~82,000,000 TL               │
└─────────────────────────────────────────────┘
            [← Geri]  [İleri →]
```

### Screen 5: Summary & Analysis
```
┌─────────────────────────────────────────────┐
│ 7. FİZİBİLİTE ÖZETİ                         │
├─────────────────────────────────────────────┤
│ MALİYETLER                                  │
│ • Arsa: 140,000,000 TL                      │
│ • İnşaat (enflasyonlu): 121,000,000 TL      │
│ • TOPLAM MALİYET: 261,000,000 TL            │
├─────────────────────────────────────────────┤
│ GELİRLER                                    │
│ • Satış (değerlenmiş): 82,000,000 TL        │
├─────────────────────────────────────────────┤
│ SONUÇ                                       │
│ ┌─────────────────────────────────────────┐ │
│ │ ZARAR: -179,000,000 TL      ❌          │ │
│ │ Kar Marjı: -218%                        │ │
│ │ ROI: -69%                               │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ [!] Bu proje mevcut parametrelerle          │
│     fizibil DEĞİL.                          │
│                                             │
│ Başabaş için:                               │
│ • Arsa fiyatı < 20,000 TL/m² olmalı, veya   │
│ • Satış fiyatı > 125,000 TL/m² olmalı       │
└─────────────────────────────────────────────┘
       [PDF İndir]  [Senaryoları Karşılaştır]
```

---

## Part 5: Priority Order for Implementation

### Phase 1: Core Calculation Engine (NO UI changes yet)
1. Define all data structures (TypeScript interfaces)
2. Implement cost calculation with all categories
3. Implement revenue calculation per unit
4. Implement timeline & inflation logic
5. Write comprehensive tests

### Phase 2: Data Collection
1. Research actual market prices for each district
2. Research current construction costs
3. Create default data sets
4. Document data sources

### Phase 3: User Input Flow
1. Design input screens (wireframes first)
2. Implement land & zoning input
3. Implement building design input (user-controlled unit mix)
4. Implement cost input with overrides
5. Implement revenue input with overrides

### Phase 4: Output & Analysis
1. Implement summary calculations
2. Implement scenario comparison
3. Implement break-even analysis
4. Implement PDF export

---

## Part 6: Questions Before Proceeding

Before writing any code, we need to answer:

1. **Data Accuracy**: Where will we get reliable construction cost data?
2. **Market Prices**: How do we get current sale prices by district and unit type?
3. **Unit Mix**: Is the fully manual approach correct, or should we offer suggestions?
4. **Basement**: How important is modeling basement parking?
5. **Common Areas**: How do users specify what goes in common areas?
6. **Pre-sales**: Should we model selling units during construction?

---

## Document Status
- Created: December 7, 2025
- Status: DRAFT - Awaiting Review
- Next: Review with user, answer questions, then implement
