# Complete Variable List for Construction Feasibility Calculator

## Document Purpose
This is the MASTER LIST of ALL variables needed to calculate construction feasibility accurately.
Every variable is categorized by: source, data type, whether it's required, and how it affects calculations.

---

# SECTION 1: LAND & LOCATION

## 1.1 Location Identification

| # | Variable | Turkish | Type | Required | Source | Notes |
|---|----------|---------|------|----------|--------|-------|
| 1.1.1 | Province | İl | string | ✅ | User select | Default: Antalya |
| 1.1.2 | District | İlçe | string | ✅ | User select | Kepez, Muratpaşa, Konyaaltı, etc. |
| 1.1.3 | Neighborhood | Mahalle | string | ✅ | User input | Free text |
| 1.1.4 | Block Number | Ada | number | ✅ | User input | Cadastral block |
| 1.1.5 | Parcel Number | Parsel | number | ✅ | User input | Cadastral parcel |

## 1.2 Land Physical Data

| # | Variable | Turkish | Type | Unit | Required | Source | Notes |
|---|----------|---------|------|------|----------|--------|-------|
| 1.2.1 | Land Area | Parsel Alanı | number | m² | ✅ | TKGM API or manual | Official registered area |
| 1.2.2 | Land Unit Price | Arsa m² Fiyatı | number | TL/m² | ✅ | Manual | Market negotiated price |
| 1.2.3 | **Land Total Cost** | Toplam Arsa Maliyeti | number | TL | Calculated | = 1.2.1 × 1.2.2 | |

## 1.3 Zoning Parameters (İmar Bilgileri)

| # | Variable | Turkish | Type | Unit | Required | Source | Notes |
|---|----------|---------|------|------|----------|--------|-------|
| 1.3.1 | TAKS | Taban Alanı Kat Sayısı | number | ratio | ✅ | Municipality or manual | 0.00 - 1.00 |
| 1.3.2 | KAKS / EMSAL | Kat Alanı Kat Sayısı | number | ratio | ✅ | Municipality or manual | 0.00 - 5.00 typically |
| 1.3.3 | Çıkma Coefficient | Çıkma Katsayısı | number | ratio | ✅ | Municipality or manual | 1.00 - 2.00, typically 1.70 |
| 1.3.4 | Max Floors | Azami Kat Adedi | number | floors | ⚪ | Municipality or manual | Optional limit |
| 1.3.5 | Max Height | Azami Yükseklik | number | meters | ⚪ | Municipality or manual | Optional limit |
| 1.3.6 | Front Setback | Ön Çekme | number | meters | ⚪ | Municipality | Optional |
| 1.3.7 | Side Setback | Yan Çekme | number | meters | ⚪ | Municipality | Optional |
| 1.3.8 | Rear Setback | Arka Çekme | number | meters | ⚪ | Municipality | Optional |
| 1.3.9 | Zoning Status | İmar Durumu | string | - | ⚪ | Municipality | "Konut", "Ticaret", etc. |

---

# SECTION 2: BUILDING LIMITS (Calculated)

These are calculated from Section 1 inputs - user cannot directly edit these.

| # | Variable | Turkish | Formula | Unit | Notes |
|---|----------|---------|---------|------|-------|
| 2.1 | Ground Floor Max Area | Taban Alanı | 1.2.1 × 1.3.1 | m² | Max footprint |
| 2.2 | KAKS Area | KAKS Alanı | 1.2.1 × 1.3.2 | m² | Before çıkma |
| 2.3 | **Total Buildable GROSS** | Toplam İnşaat Alanı | 1.2.1 × 1.3.2 × 1.3.3 | m² | Max construction area |
| 2.4 | Max Floors (by KAKS) | KAKS Kat Adedi | 1.3.2 / 1.3.1 | floors | |
| 2.5 | Max Floors (by height) | Yükseklik Kat Adedi | 1.3.5 / 3.0 | floors | If height limit exists |
| 2.6 | **Effective Max Floors** | Efektif Kat Sayısı | min(1.3.4, 2.4, 2.5) | floors | Controlling limit |

---

# SECTION 3: BUILDING DESIGN (User Decisions)

## 3.1 Building Configuration

| # | Variable | Turkish | Type | Unit | Required | Default | Notes |
|---|----------|---------|------|------|----------|---------|-------|
| 3.1.1 | Has Basement | Bodrum Var mı | boolean | - | ✅ | true | |
| 3.1.2 | Basement Levels | Bodrum Kat Sayısı | number | floors | If 3.1.1 | 1 | 1-3 typical |
| 3.1.3 | Basement Area per Level | Bodrum Kat Alanı | number | m² | If 3.1.1 | = 2.1 | Usually = ground floor |
| 3.1.4 | Basement Use | Bodrum Kullanımı | enum | - | If 3.1.1 | "parking" | parking/storage/commercial |
| 3.1.5 | Number of Above-Ground Floors | Kat Sayısı | number | floors | ✅ | = 2.6 | User can reduce |
| 3.1.6 | Typical Floor Area | Kat Alanı | number | m² | ✅ | = 2.1 | Per floor |
| 3.1.7 | Has Penthouse | Çatı Katı Var mı | boolean | - | ⚪ | false | |
| 3.1.8 | Penthouse Area | Çatı Katı Alanı | number | m² | If 3.1.7 | | |

## 3.2 Unit Configuration (THE CRITICAL PART)

User defines each unit type they plan to build:

### 3.2.1 Unit Type Definition (Repeatable - one per unit type)

| # | Variable | Turkish | Type | Unit | Required | Notes |
|---|----------|---------|------|------|----------|-------|
| 3.2.1.1 | Unit Type | Daire Tipi | enum | - | ✅ | 1+1, 2+1, 3+1, 4+1, 5+1 |
| 3.2.1.2 | NET Area | Net Alan | number | m² | ✅ | Sellable interior area |
| 3.2.1.3 | GROSS Area | Brüt Alan | number | m² | ✅ | Including walls, common share |
| 3.2.1.4 | Unit Count | Daire Adedi | number | count | ✅ | How many of this type |
| 3.2.1.5 | Bedrooms | Yatak Odası Sayısı | number | count | Auto | From type (1+1=1, 2+1=2, etc.) |
| 3.2.1.6 | Bathrooms | Banyo Sayısı | number | count | ✅ | 1-3 per unit |
| 3.2.1.7 | Has Balcony | Balkon Var mı | boolean | - | ✅ | |
| 3.2.1.8 | Balcony Area | Balkon Alanı | number | m² | If 3.2.1.7 | |

### 3.2.2 Typical Unit Sizes (Reference Defaults)

| Type | NET m² Range | Typical NET | Typical GROSS | Bathrooms |
|------|--------------|-------------|---------------|-----------|
| 1+1 | 45-65 | 55 | 70 | 1 |
| 2+1 | 75-110 | 90 | 115 | 1-2 |
| 3+1 | 100-140 | 120 | 155 | 2 |
| 4+1 | 130-180 | 150 | 195 | 2-3 |
| 5+1 | 160-250 | 200 | 260 | 2-3 |

### 3.2.3 VALIDATED DATA: Real Project Room Breakdown (ÖZGÜNTUR RELIFE UNIQUE)

From DXF file analysis of a real 64-unit luxury project (December 2025):

**TİP-1 Unit (122.05 m² NET) - 3+1 Large Family Apartment:**

| Room | Area (m²) | Flooring Type |
|------|-----------|---------------|
| SALON (Living) | 32.85 | Laminat Parke |
| HOL & KORİDOR | 16.80 | Kütahya Seramik 60x120 |
| MUTFAK (Kitchen) | 14.70 | Kütahya Seramik 60x120 |
| EBEVEYN YATAK ODASI (Master BR) | 14.20 | Laminat Parke |
| GENÇ ODASI-1 (Bedroom 2) | 11.75 | Laminat Parke |
| GENÇ ODASI-2 (Bedroom 3) | 11.75 | Laminat Parke |
| GİYİNME ALANI (Dressing) | 6.80 | - |
| ORTAK BANYO (Shared Bath) | 4.70 | Kütahya Seramik 60x120 |
| EBEVEYN BANYO (Master Bath) | 4.00 | Kütahya Seramik 60x120 |
| BALKON | 4.50 | Kütahya Seramik 60x60 |
| **TOTAL NET** | **122.05** | |

**TİP-2 Unit (118.30 m² NET) - 3+1 Standard Family Apartment:**

| Room | Area (m²) | Flooring Type |
|------|-----------|---------------|
| SALON (Living) | 32.80 | Laminat Parke |
| HOL & KORİDOR | 16.80 | Kütahya Seramik 60x120 |
| MUTFAK (Kitchen) | 13.80 | Kütahya Seramik 60x120 |
| EBEVEYN YATAK ODASI (Master BR) | 13.00 | Laminat Parke |
| GENÇ ODASI-1 (Bedroom 2) | 11.55 | Laminat Parke |
| GENÇ ODASI-2 (Bedroom 3) | 11.55 | Laminat Parke |
| GİYİNME ALANI (Dressing) | 6.55 | - |
| ORTAK BANYO&WC | 4.55 | Kütahya Seramik 60x120 |
| EBEVEYN BANYO | 3.60 | Kütahya Seramik 60x120 |
| BALKON | 4.10 | Kütahya Seramik 60x60 |
| **TOTAL NET** | **118.30** | |

**Key Insights from Real Data:**
- **NET/BRÜT Ratio**: ~76.9% (not 85% as previously assumed!)
- **Bathroom count**: 2 per unit (standard for 3+1)
- **Corridor/Hall**: 16.80 m² (~14% of unit)
- **Salon**: ~33 m² (largest room, ~27% of unit)
- **Each bedroom**: ~11-14 m²
- **Each bathroom**: 3.6-4.7 m²
- **Balcony**: 4.1-4.5 m²

## 3.3 Calculated from Design

| # | Variable | Turkish | Formula | Unit |
|---|----------|---------|---------|------|
| 3.3.1 | Total Units | Toplam Daire Sayısı | Sum of all 3.2.1.4 | count |
| 3.3.2 | Total NET Area | Toplam Net Alan | Sum of (3.2.1.2 × 3.2.1.4) | m² |
| 3.3.3 | Total GROSS Area (units) | Daire Brüt Toplamı | Sum of (3.2.1.3 × 3.2.1.4) | m² |
| 3.3.4 | Total Bathrooms | Toplam Banyo | Sum of (3.2.1.6 × 3.2.1.4) | count |
| 3.3.5 | Common Area | Ortak Alan | 2.3 - 3.3.3 | m² |
| 3.3.6 | **Net/Gross Ratio** | Net/Brüt Oranı | 3.3.2 / 2.3 | % |
| 3.3.7 | Parking Spaces Needed | Otopark İhtiyacı | 3.3.1 × 1.0 | count |

---

# SECTION 4: CONSTRUCTION COSTS

## 4.1 Cost Configuration

| # | Variable | Turkish | Type | Unit | Required | Default | Notes |
|---|----------|---------|------|------|----------|---------|-------|
| 4.1.1 | Quality Level | Kalite Seviyesi | enum | - | ✅ | "standard" | economy/standard/premium/luxury |
| 4.1.2 | Cost Calculation Mode | Maliyet Hesap Modu | enum | - | ✅ | "quick" | quick/detailed |

## 4.2 Quick Mode - Cost per m² GROSS

| # | Variable | Turkish | Type | Unit | Required | Default by Quality |
|---|----------|---------|------|------|----------|-------------------|
| 4.2.1 | Construction Cost per m² | İnşaat m² Maliyeti | number | TL/m² | ✅ | See below |

**Default Costs per m² GROSS (2024-2025 TL):**

| Quality | TL/m² | Description |
|---------|-------|-------------|
| Economy (Ekonomik) | 14,000 | Basic finishes, local brands |
| Standard (Standart) | 19,000 | Mid-range finishes |
| Premium (Orta-Üst) | 26,000 | Quality finishes, some imports |
| Luxury (Lüks) | 38,000 | High-end, designer brands |

## 4.3 Detailed Mode - Category Breakdown

### 4.3.1 KABA İNŞAAT (Rough Construction) - ~35-40% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.1.1 | Excavation | Hafriyat | Basement volume | m³ | 180 | If basement |
| 4.3.1.2 | Foundation | Temel | Ground floor area | m² | 2,000 | |
| 4.3.1.3 | Concrete | Beton | GROSS × 0.25 | m³ | 3,000 | ~0.25 m³ per m² |
| 4.3.1.4 | Reinforcement | Demir | GROSS × 85 | kg | 28 | ~85 kg per m² |
| 4.3.1.5 | Formwork | Kalıp | GROSS × 1.2 | m² | 500 | Labor intensive |
| 4.3.1.6 | Masonry | Duvar (Tuğla/Gazbeton) | GROSS × 0.8 | m² | 400 | Interior + exterior |

### 4.3.2 TESİSAT (MEP) - ~12-18% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.2.1 | Electrical | Elektrik Tesisatı | GROSS area | m² | 1,500 | Wiring, panels |
| 4.3.2.2 | Plumbing | Sıhhi Tesisat | GROSS area | m² | 1,200 | Pipes, drains |
| 4.3.2.3 | Natural Gas | Doğalgaz Tesisatı | Per unit | adet | 18,000 | If applicable |
| 4.3.2.4 | HVAC | Isıtma/Soğutma | GROSS area | m² | 1,000 | Central or split |
| 4.3.2.5 | Elevator | Asansör | Per shaft | adet | 1,200,000 | Capacity dependent |
| 4.3.2.6 | Fire System | Yangın Sistemi | GROSS area | m² | 400 | Sprinklers, alarms |
| 4.3.2.7 | Generator | Jeneratör | Fixed | adet | 350,000 | If required |

### 4.3.3 İNCE İŞLER (Finishes) - ~25-35% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.3.1 | Plaster | Sıva | GROSS × 2.5 | m² | 180 | Interior walls |
| 4.3.3.2 | Paint | Boya | GROSS × 2.5 | m² | 120 | Interior walls |
| 4.3.3.3 | Flooring - Parke | Parke | NET × 0.6 | m² | 700 | Living/bedrooms |
| 4.3.3.4 | Flooring - Ceramic | Seramik | NET × 0.4 | m² | 500 | Wet areas, kitchen |
| 4.3.3.5 | Wall Tiles | Fayans | Total bathrooms × 25 | m² | 600 | Bathroom walls |
| 4.3.3.6 | Kitchen | Mutfak Dolabı | Per unit | adet | 120,000 | Cabinets + counter |
| 4.3.3.7 | Bathroom Complete | Banyo Komple | Per bathroom | adet | 85,000 | See 4.4 breakdown |
| 4.3.3.8 | Interior Doors | İç Kapı | Per unit × 5 avg | adet | 12,000 | ~5 doors per unit |
| 4.3.3.9 | Wardrobes | Gardırop | Per bedroom | adet | 25,000 | Built-in |
| 4.3.3.10 | Lighting | Aydınlatma | Per unit × 50 avg | adet | 350 | ~50 fixtures standard |

### 4.3.4 DIŞ CEPHE & DOĞRAMA (Facade & Windows) - ~8-12% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.4.1 | Windows | Pencere | GROSS × 0.15 | m² | 5,500 | ~15% of floor as window |
| 4.3.4.2 | Balcony Doors | Balkon Kapısı | Per unit | adet | 18,000 | If balcony |
| 4.3.4.3 | Entrance Door | Daire Giriş Kapısı | Per unit | adet | 8,000 | Steel security |
| 4.3.4.4 | Facade Cladding | Dış Cephe Kaplaması | Facade area | m² | 1,200 | Varies by type |
| 4.3.4.5 | Facade Insulation | Dış Cephe Yalıtımı | Facade area | m² | 450 | Mandatory |
| 4.3.4.6 | Roof | Çatı | Roof area | m² | 800 | If not flat |
| 4.3.4.7 | Roof Waterproofing | Çatı İzolasyonu | Roof area | m² | 350 | |
| 4.3.4.8 | Balcony Rails | Balkon Korkuluğu | Per unit × 3m avg | m | 3,500 | If balcony |

### 4.3.5 ORTAK ALANLAR (Common Areas) - ~5-10% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.5.1 | Lobby Finish | Lobi Dekorasyonu | Per block | adet | 200,000 | Varies greatly |
| 4.3.5.2 | Stairwell Finish | Merdiven Evi | Per floor × blocks | adet | 25,000 | |
| 4.3.5.3 | Corridor Finish | Koridor | Per floor × blocks | adet | 15,000 | |
| 4.3.5.4 | Parking Finish | Otopark Döşemesi | Basement area | m² | 450 | Epoxy, lighting |

### 4.3.6 ÇEVRE DÜZENLEMESİ (Site Work) - ~3-5% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.6.1 | Landscaping | Peyzaj | Open area | m² | 500 | Gardens, plants |
| 4.3.6.2 | Site Roads | Site Yolları | Road area | m² | 700 | Asphalt/paving |
| 4.3.6.3 | Perimeter Wall | Çevre Duvarı | Linear meters | m | 5,000 | |
| 4.3.6.4 | Site Lighting | Dış Aydınlatma | Fixed | adet | 100,000 | |
| 4.3.6.5 | Pool | Havuz | If included | adet | 800,000 | Optional |
| 4.3.6.6 | Children's Play Area | Çocuk Parkı | Fixed | adet | 150,000 | Optional |
| 4.3.6.7 | Fitness Area | Spor Alanı | Fixed | adet | 250,000 | Optional |

### 4.3.7 PROJE & RESMİ GİDERLER (Soft Costs) - ~5-8% of total

| # | Item | Turkish | Quantity Basis | Unit | Default TL/unit | Notes |
|---|------|---------|---------------|------|-----------------|-------|
| 4.3.7.1 | Architectural Design | Mimari Proje | GROSS area | m² | 120 | |
| 4.3.7.2 | Structural Design | Statik Proje | GROSS area | m² | 60 | |
| 4.3.7.3 | MEP Design | Mekanik Proje | GROSS area | m² | 45 | |
| 4.3.7.4 | Building Permit | Yapı Ruhsatı | Fixed + m² | TL | 250,000 | Varies by municipality |
| 4.3.7.5 | Occupancy Permit | İskan | Fixed | TL | 100,000 | |
| 4.3.7.6 | Soil Survey | Zemin Etüdü | Fixed | TL | 50,000 | |

### 4.3.8 FİNANSAL GİDERLER (Financial Costs) - ~15-25% of subtotal

| # | Item | Turkish | Quantity Basis | Unit | Default | Notes |
|---|------|---------|---------------|------|---------|-------|
| 4.3.8.1 | Contingency | Beklenmeyen Giderler | % of subtotal | % | 12% | |
| 4.3.8.2 | Overhead | Genel Giderler | % of subtotal | % | 8% | Site office, utilities |
| 4.3.8.3 | Builder Profit | Müteahhit Karı | % of subtotal | % | 12% | If contractor build |
| 4.3.8.4 | Financing Cost | Finansman Gideri | % of total | % | 0% | If loan used |

## 4.4 Bathroom Detail Breakdown (For Detailed Mode)

Based on real project data (ÖZGÜNTUR RELIFE UNIQUE):

| # | Item | Turkish | Per Bathroom | Default TL | Brand Examples |
|---|------|---------|--------------|------------|----------------|
| 4.4.1 | WC (Wall-hung) | Asma Klozet | 1 | 8,000 | Duravit, Vitra, Creavit |
| 4.4.2 | WC Seat | Klozet Kapağı | 1 | 2,500 | |
| 4.4.3 | Concealed Cistern | Gömme Rezervuar | 1 | 6,000 | Grohe, Geberit |
| 4.4.4 | Flush Plate | Kumanda Paneli | 1 | 2,000 | |
| 4.4.5 | Basin (under/vessel) | Lavabo | 1 | 4,000 | Duravit, Vitra |
| 4.4.6 | Basin Faucet | Lavabo Bataryası | 1 | 3,500 | Grohe, Artema |
| 4.4.7 | Basin Siphon | Lavabo Sifonu | 1 | 800 | |
| 4.4.8 | Shower Set | Duş Seti | 1 | 8,000 | Rainshower, head, hose |
| 4.4.9 | Shower Mixer | Duş Bataryası | 1 | 4,500 | Grohe, Artema |
| 4.4.10 | Shower Tray/Drain | Duş Kanalı/Süzgeç | 1 | 3,500 | |
| 4.4.11 | Mirror Cabinet | Aynalı Dolap | 1 | 3,000 | |
| 4.4.12 | Accessories | Aksesuar Seti | 1 | 2,500 | Towel bar, hooks, etc. |
| **TOTAL per bathroom** | | | | **~48,000 TL** | Standard quality |

**Quality Multipliers for Bathroom:**
- Economy: 0.6× (~29,000 TL)
- Standard: 1.0× (~48,000 TL)
- Premium: 1.5× (~72,000 TL)
- Luxury: 2.5× (~120,000 TL) - Grohe, Duravit designer

## 4.5 Kitchen Detail Breakdown (For Detailed Mode)

| # | Item | Turkish | Per Kitchen | Default TL | Notes |
|---|------|---------|-------------|------------|-------|
| 4.5.1 | Base Cabinets | Alt Dolap | ~4 m | 20,000 | Per linear meter |
| 4.5.2 | Wall Cabinets | Üst Dolap | ~3 m | 12,000 | Per linear meter |
| 4.5.3 | Countertop | Tezgah | ~4 m | 15,000 | Granite/quartz |
| 4.5.4 | Sink | Evye | 1 | 5,000 | Franke, Alveus |
| 4.5.5 | Kitchen Faucet | Mutfak Bataryası | 1 | 4,000 | |
| 4.5.6 | Backsplash | Tezgah Arası | ~2 m² | 3,000 | Tile or glass |
| **TOTAL per kitchen** | | | | **~80,000 TL** | Standard quality |

---

# SECTION 5: SALES REVENUE

## 5.1 Base Pricing

| # | Variable | Turkish | Type | Unit | Required | Source | Notes |
|---|----------|---------|------|------|----------|--------|-------|
| 5.1.1 | District Base Price | Bölge Baz Fiyatı | number | TL/m² NET | ✅ | Market data | Per district |
| 5.1.2 | Price Reference Date | Fiyat Referans Tarihi | date | - | ✅ | User | When price was set |

## 5.2 Price Adjustments by Unit Type

| Type | Multiplier | Reason |
|------|------------|--------|
| 1+1 | 1.05-1.10 | High demand, investors |
| 2+1 | 1.00 | Base (most common) |
| 3+1 | 0.98-1.00 | Family demand |
| 4+1 | 0.95-0.98 | Larger = lower per m² |
| 5+1 | 0.92-0.95 | Premium but lower per m² |

## 5.3 Price Adjustments by Floor

| Floor | Multiplier | Notes |
|-------|------------|-------|
| Ground / Zemin | 0.92-0.95 | Less desirable unless garden |
| 1-2 | 0.98-1.00 | Standard |
| 3-5 | 1.00-1.03 | Preferred |
| 6+ | 1.03-1.08 | View premium |
| Penthouse | 1.15-1.30 | Significant premium |
| Garden unit | 1.05-1.15 | If has private garden |

## 5.4 Price Adjustments by Features

| Feature | Adjustment | Notes |
|---------|------------|-------|
| Sea View | +15-25% | Major premium |
| City View | +5-10% | Minor premium |
| Corner Unit | +3-5% | More windows |
| South Facing | +3-5% | Sun exposure |
| North Facing | -3-5% | Less sun |
| Large Balcony | +3-5% | If above average |
| 2+ Bathrooms | +2-3% | Convenience |

## 5.5 Per Unit Revenue Calculation

For each unit:
```
Unit Revenue = NET m² × Base Price × Type Multiplier × Floor Multiplier × Feature Adjustments
```

## 5.6 Market Data by District (Antalya - needs research)

| District | Economy TL/m² | Standard TL/m² | Premium TL/m² | Luxury TL/m² |
|----------|---------------|----------------|---------------|--------------|
| Kepez - Center | 28,000 | 33,000 | 40,000 | 50,000 |
| Kepez - New Dev | 32,000 | 38,000 | 45,000 | 55,000 |
| Muratpaşa - Center | 38,000 | 45,000 | 55,000 | 70,000 |
| Muratpaşa - Lara | 50,000 | 60,000 | 75,000 | 95,000 |
| Konyaaltı - Center | 42,000 | 50,000 | 60,000 | 75,000 |
| Konyaaltı - Beach | 55,000 | 65,000 | 80,000 | 100,000 |
| Aksu | 25,000 | 30,000 | 36,000 | 45,000 |
| Döşemealtı | 22,000 | 27,000 | 33,000 | 42,000 |

**Note**: These are ESTIMATES. Need verification from:
- Sahibinden.com
- Hepsiemlak.com
- Local agents

---

# SECTION 6: TIMELINE & ECONOMIC PARAMETERS

## 6.1 Project Timeline

| # | Variable | Turkish | Type | Unit | Required | Default | Notes |
|---|----------|---------|------|------|----------|---------|-------|
| 6.1.1 | Construction Duration | İnşaat Süresi | number | months | ✅ | Auto | Based on size |
| 6.1.2 | Sales Period | Satış Süresi | number | months | ✅ | 12 | After construction |
| 6.1.3 | Pre-sale Start | Ön Satış Başlangıcı | number | months | ⚪ | 0 | 0 = no pre-sales |
| 6.1.4 | Pre-sale Discount | Ön Satış İskontosu | number | % | If 6.1.3 | 10 | Discount for early buyers |

**Default Construction Duration:**

| Project Size | Duration |
|--------------|----------|
| < 2,000 m² GROSS | 12 months |
| 2,000-5,000 m² | 18 months |
| 5,000-10,000 m² | 24 months |
| 10,000-20,000 m² | 30 months |
| > 20,000 m² | 36 months |

## 6.2 Economic Parameters

| # | Variable | Turkish | Type | Unit | Required | Default | Notes |
|---|----------|---------|------|------|----------|---------|-------|
| 6.2.1 | Monthly Inflation | Aylık Enflasyon | number | % | ✅ | 2.5 | Construction cost increase |
| 6.2.2 | Monthly Appreciation | Aylık Değer Artışı | number | % | ✅ | 1.5 | Property value increase |
| 6.2.3 | Discount Rate | İskonto Oranı | number | % | ✅ | 1.0 | For NPV calculation |
| 6.2.4 | USD/TRY Rate | Dolar Kuru | number | TL | ⚪ | Market | If using $ reference |
| 6.2.5 | EUR/TRY Rate | Euro Kuru | number | TL | ⚪ | Market | If using € reference |

## 6.3 Cost Distribution (S-Curve)

Construction costs are not spent evenly. Default S-curve:

| Phase | Months | % of Cost | Cumulative |
|-------|--------|-----------|------------|
| Mobilization | 1-2 | 5% | 5% |
| Foundation | 2-4 | 10% | 15% |
| Structure | 4-10 | 35% | 50% |
| Envelope | 8-12 | 15% | 65% |
| MEP Rough | 10-14 | 10% | 75% |
| Finishes | 12-18 | 20% | 95% |
| Completion | 18-20 | 5% | 100% |

---

# SECTION 7: CALCULATED OUTPUTS

## 7.1 Cost Outputs

| # | Output | Turkish | Formula |
|---|--------|---------|---------|
| 7.1.1 | Total Land Cost | Arsa Maliyeti | 1.2.3 |
| 7.1.2 | Construction Cost (Nominal) | İnşaat Maliyeti (Nominal) | Sum of Section 4 |
| 7.1.3 | Construction Cost (Inflated) | İnşaat Maliyeti (Enflasyonlu) | Apply 6.2.1 per S-curve |
| 7.1.4 | **Total Project Cost** | Toplam Proje Maliyeti | 7.1.1 + 7.1.3 |
| 7.1.5 | Cost per Unit | Birim Maliyet | 7.1.4 / 3.3.1 |
| 7.1.6 | Cost per NET m² | Net m² Maliyeti | 7.1.4 / 3.3.2 |

## 7.2 Revenue Outputs

| # | Output | Turkish | Formula |
|---|--------|---------|---------|
| 7.2.1 | Total Revenue (Current) | Toplam Gelir (Güncel) | Sum of all unit revenues |
| 7.2.2 | Total Revenue (Appreciated) | Toplam Gelir (Değerlenmiş) | Apply 6.2.2 over timeline |
| 7.2.3 | Revenue per Unit | Birim Gelir | 7.2.2 / 3.3.1 |
| 7.2.4 | Revenue per NET m² | Net m² Gelir | 7.2.2 / 3.3.2 |

## 7.3 Profitability Outputs

| # | Output | Turkish | Formula |
|---|--------|---------|---------|
| 7.3.1 | Gross Profit | Brüt Kar | 7.2.2 - 7.1.4 |
| 7.3.2 | Profit Margin | Kar Marjı | 7.3.1 / 7.2.2 × 100 |
| 7.3.3 | ROI | Yatırım Getirisi | 7.3.1 / 7.1.4 × 100 |
| 7.3.4 | NPV | Net Bugünkü Değer | DCF with 6.2.3 |
| 7.3.5 | Profit per Unit | Birim Kar | 7.3.1 / 3.3.1 |
| 7.3.6 | Profit per NET m² | Net m² Kar | 7.3.1 / 3.3.2 |

## 7.4 Break-Even Analysis

| # | Output | Turkish | Formula |
|---|--------|---------|---------|
| 7.4.1 | Break-Even Sale Price | Başabaş Satış Fiyatı | 7.1.4 / 3.3.2 |
| 7.4.2 | Break-Even Units | Başabaş Daire Sayısı | 7.1.4 / (Revenue per unit) |
| 7.4.3 | Max Land Price for 20% ROI | Maks Arsa Fiyatı | Calculated |

---

# SECTION 8: SCENARIO ANALYSIS

## 8.1 Predefined Scenarios

### Optimistic (İyimser)
| Parameter | Adjustment |
|-----------|------------|
| Construction Cost | -8% |
| Sale Price | +8% |
| Inflation | -0.5%/month |
| Appreciation | +0.5%/month |
| Timeline | -15% |

### Base (Gerçekçi)
- All parameters as entered

### Pessimistic (Kötümser)
| Parameter | Adjustment |
|-----------|------------|
| Construction Cost | +15% |
| Sale Price | -10% |
| Inflation | +1.0%/month |
| Appreciation | -0.5%/month |
| Timeline | +25% |

## 8.2 Custom Scenarios

User can create custom scenarios by adjusting any parameter.

---

# SECTION 9: DATA SOURCES

## 9.1 Automated (API)

| Data | Source | Status |
|------|--------|--------|
| Land Area | TKGM API | ⚠️ Needs testing |
| TAKS/KAKS | Municipality KEOS | ⚠️ Partial |
| Exchange Rates | TCMB | ⚪ Not implemented |

## 9.2 Manual with Defaults

| Data | Default Source | Confidence |
|------|---------------|------------|
| Construction Costs | Industry averages + real project | Medium |
| Sale Prices | Market estimates | Low - needs real data |
| Economic Parameters | TCMB + market | Medium |

## 9.3 User Must Provide

| Data | Why |
|------|-----|
| Land Price | Negotiated, highly variable |
| Unit Configuration | Design decision |
| Quality Level | Design decision |
| Sale Price Adjustment | Local market knowledge |

---

# APPENDIX: Variable Count Summary

| Section | Variables | Required | Optional | Calculated |
|---------|-----------|----------|----------|------------|
| 1. Land & Location | 14 | 10 | 4 | 1 |
| 2. Building Limits | 6 | - | - | 6 |
| 3. Building Design | 18+ | 10+ | 5+ | 7 |
| 4. Construction Costs | 60+ | ~20 | ~40 | - |
| 5. Sales Revenue | 15+ | 5 | 10+ | - |
| 6. Timeline & Economic | 10 | 5 | 5 | - |
| 7. Outputs | - | - | - | 15+ |
| **TOTAL** | **~125** | **~50** | **~65** | **~30** |

---

---

# APPENDIX B: AutoCAD DWG File Analysis

## Available DWG Files

| File | Size | Contents |
|------|------|----------|
| ÖZGÜNTUR RELIFE UNIQUE 111125.dwg | 8.4 MB | Main apartment layouts |
| ÖZGÜNTUR RELIFE UNIQUE A,B,C,D BLOK LOBİ & E BLOK LOBİ-KAT KORİDORLARI 281025.dwg | 4.3 MB | Lobby & corridor details |
| ÖZGÜNTUR RELIFE UNIQUE GENEL MEKANLAR 281025.dwg | 4.3 MB | Common areas |

## DWG File Format
- Version: AC1018 (AutoCAD 2004 format)
- Note: Reading DWG programmatically requires LibreDWG or ODA File Converter

## Data Typically Available in DWG Files

### From Floor Plans:
1. **Unit NET areas** (exact m² per apartment)
2. **Unit GROSS areas** (including walls)
3. **Room dimensions** (salon, bedrooms, bathrooms)
4. **Common area sizes** (corridors, stairs, lobby)
5. **Balcony dimensions**
6. **Window/door schedules** (sizes, quantities)

### From Material Schedules:
1. **Door schedules** (type, size, quantity)
2. **Window schedules** (type, size, quantity)
3. **Flooring schedules** (area by type)
4. **Tile/ceramic schedules**

### For Future Integration:
When user uploads AutoCAD file, we can extract:
- Exact unit sizes (more accurate than manual entry)
- Room counts and sizes
- Door/window quantities
- Total floor areas

## Recommendation for Calculator

Add "AutoCAD Upload" feature in future:
1. User uploads DWG file
2. System extracts unit dimensions
3. Auto-populates unit configuration (Section 3.2)
4. User can verify and adjust

This would significantly improve accuracy over manual entry.

---

---

# APPENDIX C: Validated Material Quantities (From DXF + Excel Analysis)

## C.1 Project Summary: ÖZGÜNTUR RELIFE UNIQUE

| Parameter | Value |
|-----------|-------|
| Total Units | 64 (48 TİP-1 + 16 TİP-2) |
| Unit Type | 3+1 (3 bedrooms + living) |
| TİP-1 NET Area | 122.05 m² |
| TİP-2 NET Area | 118.30 m² |
| Total NET Area | 7,751.20 m² |
| Estimated GROSS | ~10,077 m² |
| **NET/BRÜT Ratio** | **76.9%** |
| Quality Level | Premium/Luxury |

## C.2 Material Quantities Per Unit (Validated)

### Flooring Materials

| Material | Total Project | Per Unit | Applied To |
|----------|---------------|----------|------------|
| **Ceramic/Seramik** | 5,441.6 m² | 85.0 m² | Wet areas, kitchen, corridors, common |
| **Parke (Laminate)** | 5,120.0 m² | 80.0 m² | Salon, bedrooms |
| **TOTAL FLOORING** | 10,561.6 m² | 165.0 m² | |

**Ceramic Breakdown:**
- Kütahya Seramik 60x120 (Riva Fildişi): Wet areas, corridors
- Kütahya Seramik 60x60 (Vista Bone): Balconies
- Vitra Mozaik: Bathroom accents

### Sanitary & Fixtures (Per Unit)

| Item | Qty/Unit | Brand | Notes |
|------|----------|-------|-------|
| Kitchen Sink | 1 | Franke Maris | Granite |
| Kitchen Faucet | 1 | - | Spiral chrome |
| Lavabo (Basin) | 2 | Duravit | 1 undermount + 1 vessel |
| Basin Faucet | 2 | Grohe | |
| Siphon | 3 | - | Kitchen + 2 baths |
| Rainshower Set | 2 | - | Full set per bathroom |
| Handheld Shower | 2 | - | |
| Shower Mixer | 2 | Grohe Essence | |
| WC (Wall-hung) | 2 | Duravit Starck 3 | |
| WC Seat | 2 | - | Soft-close |
| Concealed Cistern | 2 | Grohe Uniset | |
| Shower Drain | 2 | Hüppe Galata | Channel drain |
| Point Drain | 1 | - | |

### Lighting (Per Unit)

| Item | Qty/Unit | Brand | Location |
|------|----------|-------|----------|
| Recessed Spots (small) | ~35 | GOYA GY 1774-8 | Rooms, bathrooms |
| Recessed Spots (large) | ~22 | GOYA GY 2051-12 | General |
| Linear Fixtures | ~7 | GOYA GY 2003-3 | Salon, bedrooms, corridor |
| Kitchen Lighting | ~2 | GOYA GY 2003-2 | Kitchen |
| Bathroom Fixtures | 2 | ARMADA ARM 230 | Bathrooms |
| Corridor Fixtures | ~3 | DR. LIGHT COIN | Corridor |
| Balcony Fixture | 1 | GOYA GY 1883-24 | Balcony |
| **TOTAL/UNIT** | **~74** | | |

## C.3 Cost Validation Against Industry Standards

### Per Unit Material Costs (Estimated 2024-2025 TL)

| Category | Per Unit (TL) | Per m² NET (TL) |
|----------|---------------|-----------------|
| Flooring - Ceramic | 45,000 - 55,000 | ~410 |
| Flooring - Parke | 40,000 - 80,000 | ~500 |
| Sanitary/Fixtures | 160,000 - 240,000 | ~1,640 |
| Lighting | 15,000 - 40,000 | ~225 |
| **İnce İşler Total** | **260,000 - 415,000** | **~2,775** |

**Note:** This is ONLY interior finishes (İnce İşler). Does NOT include:
- Kaba İnşaat (Rough Construction)
- Tesisat (MEP installation)
- Dış Cephe (Facade)
- Common areas
- Site work

### Comparison with Quick Mode Defaults

| Quality | Our Default (TL/m² GROSS) | Real Project (TL/m² GROSS) | Variance |
|---------|---------------------------|----------------------------|----------|
| Premium | 26,000 | ~28,000* | +8% |
| Luxury | 38,000 | ~35,000* | -8% |

*Estimated based on partial material data (finishes only)

## C.4 Key Findings for Calculator Accuracy

### ✅ VALIDATED Values:
1. **NET/BRÜT Ratio: 76.9%** (not 85% - major correction!)
2. **Lighting fixtures: 74/unit** (high for luxury)
3. **Bathrooms: 2 per 3+1 unit** (standard)
4. **Flooring split: 52% ceramic / 48% parke**
5. **Balcony size: 4.1-4.5 m²** (typical)

### ⚠️ NEEDS VERIFICATION:
1. Rough construction costs (concrete, steel, labor rates)
2. MEP installation costs (only fixtures, not pipes/wires)
3. Facade and window costs
4. Common area construction costs

### 🔄 RECOMMENDED UPDATES TO CALCULATOR:
1. Change default NET/BRÜT from 85% to **77%**
2. Add bathroom count input (affects fixture costs significantly)
3. Add lighting fixture count as quality indicator (~50 standard, ~75 luxury)
4. Separate flooring input by type (ceramic vs parke)
5. Track common area flooring separately from unit flooring

---

## Document Status
- Created: December 7, 2025
- Version: 1.1 (Updated with DXF/Excel validation)
- Status: DRAFT - For review
- Next: Get user approval, then design UI flow
