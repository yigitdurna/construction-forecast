import { describe, it, expect } from 'vitest'
import { validateProjectInputs } from '../validation'
import type { ProjectInputs } from '../../types'

describe('Input Validation', () => {
  const validInputs: ProjectInputs = {
    location: 'konyaalti-sahil',
    landSize: 1000,
    emsal: 2.5,
    projectType: 'apartment',
    qualityLevel: 'luxury',
    totalSqm: 2500,
  }

  it('should pass validation for valid inputs', () => {
    const result = validateProjectInputs(validInputs)
    expect(result.isValid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('should fail for missing location', () => {
    const invalid = { ...validInputs, location: '' }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'location')).toBe(true)
  })

  it('should fail for zero totalSqm', () => {
    const invalid = { ...validInputs, totalSqm: 0 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'totalSqm')).toBe(true)
  })

  it('should fail for negative totalSqm', () => {
    const invalid = { ...validInputs, totalSqm: -100 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'totalSqm')).toBe(true)
  })

  it('should fail for zero EMSAL', () => {
    const invalid = { ...validInputs, emsal: 0 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'emsal')).toBe(true)
  })

  it('should fail for negative EMSAL', () => {
    const invalid = { ...validInputs, emsal: -1 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'emsal')).toBe(true)
  })

  it('should fail for EMSAL constraint violation', () => {
    const invalid = {
      ...validInputs,
      landSize: 500,
      emsal: 2.0,
      totalSqm: 5000 // Exceeds landSize × emsal
    }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'totalSqm')).toBe(true)
  })

  it('should allow EMSAL constraint with 10% tolerance', () => {
    const inputs = {
      ...validInputs,
      landSize: 1000,
      emsal: 2.5,
      totalSqm: 2600 // 4% over limit (within tolerance)
    }
    const result = validateProjectInputs(inputs)
    // Should pass with tolerance
    expect(result.errors.some(e => e.field === 'totalSqm' && e.message.includes('EMSAL'))).toBe(false)
  })

  it('should fail for too high monthly inflation', () => {
    const invalid = { ...validInputs, monthlyInflationRate: 0.25 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'monthlyInflationRate')).toBe(true)
  })

  it('should fail for too low monthly inflation', () => {
    const invalid = { ...validInputs, monthlyInflationRate: -0.10 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'monthlyInflationRate')).toBe(true)
  })

  it('should fail for negative land cost', () => {
    const invalid = { ...validInputs, landCost: -1000 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'landCost')).toBe(true)
  })

  it('should fail for too short construction duration', () => {
    const invalid = { ...validInputs, constructionMonths: 2 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'constructionMonths')).toBe(true)
  })

  it('should fail for too long construction duration', () => {
    const invalid = { ...validInputs, constructionMonths: 70 }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.some(e => e.field === 'constructionMonths')).toBe(true)
  })

  it('should accumulate multiple errors', () => {
    const invalid = {
      ...validInputs,
      location: '',
      totalSqm: 0,
      emsal: -1
    }
    const result = validateProjectInputs(invalid)
    expect(result.isValid).toBe(false)
    expect(result.errors.length).toBeGreaterThanOrEqual(3)
  })
})
