import { ProjectInputs } from '../types'
import { getLocationData } from '../data/antalyaLocations'

export interface ValidationError {
  field: string
  message: string
  messageTR: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}

/**
 * Validates project inputs before calculations
 * Prevents division by zero, NaN propagation, and other edge cases
 */
export function validateProjectInputs(inputs: ProjectInputs): ValidationResult {
  const errors: ValidationError[] = []

  // Location validation
  if (!inputs.location || inputs.location.trim() === '') {
    errors.push({
      field: 'location',
      message: 'Location is required',
      messageTR: 'Lokasyon seçilmesi zorunludur',
    })
  } else {
    const locationData = getLocationData(inputs.location)
    if (!locationData) {
      errors.push({
        field: 'location',
        message: `Location '${inputs.location}' not found in database`,
        messageTR: `'${inputs.location}' lokasyonu veritabanında bulunamadı`,
      })
    }
  }

  // Total sqm validation (critical - used in division)
  if (!inputs.totalSqm || inputs.totalSqm <= 0) {
    errors.push({
      field: 'totalSqm',
      message: 'Total construction area must be greater than 0',
      messageTR: 'Toplam inşaat alanı 0\'dan büyük olmalıdır',
    })
  } else if (!isFinite(inputs.totalSqm)) {
    errors.push({
      field: 'totalSqm',
      message: 'Total construction area must be a valid number',
      messageTR: 'Toplam inşaat alanı geçerli bir sayı olmalıdır',
    })
  } else if (inputs.totalSqm > 1000000) {
    errors.push({
      field: 'totalSqm',
      message: 'Total construction area seems unrealistically large (>1,000,000 m²)',
      messageTR: 'Toplam inşaat alanı gerçekçi değil (>1,000,000 m²)',
    })
  }

  // EMSAL validation
  if (!inputs.emsal || inputs.emsal <= 0) {
    errors.push({
      field: 'emsal',
      message: 'EMSAL must be greater than 0',
      messageTR: 'EMSAL 0\'dan büyük olmalıdır',
    })
  } else if (!isFinite(inputs.emsal)) {
    errors.push({
      field: 'emsal',
      message: 'EMSAL must be a valid number',
      messageTR: 'EMSAL geçerli bir sayı olmalıdır',
    })
  } else if (inputs.emsal > 10) {
    errors.push({
      field: 'emsal',
      message: 'EMSAL seems unrealistically high (>10)',
      messageTR: 'EMSAL çok yüksek görünüyor (>10)',
    })
  }

  // Land size validation (optional but if provided must be valid)
  if (inputs.landSize !== undefined && inputs.landSize !== 0) {
    if (inputs.landSize < 0) {
      errors.push({
        field: 'landSize',
        message: 'Land size cannot be negative',
        messageTR: 'Arsa büyüklüğü negatif olamaz',
      })
    } else if (!isFinite(inputs.landSize)) {
      errors.push({
        field: 'landSize',
        message: 'Land size must be a valid number',
        messageTR: 'Arsa büyüklüğü geçerli bir sayı olmalıdır',
      })
    } else if (inputs.landSize > 0 && inputs.emsal > 0) {
      // Validate EMSAL constraint: totalSqm should not exceed landSize × emsal
      const maxAllowedSqm = inputs.landSize * inputs.emsal
      if (inputs.totalSqm > maxAllowedSqm * 1.1) { // 10% tolerance for rounding
        errors.push({
          field: 'totalSqm',
          message: `Total area (${inputs.totalSqm} m²) exceeds maximum allowed by EMSAL (${Math.round(maxAllowedSqm)} m² = ${inputs.landSize} × ${inputs.emsal})`,
          messageTR: `Toplam alan (${inputs.totalSqm} m²) EMSAL ile izin verilen maksimum alanı aşıyor (${Math.round(maxAllowedSqm)} m² = ${inputs.landSize} × ${inputs.emsal})`,
        })
      }
    }
  }

  // Construction months validation (optional but must be reasonable)
  if (inputs.constructionMonths !== undefined) {
    if (inputs.constructionMonths <= 0) {
      errors.push({
        field: 'constructionMonths',
        message: 'Construction duration must be greater than 0',
        messageTR: 'İnşaat süresi 0\'dan büyük olmalıdır',
      })
    } else if (!isFinite(inputs.constructionMonths)) {
      errors.push({
        field: 'constructionMonths',
        message: 'Construction duration must be a valid number',
        messageTR: 'İnşaat süresi geçerli bir sayı olmalıdır',
      })
    } else if (inputs.constructionMonths < 3) {
      errors.push({
        field: 'constructionMonths',
        message: 'Construction duration seems too short (<3 months)',
        messageTR: 'İnşaat süresi çok kısa görünüyor (<3 ay)',
      })
    } else if (inputs.constructionMonths > 60) {
      errors.push({
        field: 'constructionMonths',
        message: 'Construction duration seems too long (>60 months)',
        messageTR: 'İnşaat süresi çok uzun görünüyor (>60 ay)',
      })
    }
  }

  // Months to sell validation (optional)
  if (inputs.monthsToSellAfterCompletion !== undefined) {
    if (inputs.monthsToSellAfterCompletion < 0) {
      errors.push({
        field: 'monthsToSellAfterCompletion',
        message: 'Months to sell cannot be negative',
        messageTR: 'Satış süresi negatif olamaz',
      })
    } else if (!isFinite(inputs.monthsToSellAfterCompletion)) {
      errors.push({
        field: 'monthsToSellAfterCompletion',
        message: 'Months to sell must be a valid number',
        messageTR: 'Satış süresi geçerli bir sayı olmalıdır',
      })
    } else if (inputs.monthsToSellAfterCompletion > 48) {
      errors.push({
        field: 'monthsToSellAfterCompletion',
        message: 'Months to sell seems unrealistically long (>48 months)',
        messageTR: 'Satış süresi gerçekçi değil (>48 ay)',
      })
    }
  }

  // Monthly inflation rate validation (optional but critical)
  if (inputs.monthlyInflationRate !== undefined) {
    if (!isFinite(inputs.monthlyInflationRate)) {
      errors.push({
        field: 'monthlyInflationRate',
        message: 'Monthly inflation rate must be a valid number',
        messageTR: 'Aylık enflasyon oranı geçerli bir sayı olmalıdır',
      })
    } else if (inputs.monthlyInflationRate < -0.05) {
      // -5% monthly = severe deflation (unlikely)
      errors.push({
        field: 'monthlyInflationRate',
        message: 'Monthly inflation rate seems too low (<-5%)',
        messageTR: 'Aylık enflasyon oranı çok düşük görünüyor (<-5%)',
      })
    } else if (inputs.monthlyInflationRate > 0.20) {
      // 20% monthly = hyperinflation (calculation may overflow)
      errors.push({
        field: 'monthlyInflationRate',
        message: 'Monthly inflation rate seems too high (>20%). This may cause calculation overflow.',
        messageTR: 'Aylık enflasyon oranı çok yüksek (>20%). Bu hesaplama hatasına neden olabilir.',
      })
    }
  }

  // Monthly appreciation rate validation (optional)
  if (inputs.monthlyAppreciationRate !== undefined) {
    if (!isFinite(inputs.monthlyAppreciationRate)) {
      errors.push({
        field: 'monthlyAppreciationRate',
        message: 'Monthly appreciation rate must be a valid number',
        messageTR: 'Aylık değer artış oranı geçerli bir sayı olmalıdır',
      })
    } else if (inputs.monthlyAppreciationRate < -0.10) {
      errors.push({
        field: 'monthlyAppreciationRate',
        message: 'Monthly appreciation rate seems too low (<-10%)',
        messageTR: 'Aylık değer artış oranı çok düşük görünüyor (<-10%)',
      })
    } else if (inputs.monthlyAppreciationRate > 0.30) {
      errors.push({
        field: 'monthlyAppreciationRate',
        message: 'Monthly appreciation rate seems unrealistically high (>30%)',
        messageTR: 'Aylık değer artış oranı gerçekçi değil (>30%)',
      })
    }
  }

  // Monthly discount rate validation (optional)
  if (inputs.monthlyDiscountRate !== undefined) {
    if (!isFinite(inputs.monthlyDiscountRate)) {
      errors.push({
        field: 'monthlyDiscountRate',
        message: 'Monthly discount rate must be a valid number',
        messageTR: 'Aylık iskonto oranı geçerli bir sayı olmalıdır',
      })
    } else if (inputs.monthlyDiscountRate < 0) {
      errors.push({
        field: 'monthlyDiscountRate',
        message: 'Monthly discount rate cannot be negative',
        messageTR: 'Aylık iskonto oranı negatif olamaz',
      })
    } else if (inputs.monthlyDiscountRate > 0.30) {
      errors.push({
        field: 'monthlyDiscountRate',
        message: 'Monthly discount rate seems too high (>30%)',
        messageTR: 'Aylık iskonto oranı çok yüksek görünüyor (>30%)',
      })
    }
  }

  // Land cost validation (optional but must be non-negative if provided)
  if (inputs.landCost !== undefined) {
    if (inputs.landCost < 0) {
      errors.push({
        field: 'landCost',
        message: 'Land cost cannot be negative',
        messageTR: 'Arsa maliyeti negatif olamaz',
      })
    } else if (!isFinite(inputs.landCost)) {
      errors.push({
        field: 'landCost',
        message: 'Land cost must be a valid number',
        messageTR: 'Arsa maliyeti geçerli bir sayı olmalıdır',
      })
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Validates that calculation results don't contain NaN or Infinity
 */
export function validateCalculationResults(results: unknown): boolean {
  if (typeof results !== 'object' || results === null) {
    return false
  }

  const checkValue = (value: unknown): boolean => {
    if (typeof value === 'number') {
      return isFinite(value)
    }
    if (typeof value === 'object' && value !== null) {
      return Object.values(value).every(checkValue)
    }
    return true
  }

  return checkValue(results)
}
