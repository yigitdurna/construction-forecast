import { describe, it, expect } from 'vitest'
import {
  generateSCurveDistribution,
  getDefaultConstructionDuration,
  calculateProjectCosts,
  formatCurrency,
  formatPercentage,
} from '../calculations'
import type { ProjectInputs } from '../../types'

describe('S-Curve Distribution', () => {
  it('should generate distribution that sums to 1.0', () => {
    const distribution = generateSCurveDistribution(18)
    const sum = distribution.reduce((a, b) => a + b, 0)
    expect(sum).toBeCloseTo(1.0, 10)
  })

  it('should have peak spending in middle months', () => {
    const distribution = generateSCurveDistribution(18)
    const firstThird = distribution.slice(0, 6).reduce((a, b) => a + b)
    const middleThird = distribution.slice(6, 12).reduce((a, b) => a + b)
    const lastThird = distribution.slice(12).reduce((a, b) => a + b)

    expect(middleThird).toBeGreaterThan(firstThird)
    expect(middleThird).toBeGreaterThan(lastThird)
  })

  it('should throw error for zero months', () => {
    expect(() => generateSCurveDistribution(0)).toThrow()
  })

  it('should throw error for negative months', () => {
    expect(() => generateSCurveDistribution(-5)).toThrow()
  })

  it('should handle edge case of 1 month', () => {
    const distribution = generateSCurveDistribution(1)
    expect(distribution).toHaveLength(1)
    expect(distribution[0]).toBeCloseTo(1.0, 5)
  })
})

describe('Default Construction Duration', () => {
  it('should return 10 months for small villa', () => {
    expect(getDefaultConstructionDuration('villa', 400)).toBe(10)
  })

  it('should return 14 months for large villa', () => {
    expect(getDefaultConstructionDuration('villa', 600)).toBe(14)
  })

  it('should return 14 months for small apartment', () => {
    expect(getDefaultConstructionDuration('apartment', 2500)).toBe(14)
  })

  it('should return 18 months for medium apartment', () => {
    expect(getDefaultConstructionDuration('apartment', 5000)).toBe(18)
  })

  it('should return 24 months for large apartment', () => {
    expect(getDefaultConstructionDuration('apartment', 10000)).toBe(24)
  })
})

describe('Project Cost Calculations', () => {
  const validInputs: ProjectInputs = {
    location: 'konyaalti-sahil',
    landSize: 1000,
    emsal: 2.5,
    projectType: 'apartment',
    qualityLevel: 'luxury',
    totalSqm: 2500,
  }

  it('should calculate costs successfully with valid inputs', () => {
    const results = calculateProjectCosts(validInputs)

    expect(results).toBeDefined()
    expect(results.costs.totalInflatedCost).toBeGreaterThan(0)
    expect(results.costs.totalNominalCost).toBeGreaterThan(0)
    expect(results.sales.npvAdjustedSales).toBeGreaterThan(0)
  })

  it('should have inflated costs greater than nominal costs', () => {
    const results = calculateProjectCosts(validInputs)

    expect(results.costs.totalInflatedCost).toBeGreaterThan(results.costs.totalNominalCost)
  })

  it('should have NPV-adjusted sales less than projected sales', () => {
    const results = calculateProjectCosts(validInputs)

    expect(results.sales.npvAdjustedSales).toBeLessThan(results.sales.projectedTotalSales)
  })

  it('should throw error for zero totalSqm', () => {
    const invalidInputs = { ...validInputs, totalSqm: 0 }
    expect(() => calculateProjectCosts(invalidInputs)).toThrow()
  })

  it('should throw error for negative totalSqm', () => {
    const invalidInputs = { ...validInputs, totalSqm: -100 }
    expect(() => calculateProjectCosts(invalidInputs)).toThrow()
  })

  it('should throw error for missing location', () => {
    const invalidInputs = { ...validInputs, location: '' }
    expect(() => calculateProjectCosts(invalidInputs)).toThrow()
  })

  it('should throw error for EMSAL constraint violation', () => {
    const invalidInputs = {
      ...validInputs,
      landSize: 500,
      emsal: 2.0,
      totalSqm: 5000 // Exceeds 500 × 2.0 = 1000
    }
    expect(() => calculateProjectCosts(invalidInputs)).toThrow()
  })

  it('should handle zero discount rate (NPV equals projected)', () => {
    const inputsZeroDiscount = {
      ...validInputs,
      monthlyDiscountRate: 0
    }
    const results = calculateProjectCosts(inputsZeroDiscount)

    expect(results.sales.npvAdjustedSales).toBeCloseTo(
      results.sales.projectedTotalSales,
      2
    )
  })

  it('should produce valid numbers (no NaN or Infinity)', () => {
    const results = calculateProjectCosts(validInputs)

    expect(isFinite(results.costs.totalInflatedCost)).toBe(true)
    expect(isFinite(results.sales.npvAdjustedSales)).toBe(true)
    expect(isFinite(results.profit.projectedROI)).toBe(true)
    expect(isFinite(results.profit.projectedMargin)).toBe(true)
  })

  it('should respect custom construction months', () => {
    const customInputs = {
      ...validInputs,
      constructionMonths: 12
    }
    const results = calculateProjectCosts(customInputs)

    expect(results.timeline.constructionMonths).toBe(12)
  })

  it('should apply custom inflation rate', () => {
    const highInflation = {
      ...validInputs,
      monthlyInflationRate: 0.05 // 5% monthly
    }
    const normalInflation = {
      ...validInputs,
      monthlyInflationRate: 0.025 // 2.5% monthly
    }

    const highResults = calculateProjectCosts(highInflation)
    const normalResults = calculateProjectCosts(normalInflation)

    expect(highResults.costs.totalInflatedCost).toBeGreaterThan(
      normalResults.costs.totalInflatedCost
    )
  })
})

describe('Formatting Functions', () => {
  it('should format currency correctly', () => {
    expect(formatCurrency(1000000)).toBe('₺1.000.000')
    expect(formatCurrency(1500.5)).toBe('₺1.501')
    expect(formatCurrency(0)).toBe('₺0')
  })

  it('should format percentage correctly', () => {
    expect(formatPercentage(15)).toBe('%15,0')
    expect(formatPercentage(12.34)).toBe('%12,3')
    expect(formatPercentage(100)).toBe('%100,0')
  })

  it('should handle negative percentages', () => {
    expect(formatPercentage(-5)).toBe('-%5,0')
  })
})
