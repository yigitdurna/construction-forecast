# Construction Cost & Sales Forecast Tool

A sophisticated web application for construction companies in Antalya, Turkey to estimate construction costs, sales revenue, and profitability for development projects with advanced financial modeling.

## Live Demo

🚀 **[View Live Application](https://yigidurna.github.io/construction-forecast/)**

## Features

### Phase 1.5 - Advanced Financial Modeling ⭐

#### NPV-Adjusted Profitability Analysis
- **Time Value of Money**: Future cash flows discounted to present value using 1% monthly discount rate (~12.7% annual)
- **Accurate Timeline Impact**: Accounts for the opportunity cost of capital over construction + sales period
- **Realistic Profit Projections**: Why longer projects have lower returns despite appreciation

#### Three-Scenario Analysis
- **İyimser (Optimistic)**: -8% costs, +8% sales, faster timeline, lower inflation
- **Gerçekçi (Realistic)**: Base case with market averages (recommended)
- **Kötümser (Pessimistic)**: +15% costs, -8% sales, delays, higher inflation

#### Advanced Timeline Modeling
- **S-Curve Cost Distribution**: Realistic spending patterns (slow start → peak middle → slow end)
- **Compound Inflation**: Monthly inflation applied to construction costs over time (default 2.5%/month)
- **Price Appreciation**: Real estate value growth after construction (default 1.5%/month)
- **NPV Discounting**: Future sales adjusted for time value of money

#### Parameter Transparency System
- **Detailed Cost Parameters**: 15+ construction cost categories (structure, envelope, MEP, interior, site, soft costs, financial)
- **Live Parameter Editing**: Adjust any assumption and see instant recalculation
- **Quality Level Selection**: Standard, mid-range, and luxury tiers
- **Location Intelligence**: Market data from 15 Antalya districts

#### Dual-Mode Interface
- **Quick Mode**: Essential summary always visible (profit, ROI, margin, timeline)
- **Detailed Mode**: Expandable sections with comprehensive breakdowns
- **Cost Breakdown**: By category with inflation impact
- **Sales Projection**: Current value vs. NPV-adjusted value with explanations
- **Timeline Analysis**: Monthly cash flow and cost distribution

### Phase 1 - Core Features

- Single project cost estimation
- User inputs: location, land size, EMSAL, project type, quality level, total sqm
- Detailed cost breakdown (construction, land, permits, design, contingency)
- Sales projections based on project type and quality
- Profitability analysis (gross profit, profit margin, ROI)
- Turkish language interface

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:5173`

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Deploy to GitHub Pages:**
   ```bash
   npm run deploy
   ```

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 6.0.5
- **Styling**: Tailwind CSS 3.4
- **Deployment**: GitHub Pages
- **No Backend**: Static reference data, client-side calculations

## Project Structure

```
construction-forecast/
├── src/
│   ├── components/          # UI components
│   │   ├── ProjectForm.tsx  # Input form with unified parameters
│   │   └── ResultsView.tsx  # Dual-mode results display
│   ├── data/                # Market reference data
│   │   ├── locations.ts     # 15 Antalya districts pricing
│   │   ├── costParameters.ts # Construction cost defaults
│   │   └── salesParameters.ts # Sales pricing factors
│   ├── lib/                 # Business logic
│   │   └── scenarios.ts     # Three-scenario calculations
│   ├── types/               # TypeScript definitions
│   ├── utils/               # Core calculation engine
│   │   └── calculations.ts  # NPV, inflation, S-curve
│   └── App.tsx              # Main application + state
├── CALCULATION_GUIDE.md     # Complete formula documentation
├── DATA_REQUIREMENTS.md     # Market data update guide
└── CLAUDE.md                # AI assistant context
```

## Key Calculations

### NPV (Net Present Value)
```typescript
// Why NPV matters: Money today > Money tomorrow
totalMonths = constructionMonths + monthsToSell
discountRate = 0.01 // 1% monthly
npvMultiplier = 1 / (1.01)^totalMonths
npvSales = futureSales × npvMultiplier
```

### Inflation Impact
```typescript
// S-curve distribution + compound inflation
for each month m:
  spendPercent = S-curve(m)
  inflationMultiplier = (1.025)^(m-1)
  inflatedCost += nominalCost × spendPercent × inflationMultiplier
```

### Price Appreciation
```typescript
// Growth only after construction completes
appreciationMonths = monthsToSellAfterCompletion
futurePrice = currentPrice × (1.015)^appreciationMonths
```

### Profit Calculation
```typescript
// Realistic (recommended)
profit = npvAdjustedSales - inflatedCosts
roi = (profit / inflatedCosts) × 100
margin = (profit / npvAdjustedSales) × 100
```

## Reference Data

All cost and price data in `src/data/` are **market averages** for the Antalya region (November 2025). Key sources:

- **Construction Costs**: Turkish construction industry 2024-2025 data
- **Sales Prices**: Real estate listings from 15 Antalya districts
- **Economic Rates**: TCMB projections + RE price index
- **Timeline Estimates**: Industry standard duration by project size/type

### Accuracy Estimates
- Construction Costs: ±10-15%
- Sales Prices: ±15-20%
- Timeline: ±20%
- Economic Parameters: ±30%

## Development Commands

```bash
npm run dev       # Start dev server (http://localhost:5173)
npm run build     # Build for production (outputs to dist/)
npm run lint      # Run ESLint
npm run preview   # Preview production build locally
npm run deploy    # Deploy to GitHub Pages
```

## Documentation

- **[CALCULATION_GUIDE.md](./CALCULATION_GUIDE.md)**: Complete mathematical formulas, NPV explanation, scenario definitions
- **[DATA_REQUIREMENTS.md](./DATA_REQUIREMENTS.md)**: Market data collection guide, update schedules, validation rules
- **[CLAUDE.md](./CLAUDE.md)**: Project overview for AI assistants, implementation details

## Known Limitations

### Not Included
- Marketing & sales costs (2-5%)
- Property taxes during construction
- Insurance premiums
- Legal & notary fees
- Utility connection costs
- Financing/interest costs (assumes cash purchase)

### Assumptions
- All units sell at once at "months to sell" after completion
- No pre-sales during construction
- Single quality level per project
- Land cost paid upfront (no inflation applied)

## Important Notes

- This tool provides **preliminary estimates only**
- All prices are in Turkish Lira (TRY)
- Reference data should be updated regularly (see DATA_REQUIREMENTS.md)
- Professional consultation recommended for actual projects
- Results are most accurate for projects in the Antalya region

## Future Phases

### Phase 2 - Multi-Project Portfolio (Planned)
- Compare multiple projects side-by-side
- Portfolio optimization
- Resource allocation planning

### Phase 3 - Market Intelligence (Planned)
- Real-time market data integration
- Trend analysis and forecasting
- Competitive benchmarking

## License

Private - For internal use only

## Support

For questions, issues, or feature requests, please contact the development team.

---

**Version**: Phase 1.5 - Advanced Financial Modeling
**Last Updated**: November 30, 2025
**Built with**: React + TypeScript + Vite + Tailwind CSS
