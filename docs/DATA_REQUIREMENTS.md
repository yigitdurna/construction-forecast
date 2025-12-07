# Data Requirements for Construction Forecast Tool

**Purpose**: This document specifies exactly what data is needed to update the calculation tool and maintain accuracy.

**Current Accuracy**: ±15-30% depending on parameter
**Target Accuracy**: ±5-10% with complete data

---

## 📁 Data Files to Update

### 1. Location Data
**File**: `src/data/antalyaLocations.ts`
**Update Frequency**: Monthly

### 2. Cost Parameters
**File**: `src/data/costParameterDefaults.ts`
**Update Frequency**: Quarterly

### 3. Economic Defaults
**File**: `src/utils/calculations.ts` (constants)
**Update Frequency**: Monthly

---

## 📊 Location Data Format

### Required JSON Structure

```json
{
  "id": "konyaalti_sahil",
  "name": "Konyaaltı Sahil",
  "district": "Konyaaltı",
  "prices": {
    "landPrice": 45000,
    "salesPriceApartment": 115000,
    "salesPriceVilla": 175000,
    "rentalYield": 4.2
  },
  "market": {
    "demandLevel": "very_high",
    "supplyLevel": "balanced",
    "priceGrowthTrend": 18,
    "foreignBuyerShare": 35
  },
  "infrastructure": {
    "transportScore": 9,
    "socialFacilities": 8,
    "beachAccess": true,
    "viewQuality": 9
  },
  "investment": {
    "riskLevel": "low",
    "liquidityScore": 8,
    "developmentPotential": 7
  },
  "lastUpdated": "2025-11"
}
```

### Field Definitions

| Field | Type | Unit | Description |
|-------|------|------|-------------|
| `id` | string | - | Unique identifier (lowercase, underscores) |
| `name` | string | - | Display name in Turkish |
| `district` | string | - | Parent district name |
| `prices.landPrice` | number | TL/m² | Average land price |
| `prices.salesPriceApartment` | number | TL/m² | Average apartment sale price |
| `prices.salesPriceVilla` | number | TL/m² | Average villa sale price |
| `prices.rentalYield` | number | % | Annual rental yield |
| `market.demandLevel` | enum | - | "very_high" \| "high" \| "medium" \| "low" |
| `market.supplyLevel` | enum | - | "undersupply" \| "balanced" \| "oversupply" |
| `market.priceGrowthTrend` | number | %/year | Annual price growth rate |
| `market.foreignBuyerShare` | number | % | Percentage of foreign buyers |
| `infrastructure.transportScore` | number | 1-10 | Public transport accessibility |
| `infrastructure.socialFacilities` | number | 1-10 | Schools, hospitals, shops |
| `infrastructure.beachAccess` | boolean | - | Walking distance to beach |
| `infrastructure.viewQuality` | number | 1-10 | Sea/mountain view potential |
| `investment.riskLevel` | enum | - | "low" \| "medium" \| "high" |
| `investment.liquidityScore` | number | 1-10 | How fast properties sell |
| `investment.developmentPotential` | number | 1-10 | Future growth potential |
| `lastUpdated` | string | YYYY-MM | Last data update month |

### Data Collection Sources

1. **Land Prices**
   - Sahibinden.com land listings
   - Zingat.com land listings
   - Local real estate agents (3+ quotes)

2. **Sales Prices**
   - Zingat average prices by district
   - Sahibinden sold listings
   - Emlak Konut GYO reports
   - TCMB Real Estate Price Index

3. **Market Intelligence**
   - Local realtor surveys
   - Municipal building permit data
   - Foreign buyer statistics from TCMB

---

## 📊 Cost Parameter Format

### Required JSON Structure

```json
{
  "id": "structural_frame",
  "category": "structure",
  "label": "Structural Frame",
  "labelTR": "Betonarme Karkas",
  "description": "Reinforced concrete frame, columns, beams, slabs",
  "unit": "TL/m²",
  "rangeByQuality": {
    "standard": { "min": 4500, "max": 6000, "default": 5400 },
    "mid": { "min": 5500, "max": 7500, "default": 6500 },
    "luxury": { "min": 7000, "max": 10000, "default": 8500 }
  },
  "appliesTo": "gross_sqm",
  "source": "default",
  "isAdvanced": false
}
```

### Categories

| Category | Turkish | Description |
|----------|---------|-------------|
| `structure` | Kaba Yapı | Foundation, frame, concrete |
| `envelope` | Dış Cephe | Walls, windows, roof |
| `mep` | Mekanik/Elektrik | HVAC, electrical, plumbing |
| `interior` | İç Mekan | Flooring, kitchen, bathroom |
| `site` | Saha İşleri | Landscaping, pool |
| `soft` | Yumuşak Maliyet | Design, permits |
| `financial` | Finansal | Contingency, contractor margin |

### Unit Types

| Unit | Description | Example |
|------|-------------|---------|
| `TL/m²` | Cost per square meter | 8,500 TL/m² for structural frame |
| `TL` | Fixed cost | 500,000 TL for kitchen |
| `%` | Percentage of subtotal | 15% contingency |
| `x` | Multiplier | 1.25x quality multiplier |

### Application Types

| `appliesTo` | Calculation |
|-------------|-------------|
| `gross_sqm` | value × totalSqm |
| `net_sqm` | value × (totalSqm × 0.85) |
| `land_sqm` | value × landSize |
| `fixed` | value × numUnits |
| `subtotal` | value% × sum(previous costs) |

### Data Collection Sources

1. **Construction Costs**
   - Local contractor quotes (3-5 per district)
   - İnşaat Mühendisleri Odası (Chamber of Civil Engineers)
   - Material supplier price lists
   - Recent project invoices

2. **Soft Costs**
   - Architect fee schedules
   - Municipal permit fee tables
   - Engineering firm quotes

---

## 📊 Economic Parameters

### Required Values

| Parameter | Location | Default | Update Frequency |
|-----------|----------|---------|------------------|
| `monthlyInflationRate` | calculations.ts | 0.025 | Monthly |
| `monthlyAppreciationRate` | calculations.ts | 0.015 | Monthly |
| `DEFAULT_MONTHLY_DISCOUNT_RATE` | calculations.ts | 0.01 | Quarterly |

### Data Sources

1. **Inflation Rate**
   - TCMB (Central Bank) inflation projections
   - TÜİK (TURKSTAT) CPI data
   - Construction cost index (İnşaat Maliyet Endeksi)

2. **Appreciation Rate**
   - TCMB Real Estate Price Index
   - District-level historical price data
   - Zingat/Sahibinden trend reports

---

## 📋 Monthly Update Checklist

```markdown
## Month: [YYYY-MM]

### Location Data Updates
For each of 15 districts:
- [ ] Land price (from 3+ listings)
- [ ] Apartment sale price (from 20+ listings)
- [ ] Villa sale price (from 10+ listings)
- [ ] Market demand assessment
- [ ] Update lastUpdated field

### Economic Parameters
- [ ] Check TCMB inflation projections
- [ ] Check construction cost index
- [ ] Update monthlyInflationRate if needed
- [ ] Check real estate price index
- [ ] Update monthlyAppreciationRate if needed

### Cost Parameters (Quarterly)
- [ ] Get contractor quotes for major categories
- [ ] Check material price changes
- [ ] Update rangeByQuality values

### Validation
- [ ] Run test calculations
- [ ] Compare with recent actual projects
- [ ] Flag any >15% deviations
```

---

## 📁 File Update Instructions

### Updating Location Data

**Step 1**: Open `src/data/antalyaLocations.ts`

**Step 2**: Find the location to update:
```typescript
{
  id: 'konyaalti_sahil',
  name: 'Konyaaltı Sahil',
  // ...
}
```

**Step 3**: Update the prices:
```typescript
prices: {
  landPrice: 48000,  // ← New value
  salesPriceApartment: 120000,  // ← New value
  salesPriceVilla: 180000,  // ← New value
  rentalYield: 4.5,
},
```

**Step 4**: Update the lastUpdated field:
```typescript
lastUpdated: '2025-12',  // ← New month
```

### Updating Cost Parameters

**Step 1**: Open `src/data/costParameterDefaults.ts`

**Step 2**: Find the parameter to update:
```typescript
{
  id: 'structural_frame',
  // ...
}
```

**Step 3**: Update the range values:
```typescript
rangeByQuality: {
  standard: { min: 5000, max: 6500, default: 5800 },  // ← New values
  mid: { min: 6000, max: 8000, default: 7000 },
  luxury: { min: 7500, max: 10500, default: 9000 },
},
```

### Updating Economic Defaults

**Step 1**: Open `src/utils/calculations.ts`

**Step 2**: Find the default values (around line 400-420):
```typescript
const monthlyInflationRate = inputs.monthlyInflationRate ?? 0.025; // ← Update
const monthlyAppreciationRate = inputs.monthlyAppreciationRate ?? 0.015; // ← Update
```

---

## 📊 Data Validation Rules

### Before Accepting New Data

1. **Sample Size Check**
   - Min 20 listings per location per month for sales prices
   - Min 10 listings for land prices
   - Min 3 contractor quotes for cost parameters

2. **Outlier Removal**
   ```
   Remove values > 2 standard deviations from mean
   ```

3. **Sanity Checks**
   - Month-over-month change < 15% (flag if exceeded)
   - Construction cost < land cost is suspicious
   - Villa price > apartment price (always)
   - Luxury > mid > standard (always)

4. **Cross-Validation**
   - Compare with TCMB index
   - Compare with TÜİK data
   - Flag if difference > 20%

---

## 🎯 Priority Data Collection

**If you can only collect 3 things:**

1. **Monthly Sales Prices** (Highest impact)
   - 30 minutes per month
   - Scrape Zingat/Sahibinden
   - Improves accuracy from ±20% to ±12%

2. **Quarterly Contractor Quotes** (High impact)
   - 2 hours per quarter
   - Call 3-5 local contractors
   - Improves accuracy from ±15% to ±10%

3. **Monthly Economic Rates** (Medium impact)
   - 15 minutes per month
   - Check TCMB website
   - Ensures projections stay current

---

## 📧 Data Submission

### Option 1: Direct File Edit
- Edit the TypeScript files directly
- Submit as pull request or file update

### Option 2: JSON Data File
```json
{
  "submissionDate": "2025-12-01",
  "dataType": "location_prices",
  "location": "Konyaaltı Sahil",
  "data": {
    "landPrice": 48000,
    "salesPriceApartment": 120000,
    "salesPriceVilla": 180000
  },
  "source": "Zingat + Sahibinden average",
  "sampleSize": 47,
  "confidence": "high"
}
```

### Option 3: Spreadsheet
- Use provided Excel template
- Fill in monthly values
- Import script will process

---

**Questions?** See `CALCULATION_GUIDE.md` for how calculations work.
