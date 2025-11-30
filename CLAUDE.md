# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A web tool for construction companies in Antalya, Turkey to estimate:
1. Construction cost for a project on their land
2. Potential sales revenue
3. Basic profitability (profit margin, ROI)

Target user: Land owners or evaluators who need to answer "What will it cost to build, and what can I sell it for?"

## Current Phase: 1.5 - Timeline & Parameter Transparency

**Phase 1.5 ENHANCEMENTS:**
- ✅ Construction timeline modeling with inflation
- ✅ S-curve cost distribution (realistic cash flow)
- ✅ Future sales price projections with appreciation
- ✅ Multi-scenario profit analysis (Nominal, Projected, Pessimistic)
- ✅ Parameter transparency system
- ✅ Advanced settings panel in form

**Phase 1 CORE FEATURES:**
- Single project estimate (one project type at a time)
- User inputs: location, land size, EMSAL, project type, quality level, total sqm
- Timeline inputs: construction duration, inflation rate, appreciation rate, cost distribution
- Outputs: cost breakdown with inflation, sales projection with appreciation, multi-scenario profit analysis
- Web interface (form → results page)
- Static reference data (clearly labeled as defaults)

**OUT OF SCOPE (Phase 2+):**
- Scenario comparison UI (apartments vs villas side-by-side)
- PDF export
- User accounts
- Real-time data APIs
- Monthly cost breakdown visualization
- Parameter editing UI component

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **No Backend**: Phase 1 uses static reference data only

## Development Setup

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```
Server will start at `http://localhost:5173`

### Build for Production
```bash
npm run build
```
Output will be in `dist/` directory

### Lint Code
```bash
npm run lint
```

### Preview Production Build
```bash
npm run preview
```

## Project Structure

```
src/
├── components/                 # React components
│   ├── ProjectForm.tsx         # Input form with basic + advanced settings
│   └── ResultsView.tsx         # Results with timeline, scenarios, inflation impact
├── data/                       # Static reference data and defaults
│   ├── referenceData.ts        # Construction costs, sales prices, multipliers
│   └── parameterDefaults.ts    # Parameter transparency system generator
├── types/                      # TypeScript type definitions
│   └── index.ts                # All types: inputs, timeline, costs, sales, profit, parameters
├── utils/                      # Utility functions
│   └── calculations.ts         # Timeline, S-curve, inflation, appreciation, profit scenarios
├── App.tsx                     # Main app component with state management
├── main.tsx                    # React entry point
└── index.css                   # Global styles with Tailwind imports
```

## Architecture

### Data Flow
1. User fills out `ProjectForm` with project parameters
2. Form submission triggers `calculateProjectCosts()` in `calculations.ts`
3. Calculation function:
   - Fetches reference data from `referenceData.ts`
   - Calculates costs (construction, land, permits, design, contingency)
   - Calculates sales projections (price per m², total revenue, unit count)
   - Calculates profit metrics (gross profit, margin, ROI)
4. Results are passed to `ResultsView` component for display

### Key Calculation Logic

**Timeline Calculation** (`src/utils/calculations.ts:calculateTimeline`):
- Default construction duration based on project type and size
- Completion date = start date + construction months
- Sale date = completion date + months to sell after completion

**S-Curve Distribution** (`src/utils/calculations.ts:generateSCurveDistribution`):
- Models realistic construction cash flow using logistic curve
- Early months: ~15% of costs (foundation, initial structure)
- Middle months: ~55% of costs (main structure, MEP)
- Final months: ~30% of costs (finishes, completion)
- Alternative: Linear distribution for simple modeling

**Inflation-Adjusted Costs** (`src/utils/calculations.ts:calculateInflationAdjustedCosts`):
- Applies compound monthly inflation to construction costs over time
- Land cost paid upfront (no inflation)
- Construction-related costs inflated month by month based on S-curve
- Formula: inflated = nominal × (1 + monthlyRate)^(month - 1)
- Returns both nominal (today's prices) and inflated (real) costs

**Future Sales Price** (`src/utils/calculations.ts:calculateFutureSalesPrice`):
- Projects sales prices forward to completion + selling period
- Formula: projected = current × (1 + monthlyRate)^totalMonths
- totalMonths = construction duration + months to sell
- Returns both current and projected prices with appreciation impact

**Cost Calculation** (`src/utils/calculations.ts:calculateCosts`):
- Construction cost = cost per m² × total sqm (nominal)
- Land cost = land price per m² × land size (paid upfront)
- Permits & fees = construction cost × 8%
- Design = construction cost × 5%
- Contingency = subtotal × 10%
- Applies inflation to all construction-related costs
- Returns both nominal and inflated totals

**Sales Calculation** (`src/utils/calculations.ts:calculateSales`):
- Uses sales prices from `referenceData.ts` based on project type + quality
- Estimates unit count using average unit sizes
- Projects future sales prices with appreciation
- Returns both current and projected sales values

**Profit Calculation** (`src/utils/calculations.ts:calculateProfit`):
- **Scenario 1 - Nominal**: current sales - nominal costs (no time value)
- **Scenario 2 - Projected (Realistic)**: projected sales - inflated costs (accounts for both inflation and appreciation)
- **Scenario 3 - Pessimistic**: current sales - inflated costs (inflation hurts, no price appreciation)
- Each scenario calculates: profit, margin %, ROI %

### Reference Data (`src/data/referenceData.ts`)

All prices are in Turkish Lira (TRY) and should be updated with real market data:
- Construction costs per m² by quality level (standard: 8K, mid: 12K, luxury: 18K)
- Sales prices per m² by project type and quality level
- Land prices per m² by location (defaults to 5K TRY/m², with district-specific values)
- Cost multipliers: permits (8%), design (5%), contingency (10%)
- Average unit sizes: apartment (120m²), villa (200m²), mixed (140m²)

### Parameter Transparency System (`src/data/parameterDefaults.ts`)

The `getDefaultParameters()` function generates a comprehensive parameter structure:

**Parameter Groups:**
1. **Location & Land**: land price, EMSAL, buildable area, actual construction area
2. **Construction Costs**: base cost/m², quality multiplier, permits %, design %, contingency %
3. **Timeline & Inflation**: duration, start date, monthly inflation, cost distribution model
4. **Sales & Market**: current price/m², monthly appreciation, estimated units
5. **Financial Summary**: calculated totals

**Parameter Metadata:**
- `value`: Current parameter value
- `source`: Where it comes from (user_input, default, calculated, district_data)
- `editable`: Whether user can modify it
- `description`: Explanation of what it means
- `min/max/step`: Validation constraints

This system enables:
- Full visibility into calculation assumptions
- Future parameter editing UI
- Audit trail of where values originate
- User override of defaults

## Key Domain Concepts

- **EMSAL**: Floor Area Ratio - the ratio of total building floor area to the land area
- **Project Types**: Apartments, villas, mixed-use developments
- **Quality Levels**: Different construction quality standards affecting cost and sales price
- **Antalya Market**: Local construction costs and sales prices specific to the region
- **S-Curve**: Realistic construction cash flow pattern (slow-fast-slow spending)
- **Inflation Impact**: Time value of money - costs increase over construction period
- **Price Appreciation**: Real estate value growth from start to sale completion
- **Scenarios**: Different economic assumptions (optimistic, realistic, pessimistic)

## Phase 1.5 Default Values

**Timeline Defaults:**
- Construction duration: 10-24 months (calculated based on project type and size)
  - Villa < 500m²: 10 months
  - Villa ≥ 500m²: 14 months
  - Apartment < 3000m²: 14 months
  - Apartment 3000-8000m²: 18 months
  - Apartment > 8000m²: 24 months
- Monthly inflation rate: 2.5% (~34% annual, adjustable)
- Monthly appreciation rate: 1.5% (~20% annual, adjustable)
- Months to sell after completion: 6 months (adjustable)
- Cost distribution: S-curve (realistic) or Linear (simple)

**Economic Assumptions:**
- Inflation applies to: construction, permits, design, contingency (NOT land)
- Appreciation applies to: all sales revenue
- Scenarios calculated:
  1. **Nominal**: No inflation, no appreciation (baseline)
  2. **Projected (Realistic)**: With inflation AND appreciation
  3. **Pessimistic**: With inflation, NO appreciation

**UI Features:**
- Advanced settings panel: Collapsible section for timeline parameters
- Results display: Timeline summary, inflation impact, multi-scenario comparison
- Visual indicators: Color-coded profit scenarios (green=realistic, orange=pessimistic)
