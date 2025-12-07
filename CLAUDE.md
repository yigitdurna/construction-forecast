# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Turkish construction feasibility analysis web application for Antalya region. Estimates construction costs, sales revenue with NPV, and profitability scenarios.

**Live**: https://yigitdurna.github.io/construction-forecast/

## Tech Stack

- **Frontend**: React 18 + TypeScript (strict mode)
- **Build**: Vite 6.x
- **Styling**: Tailwind CSS 3.4
- **Testing**: Vitest + React Testing Library
- **Deployment**: GitHub Pages (gh-pages package)

## Quick Commands

```bash
npm run dev          # Development server (http://localhost:5173)
npm run build        # Production build
npm test -- --run    # Run tests
npm run deploy       # Deploy to GitHub Pages
```

## Project Structure

```
src/
├── components/phase2/     # Wizard UI components
│   ├── FeasibilityWizard.tsx    # Main 4-step orchestrator
│   ├── ParselLookupWithImar.tsx # Step 1: Parsel + İmar
│   ├── UnitMixEditorDynamic.tsx # Step 2: Unit distribution
│   ├── CostPricingStep.tsx      # Step 3: Costs + pricing
│   ├── CostBreakdownEditor.tsx  # Detailed cost categories
│   └── FinancialSummary.tsx     # Step 4: NPV + scenarios
├── context/FeasibilityContext.tsx  # Wizard state management
├── data/
│   └── costDatabase.ts          # Master cost database (ÖZGÜNTUR)
├── hooks/useProjectStorage.ts   # LocalStorage persistence
├── pages/
│   ├── FeasibilityPage.tsx      # Wizard wrapper
│   └── ProjectListPage.tsx      # Project list/management
├── services/
│   ├── zoningCalculator.ts      # TAKS/KAKS calculations
│   └── pdfExport.ts             # PDF report generation
├── types/
│   ├── feasibility.ts           # Wizard types
│   ├── project.ts               # Project model
│   └── zoning.ts                # Zoning/TKGM types
└── utils/
    ├── calculations.ts          # NPV, inflation, S-curve
    ├── imarCalculations.ts      # İmar formula calculations
    └── projectConverter.ts      # State ↔ Project conversion
```

## Key Domain Concepts

### Turkish Zoning Terms
- **TAKS**: Taban Alanı Kat Sayısı - Building coverage ratio (ground floor % of land)
- **KAKS**: Kat Alanı Kat Sayısı - Floor area ratio (total floors / land area)
- **EMSAL**: Same as KAKS
- **Çıkma Katsayısı**: Projection coefficient (balconies, bay windows) - typically 1.60-1.70
- **Ada/Parsel**: Block/Parcel numbers in Turkish cadastral system

### Key Formulas
```
Taban Alanı = Parsel × TAKS
Toplam İnşaat = Parsel × KAKS × Çıkma Katsayısı
Kat Adedi = KAKS / TAKS
Net Kullanım = Toplam İnşaat × 0.77 (NET/BRÜT ratio)
```

### Unit Types (Turkish apartment notation)
| Type | Description | Net Area | Mix Ratio |
|------|-------------|----------|-----------|
| 1+0 | Studio | ~40 m² | 15% |
| 1+1 | 1 bed + living | ~50 m² | 35% ← Most popular |
| 2+1 | 2 bed + living | ~80 m² | 25% |
| 3+1 | 3 bed + living | ~115 m² | 10% |
| 4+1 | 4 bed + living | ~160 m² | 10% |
| 5+1 | 5 bed + living | ~220 m² | 5% |

**Note**: Mix ratios optimized for Antalya investment market (2024-2025). 50% small units (1+0 + 1+1) for rental/investment demand.

## Cost Database (ÖZGÜNTUR Standard)

Single quality level based on real project data (ÖZGÜNTUR RELIFE UNIQUE, Konyaaltı).

**Key Parameters**:
- NET/BRÜT Ratio: **0.77** (76.9%) - corrected from industry assumption of 85%
- Construction Cost: **~27,500 TL/m² GROSS** (applied to total building area)
- Bathroom Count: 2 per 3+1 unit

**Default Sale Prices (TL/m² NET)**:
| Unit Type | Price/m² | Notes |
|-----------|----------|-------|
| 1+0 | 45,000 | Highest - Airbnb/rental investment |
| 1+1 | 42,000 | **Most popular** - investors + young families |
| 2+1 | 40,000 | Small families, good demand |
| 3+1 | 38,000 | Families, moderate demand |
| 4+1 | 36,000 | Large families, luxury segment |
| 5+1 | 34,000 | Very high-end only |

**Market Insight**: 1+1 units are the most popular in Antalya (2024-2025) due to investor demand for rental/Airbnb properties. Smaller units (1+0, 1+1) command higher per-m² prices.

**Source**: `src/data/costDatabase.ts` - all costs with sources and confidence levels.

## Wizard Flow

1. **Parsel & İmar** - Enter land data (Ada/Parsel + TAKS/KAKS/Çıkma)
2. **Daire Karışımı** - Configure unit mix (types, counts, areas)
3. **Maliyet & Fiyat** - Set construction costs and sale prices
4. **Finansal Analiz** - View NPV, scenarios, export PDF

## Financial Calculations

**NPV**: 1% monthly discount rate (~12.7% annual)
- Accounts for time value of money over construction period

**Scenarios**:
- Optimistic: -8% cost, +8% revenue
- Base: User parameters
- Pessimistic: +15% cost, -8% revenue

## Important Implementation Notes

- All costs applied to **GROSS** area (total construction)
- Sale prices applied to **NET** area (sellable)
- Single quality tier (no economy/mid/luxury selection)
- LocalStorage persistence with auto-save
- All 70 tests passing (run with `npm test -- --run`)

## Municipality Integration Status

**⚠️ NOT VIABLE** - Both municipality systems require JavaScript session-based authentication.

### Kepez (KEOS System)
- URL: `https://keos.kepez-bld.gov.tr/imardurumu/`
- Status: Main page loads, all API endpoints return 404
- System: NetCAD/KEOS with session protection
- Tested endpoints: `imarsvc.aspx`, `imar.aspx` - all fail without JS session

### Antalya Büyükşehir (KBS System)
- URL: `https://kbs.antalya.bel.tr/imardurumu/`
- Status: Main page loads with form, APIs return 401 (unauthorized)
- System: NetGIS Server 7.2 (workspace: PYSVATANDAS)
- Requires authentication - cannot integrate via HTTP

**Conclusion**: Manual İmar entry is the only viable method. Serverless proxies cannot bypass JavaScript session requirements.

**Existing Code**: `api/municipalities/kepez.ts` contains proxy implementation (non-functional due to session requirements).

## Routes

- `/` → Project List (home)
- `/feasibility` → Wizard (new project)
- `/feasibility?projectId=xxx` → Wizard (edit existing)

## Deployment

```bash
npm run deploy  # Builds and deploys to gh-pages branch
```

Base URL configured in `vite.config.ts` as `/construction-forecast/`.

---

## Additional Documentation

Detailed research and analysis in `docs/` folder:
- `REAL_PROJECT_ANALYSIS.md` - ÖZGÜNTUR RELIFE UNIQUE material analysis
- `COMPLETE_VARIABLES.md` - Master variable list with formulas
- `FEASIBILITY_CALCULATION_PLAN.md` - Detailed calculation methodology
- `CALCULATION_GUIDE.md` - NPV, inflation, S-curve formulas
- `DATA_REQUIREMENTS.md` - Market data sources

**Implementation Plan**: `IMPLEMENTATION_PLAN.md` (root) - pending approval for next phase

---

**Last Updated**: December 7, 2025
**Status**: Production-ready | 70/70 tests passing | ~685 KB bundle

## Key Findings from Real Project Review (December 2025)

1. **NET/BRÜT Ratio**: 0.77 (76.9%) - corrected from industry assumption of 85%
2. **Single Quality Level**: ÖZGÜNTUR standard replaces economy/mid/luxury tiers
3. **Bathroom Count**: 2 per unit for 3+1 apartments (verified from material lists)
4. **Municipality APIs**: NOT viable - require JavaScript session authentication
5. **1+1 Units**: Most popular in Antalya market (investor demand)
6. **Cost Basis**: ~27,500 TL/m² GROSS from real project data
