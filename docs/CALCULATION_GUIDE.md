# Construction Forecast Tool - Complete Calculation Guide

**Last Updated: November 30, 2025**

## Table of Contents
1. [Overview](#overview)
2. [Input Parameters](#input-parameters)
3. [Calculation Flow](#calculation-flow)
4. [Mathematical Formulas](#mathematical-formulas)
5. [Three Profit Scenarios](#three-profit-scenarios)
6. [NPV & Time Value of Money](#npv--time-value-of-money)
7. [Default Values & Sources](#default-values--sources)
8. [Known Limitations](#known-limitations)

---

## Overview

This tool calculates construction project profitability for the Antalya region using:
- **Detailed cost parameters** by construction category (structure, envelope, MEP, interior, site, soft costs, financial)
- **Location-specific market data** from real sources (15 Antalya districts)
- **Time-adjusted calculations** (inflation on costs, appreciation on sales)
- **NPV (Net Present Value)** discounting for time value of money
- **Three scenario analysis** (Optimistic, Realistic, Pessimistic)

---

## Input Parameters

### Required Inputs
| Parameter | Turkish | Description |
|-----------|---------|-------------|
| **Location** | Lokasyon | One of 15 Antalya districts |
| **Total Construction Area** | Toplam İnşaat Alanı | Total construction area in m² |
| **EMSAL** | İmar Katsayısı | Floor Area Ratio (zoning coefficient) |
| **Project Type** | Proje Tipi | apartment, villa, commercial, etc. |

### Optional Inputs (with defaults)
| Parameter | Turkish | Default | Description |
|-----------|---------|---------|-------------|
| **Land Size** | Arsa Büyüklüğü | 0 | Land area in m². 0 = you already own it |
| **Construction Duration** | İnşaat Süresi | Auto | Months to build (calculated from size) |
| **Start Date** | Başlangıç Tarihi | Today | Project start date |
| **Months to Sell** | Satış Süresi | 6 | Months after completion to sell |
| **Monthly Inflation** | Aylık Enflasyon | 2.5% | Expected monthly construction cost inflation |
| **Monthly Appreciation** | Aylık Fiyat Artışı | 1.5% | Real estate price growth rate |

### Auto-Calculated Values
- **Construction Duration** (if not provided):
  - Villa < 500m²: 10 months
  - Villa ≥ 500m²: 14 months
  - Apartment < 3000m²: 14 months
  - Apartment 3000-8000m²: 18 months
  - Apartment > 8000m²: 24 months

- **Net-to-Gross Ratio**: 85% (net saleable area = total × 0.85)
- **Number of Units**: Total SQM ÷ Average Unit Size (varies by project type)

---

## Calculation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    1. INPUT VALIDATION                          │
│  • Validate required fields (location, totalSqm, emsal, type)   │
│  • Apply defaults for optional fields                           │
│  • Calculate derived values (construction duration, units)      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  2. COST CALCULATION                            │
│                                                                 │
│  For each cost category (structure, envelope, MEP, etc.):       │
│    cost = parameterValue × applicableArea                       │
│                                                                 │
│  Applicable areas:                                              │
│    • gross_sqm: Total construction area                         │
│    • net_sqm: Total × 0.85                                      │
│    • land_sqm: Land size (or estimated from totalSqm)           │
│    • fixed: Per unit (kitchen, bathroom, pool)                  │
│    • subtotal: Percentage of construction subtotal              │
│                                                                 │
│  NOMINAL COST = Sum of all category costs + Land Cost           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│               3. INFLATION ADJUSTMENT                           │
│                                                                 │
│  Using S-Curve distribution (realistic spending pattern):       │
│                                                                 │
│  For each month m (1 to constructionMonths):                    │
│    monthlyPercent[m] = S-curve value at m                       │
│    nominalSpend[m] = totalNominalCost × monthlyPercent[m]       │
│    inflationMultiplier[m] = (1 + monthlyInflation)^(m-1)        │
│    inflatedSpend[m] = nominalSpend[m] × inflationMultiplier[m]  │
│                                                                 │
│  INFLATED COST = Land Cost + Sum(inflatedSpend)                 │
│  INFLATION IMPACT = INFLATED COST - NOMINAL COST                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                4. SALES CALCULATION                             │
│                                                                 │
│  Base Price = Location base price × Location multiplier         │
│             × Quality multiplier × (1 + Amenity premium)        │
│             × Market condition                                  │
│                                                                 │
│  CURRENT SALES = totalSqm × Base Price                          │
│                                                                 │
│  Appreciation (only after construction):                        │
│    appreciationMultiplier = (1 + monthlyAppreciation)^monthsToSell
│    PROJECTED SALES = CURRENT SALES × appreciationMultiplier     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              5. NPV ADJUSTMENT (CRITICAL)                       │
│                                                                 │
│  Total months until cash = construction + monthsToSell          │
│  Discount rate = 1.0% monthly (opportunity cost of capital)     │
│                                                                 │
│  NPV Multiplier = 1 / (1 + discountRate)^totalMonths            │
│  NPV SALES = PROJECTED SALES × NPV Multiplier                   │
│  TIME VALUE LOSS = PROJECTED SALES - NPV SALES                  │
│                                                                 │
│  ⚠️ This is why longer projects have LOWER profit!              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              6. PROFIT CALCULATION                              │
│                                                                 │
│  REALISTIC PROFIT = NPV SALES - INFLATED COST                   │
│  ROI = (REALISTIC PROFIT / INFLATED COST) × 100                 │
│  MARGIN = (REALISTIC PROFIT / NPV SALES) × 100                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mathematical Formulas

### 1. S-Curve Cost Distribution

The S-curve models realistic construction spending: slow at start (foundation), peak in middle (main construction), slow at end (finishing).

```
For month m in [1, totalMonths]:
  t = m / totalMonths
  S(t) = 1 / (1 + e^(-10 × (t - 0.5)))
  
  monthlyPercent[m] = S(m/totalMonths) - S((m-1)/totalMonths)
  
  // Normalize so sum = 100%
  monthlyPercent[m] = monthlyPercent[m] / sum(all monthlyPercents)
```

**Typical distribution for 18-month project:**
- Months 1-4: ~15% (foundation, permits)
- Months 5-12: ~65% (structure, MEP, envelope)
- Months 13-18: ~20% (interior, finishing)

### 2. Inflation Compounding

```
For month m in [1, constructionMonths]:
  nominalSpend[m] = totalNominalCost × monthlyPercent[m]
  inflationMultiplier[m] = (1 + monthlyInflationRate)^(m - 1)
  inflatedSpend[m] = nominalSpend[m] × inflationMultiplier[m]

totalInflatedCost = landCost + sum(inflatedSpend)
inflationImpact = totalInflatedCost - totalNominalCost
inflationImpactPercent = (inflationImpact / nominalConstructionCost) × 100
```

**Example (2.5% monthly, 18 months):**
- Month 1: ×1.000 (no inflation yet)
- Month 9: ×1.218 (+21.8%)
- Month 18: ×1.522 (+52.2%)
- Average impact: ~23-25%

### 3. Price Appreciation

```
// Appreciation only applies AFTER construction completes
appreciationMonths = monthsToSellAfterCompletion
appreciationMultiplier = (1 + monthlyAppreciationRate)^appreciationMonths
projectedPricePerSqm = currentPricePerSqm × appreciationMultiplier
projectedTotalSales = totalSqm × projectedPricePerSqm
```

**Example (1.5% monthly, 6 months):**
- Appreciation: (1.015)^6 = 1.0934 (+9.34%)

### 4. NPV Discount (Time Value of Money)

**Why NPV matters:**
- Money received in the future is worth LESS than money today
- Waiting 24 months means you can't invest that money elsewhere
- Without NPV: Longer wait = more appreciation = better profit ❌
- With NPV: Longer wait = more discount = worse profit ✅

```
totalMonthsUntilSale = constructionMonths + monthsToSellAfterCompletion
discountRate = 0.01  // 1% monthly = ~12.7% annual opportunity cost

npvMultiplier = 1 / (1 + discountRate)^totalMonthsUntilSale
npvAdjustedSales = projectedTotalSales × npvMultiplier
timeValueLoss = projectedTotalSales - npvAdjustedSales
```

**Example (24 months total):**
- NPV multiplier: 1 / (1.01)^24 = 0.788 (-21.2%)
- ₺100M future value = ₺78.8M present value
- Time value loss = ₺21.2M

### 5. Profit Calculation

```
// REALISTIC (Recommended)
realisticProfit = npvAdjustedSales - totalInflatedCost
realisticROI = (realisticProfit / totalInflatedCost) × 100
realisticMargin = (realisticProfit / npvAdjustedSales) × 100
```

---

## Three Profit Scenarios

### Scenario 1: Optimistic (İyimser)
**Assumes:** Efficient execution, strong market, lower inflation

| Factor | Adjustment |
|--------|------------|
| Cost Variance | -8% (under budget) |
| Sales Variance | +8% (higher prices) |
| Inflation Rate | -0.5%/month (2.0% instead of 2.5%) |
| Appreciation | +0.5%/month (2.0% instead of 1.5%) |
| Timeline | -10% (faster completion) |

### Scenario 2: Realistic (Gerçekçi) ⭐ RECOMMENDED
**Assumes:** Normal conditions, base parameters

| Factor | Adjustment |
|--------|------------|
| Cost Variance | 0% (on budget) |
| Sales Variance | 0% (market price) |
| Inflation Rate | 2.5%/month (default) |
| Appreciation | 1.5%/month (default) |
| Timeline | 0% (normal duration) |

### Scenario 3: Pessimistic (Kötümser)
**Assumes:** Delays, cost overruns, weak market

| Factor | Adjustment |
|--------|------------|
| Cost Variance | +15% (over budget) |
| Sales Variance | -8% (lower prices) |
| Inflation Rate | +1.0%/month (3.5% instead of 2.5%) |
| Appreciation | -1.0%/month (0.5% instead of 1.5%) |
| Timeline | +20% (delays) |

---

## NPV & Time Value of Money

### What is NPV?
NPV (Net Present Value) answers: "What is ₺100 million received 24 months from now worth TODAY?"

### Why We Use NPV
Without NPV, the model would incorrectly suggest that longer projects are more profitable (more time for appreciation). In reality:
1. You lose the opportunity to invest that money elsewhere
2. Inflation erodes purchasing power
3. Risk increases with longer timelines

### Our Discount Rate: 1% Monthly (~12.7% Annual)
This is LOWER than inflation (2.5%/month) because:
- Real estate provides inflation protection
- The asset appreciates while you wait
- It's a conservative estimate of opportunity cost

### Example Calculation
```
Project: 18 months construction + 6 months to sell = 24 months total
Projected Sales: ₺762,420,401

NPV Calculation:
  Discount multiplier = 1 / (1.01)^24 = 0.788
  NPV Sales = ₺762,420,401 × 0.788 = ₺600,456,483
  Time Value Loss = ₺762,420,401 - ₺600,456,483 = ₺161,963,918

Interpretation:
  "₺762M received in 24 months is equivalent to ₺600M today"
  "You 'lose' ₺162M in purchasing power by waiting"
```

---

## Default Values & Sources

### Construction Cost Parameters (by Quality Level)

All costs are from 2024-2025 Turkish construction market data.

| Category | Parameter | Luxury Default | Unit | Applied To |
|----------|-----------|----------------|------|------------|
| **Structure** | Structural Frame | 8,500 | TL/m² | gross_sqm |
| **Structure** | Foundation | 3,000 | TL/m² | land_sqm |
| **Envelope** | External Walls | 4,500 | TL/m² | gross_sqm |
| **Envelope** | Windows & Doors | 4,800 | TL/m² | gross_sqm |
| **Envelope** | Roof | 1,800 | TL/m² | land_sqm |
| **MEP** | HVAC | 4,500 | TL/m² | gross_sqm |
| **MEP** | Electrical | 3,000 | TL/m² | gross_sqm |
| **MEP** | Plumbing | 2,400 | TL/m² | gross_sqm |
| **Interior** | Flooring | 4,500 | TL/m² | net_sqm |
| **Interior** | Kitchen | 500,000 | TL | per unit |
| **Interior** | Bathroom | 250,000 | TL | per unit |
| **Interior** | Interior Doors | 1,000 | TL/m² | net_sqm |
| **Interior** | Painting | 850 | TL/m² | net_sqm |
| **Site** | Landscaping | 1,500 | TL/m² | land_sqm |
| **Site** | Pool | 1,500,000 | TL | fixed |
| **Soft** | Design & Engineering | 5% | % | subtotal |
| **Soft** | Permits & Fees | 2% | % | subtotal |
| **Financial** | Contingency | 15% | % | subtotal |
| **Financial** | Contractor OH&P | 12% | % | subtotal |

### Sales Price Parameters

| Parameter | Default | Source |
|-----------|---------|--------|
| Base Price/m² | From location | District database |
| Location Multiplier | 1.0-1.2 | Beach access, views |
| Quality Multiplier | 0.85-1.25 | Standard/Mid/Luxury |
| Amenity Premium | 5-10% | Pool, gym, security |
| Market Condition | 1.0 | Current market |

### Economic Parameters

| Parameter | Default | Annual Equivalent | Source |
|-----------|---------|-------------------|--------|
| Monthly Inflation | 2.5% | ~34% | TCMB projections |
| Monthly Appreciation | 1.5% | ~20% | RE price index |
| NPV Discount Rate | 1.0% | ~12.7% | Opportunity cost |
| Months to Sell | 6 | - | Market average |

---

## Known Limitations

### Accuracy Estimates
- **Construction Costs:** ±10-15% (industry averages, not project-specific)
- **Sales Prices:** ±15-20% (market averages, micro-location varies)
- **Timeline:** ±20% (doesn't account for delays)
- **Economic Parameters:** ±30% (projections, high uncertainty)

### Not Included
- Marketing & sales costs (2-5%)
- Property taxes during construction
- Insurance premiums
- Legal & notary fees
- Utility connection costs
- Financing/interest costs (if debt-financed)

### Assumptions
- All units sell at once at "months to sell" after completion
- No pre-sales during construction
- Single quality level (luxury) for all calculations
- Land cost paid upfront (no inflation applied)

---

## Change Log

### November 30, 2025 - Major Update
- ✅ Unified cost calculation to always use detailed parameter system
- ✅ Connected sales parameters to location intelligence
- ✅ Fixed NPV discount rate (1% monthly instead of 2.5%)
- ✅ Proper scenario recalculation with adjusted parameters
- ✅ Removed S-curve option (always use S-curve for accuracy)
- ✅ Added land size to main input form
- ✅ Improved NPV explanation in UI
- ✅ Dual-mode UI (Quick + Detailed)

---

**For Data Requirements & Update Process:** See `DATA_REQUIREMENTS.md`
