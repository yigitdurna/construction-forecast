# Testing Guide

## Overview

This project uses **Vitest** as its testing framework along with React Testing Library for component testing.

## Setup

### Install Dependencies

**NOTE**: Before running tests, you need to fix npm cache permissions:

```bash
sudo chown -R 501:20 "/Users/yigit/.npm"
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event @vitest/ui jsdom
```

## Running Tests

```bash
# Run tests in watch mode
npm test

# Run tests once
npm test -- --run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

## Test Structure

```
src/
├── utils/
│   ├── __tests__/
│   │   ├── calculations.test.ts    # Unit tests for calculation functions
│   │   └── validation.test.ts      # Tests for input validation
│   ├── calculations.ts
│   └── validation.ts
└── test/
    └── setup.ts                     # Test configuration
```

## Test Coverage

Current test files cover:

### 1. Calculation Functions (`calculations.test.ts`)

**S-Curve Distribution:**
- ✅ Sums to 1.0
- ✅ Peak spending in middle months
- ✅ Error handling for invalid inputs

**Construction Duration:**
- ✅ Villa size thresholds (small/large)
- ✅ Apartment size thresholds (small/medium/large)

**Project Cost Calculations:**
- ✅ Valid input handling
- ✅ Inflated costs > nominal costs
- ✅ NPV-adjusted sales < projected sales
- ✅ Division by zero prevention
- ✅ EMSAL constraint validation
- ✅ Custom parameter handling
- ✅ NaN/Infinity prevention

**Formatting Functions:**
- ✅ Currency formatting (Turkish Lira)
- ✅ Percentage formatting
- ✅ Negative number handling

### 2. Validation Functions (`validation.test.ts`)

**Required Field Validation:**
- ✅ Location validation
- ✅ Total sqm validation
- ✅ EMSAL validation

**Range Validation:**
- ✅ Inflation rate limits (-5% to 20%)
- ✅ Appreciation rate limits
- ✅ Construction duration limits (3-60 months)
- ✅ EMSAL constraint with tolerance

**Error Accumulation:**
- ✅ Multiple errors collected
- ✅ Turkish error messages

## Writing New Tests

### Unit Test Example

```typescript
import { describe, it, expect } from 'vitest'
import { yourFunction } from '../yourModule'

describe('Your Function', () => {
  it('should do something specific', () => {
    const result = yourFunction(input)
    expect(result).toBe(expectedValue)
  })

  it('should handle edge case', () => {
    expect(() => yourFunction(invalidInput)).toThrow()
  })
})
```

### Component Test Example

```typescript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { YourComponent } from './YourComponent'

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />)
    expect(screen.getByText('Expected Text')).toBeInTheDocument()
  })
})
```

## Best Practices

1. **Test Behavior, Not Implementation**
   - Focus on what the function does, not how it does it
   - Test public APIs, not internal details

2. **Use Descriptive Test Names**
   ```typescript
   ✅ it('should throw error for zero totalSqm', ...)
   ❌ it('test1', ...)
   ```

3. **Test Edge Cases**
   - Zero values
   - Negative values
   - Very large values
   - Invalid types
   - Missing required fields

4. **Keep Tests Isolated**
   - Each test should be independent
   - Use beforeEach/afterEach for setup/cleanup
   - Don't rely on test execution order

5. **Use Appropriate Matchers**
   ```typescript
   expect(value).toBeCloseTo(1.0, 10)  // For floating point
   expect(value).toBeGreaterThan(0)     // For comparisons
   expect(fn).toThrow()                  // For error handling
   ```

## Coverage Goals

- **Target**: 80%+ coverage for critical paths
- **Critical**: All calculation functions (100%)
- **Important**: Validation functions (100%)
- **Nice-to-have**: UI components (60%+)

## Continuous Integration

When setting up CI/CD, add:

```yaml
# .github/workflows/test.yml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test -- --run
      - run: npm run test:coverage
```

## Common Issues

### Module Not Found Errors

If you see errors like `Cannot find module 'vitest'`:
1. Ensure dependencies are installed
2. Check `tsconfig.json` excludes test files from build
3. Verify `vitest.config.ts` is properly configured

### Path Alias Issues

If imports fail with `@/` prefix:
- Check `vite.config.ts` has alias configured
- Verify `tsconfig.json` paths match

## Future Enhancements

- [ ] Add E2E tests with Playwright
- [ ] Add visual regression testing
- [ ] Add performance benchmarks
- [ ] Increase component test coverage
- [ ] Add integration tests for full workflows
