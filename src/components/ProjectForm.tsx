import { useState, FormEvent } from 'react'
import { ProjectInputs, ProjectType } from '../types'
import { getDefaultConstructionDuration } from '../utils/calculations'
import { getAllLocationNames, getLocationData } from '../data/antalyaLocations'
import { formatNumber } from '../utils/calculations'
import { getCostParametersForQuality } from '../data/costParameterDefaults'

interface ProjectFormProps {
  onCalculate: (inputs: ProjectInputs) => void
  onParameterChange?: (type: 'timeline' | 'cost' | 'sales', key: string, value: any) => void
  parameterOverrides?: {
    timeline?: any;
    cost?: Record<string, number>;
    sales?: Record<string, number>;
  }
}

export function ProjectForm({ onCalculate, onParameterChange, parameterOverrides }: ProjectFormProps) {
  const [showAdvancedParameters, setShowAdvancedParameters] = useState(false)
  const [formData, setFormData] = useState<ProjectInputs>({
    location: '',
    landSize: 0,
    emsal: 0,
    projectType: 'apartment',
    qualityLevel: 'luxury', // Always luxury - adjustable via individual parameters
    totalSqm: 0,
  })

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // Apply parameter overrides to form data before calculating
    const finalInputs: ProjectInputs = {
      ...formData,
      landSize: parameterOverrides?.timeline?.landSize ?? formData.landSize,
      landCost: parameterOverrides?.timeline?.landCost, // Direct land cost if provided
      constructionMonths: parameterOverrides?.timeline?.constructionMonths,
      monthlyInflationRate: parameterOverrides?.timeline?.monthlyInflationRate,
      monthlyAppreciationRate: parameterOverrides?.timeline?.monthlyAppreciationRate,
      monthsToSellAfterCompletion: parameterOverrides?.timeline?.monthsToSell,
      costDistribution: 'scurve', // Always use S-curve for accuracy
    }
    onCalculate(finalInputs)
  }

  const handleChange = (field: keyof ProjectInputs, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Calculate default construction duration for display
  const defaultDuration = formData.totalSqm > 0
    ? getDefaultConstructionDuration(formData.projectType, formData.totalSqm)
    : 14

  // Get location data for land price display
  const locationData = formData.location ? getLocationData(formData.location) : null
  const landPricePerSqm = locationData?.prices.landPrice || 0
  const currentLandSize = parameterOverrides?.timeline?.landSize ?? formData.landSize
  const directLandCost = parameterOverrides?.timeline?.landCost
  const calculatedLandCost = currentLandSize > 0 ? currentLandSize * landPricePerSqm : 0
  const effectiveLandCost = directLandCost !== undefined && directLandCost > 0 ? directLandCost : calculatedLandCost

  // Get cost parameters for display
  const costParameters = getCostParametersForQuality(formData.qualityLevel, parameterOverrides?.cost || {})

  // Group cost parameters by category
  const costCategories = costParameters.reduce((acc, param) => {
    if (!acc[param.category]) acc[param.category] = []
    acc[param.category].push(param)
    return acc
  }, {} as Record<string, typeof costParameters>)

  const categoryLabels: Record<string, { icon: string; label: string }> = {
    structure: { icon: '🏗️', label: 'Kaba Yapı' },
    envelope: { icon: '🧱', label: 'Dış Cephe' },
    mep: { icon: '⚡', label: 'MEP (Mekanik/Elektrik)' },
    interior: { icon: '🏠', label: 'İç Mekan' },
    site: { icon: '🌳', label: 'Saha İşleri' },
    soft: { icon: '📋', label: 'Yumuşak Maliyetler' },
    financial: { icon: '💰', label: 'Finansal' },
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Proje Bilgileri</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ============ REQUIRED INPUTS ============ */}
        
        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            Lokasyon <span className="text-red-500">*</span>
          </label>
          <select
            id="location"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
            required
          >
            <option value="">Bir lokasyon seçin</option>
            {getAllLocationNames().map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
          {locationData && (
            <p className="text-xs text-green-600 mt-1">
              📍 Arsa: {formatNumber(landPricePerSqm)} TL/m² | Daire: {formatNumber(locationData.prices.salesPriceApartment)} TL/m²
            </p>
          )}
        </div>

        {/* Total SQM */}
        <div>
          <label htmlFor="totalSqm" className="block text-sm font-medium text-gray-700 mb-2">
            Toplam İnşaat Alanı (m²) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="totalSqm"
            placeholder="2500"
            min="1"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.totalSqm || ''}
            onChange={(e) => handleChange('totalSqm', Number(e.target.value))}
            required
          />
          {formData.totalSqm > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Tahmini inşaat süresi: {defaultDuration} ay
            </p>
          )}
        </div>

        {/* EMSAL */}
        <div>
          <label htmlFor="emsal" className="block text-sm font-medium text-gray-700 mb-2">
            EMSAL (İmar Katsayısı) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            id="emsal"
            placeholder="2.5"
            min="0.1"
            step="0.1"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.emsal || ''}
            onChange={(e) => handleChange('emsal', Number(e.target.value))}
            required
          />
          {formData.emsal > 0 && currentLandSize > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Maksimum inşaat alanı: {formatNumber(currentLandSize * formData.emsal)} m² (Arsa × EMSAL)
            </p>
          )}
        </div>

        {/* Project Type */}
        <div>
          <label htmlFor="projectType" className="block text-sm font-medium text-gray-700 mb-2">
            Proje Tipi <span className="text-red-500">*</span>
          </label>
          <select
            id="projectType"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={formData.projectType}
            onChange={(e) => handleChange('projectType', e.target.value as ProjectType)}
            required
          >
            <optgroup label="Konut Projeleri">
              <option value="apartment">Apartman</option>
              <option value="apartment_with_pool">Apartman + Havuz</option>
              <option value="villa">Villa</option>
              <option value="villa_with_pool">Villa + Havuz</option>
              <option value="mixed">Karma (Apartman + Villa)</option>
            </optgroup>
            <optgroup label="Ticari Projeler">
              <option value="commercial">Ticari (Ofis/Dükkan)</option>
              <option value="mixed_use">Karma Kullanım (Ticari + Konut)</option>
            </optgroup>
          </select>
        </div>

        {/* ============ ADVANCED PARAMETERS (Collapsible) ============ */}
        {onParameterChange && (
          <div className="border-t pt-4">
            <button
              type="button"
              onClick={() => setShowAdvancedParameters(!showAdvancedParameters)}
              className="flex items-center justify-between w-full text-left text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              <span className="flex items-center gap-2">
                ⚙️ Gelişmiş Parametreler
                <span className="text-xs text-gray-400 font-normal">(Opsiyonel - Varsayılanlar kullanılabilir)</span>
              </span>
              <span className="text-gray-400">{showAdvancedParameters ? '▼' : '▶'}</span>
            </button>

            {showAdvancedParameters && (
              <div className="bg-gray-50 rounded-lg p-6 space-y-6 border border-gray-200 mt-4">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                  <p className="text-xs text-blue-700">
                    💡 Bu parametreler boş bırakılırsa varsayılan değerler kullanılır.
                    Hesaplama sonrası "Detaylı Analiz" bölümünden de değiştirebilirsiniz.
                  </p>
                </div>

                {/* ============ LAND SECTION ============ */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🏞️ Arsa Bilgileri
                  </h4>
                  
                  {/* Land Size */}
                  <div className="mb-4">
                    <label htmlFor="landSize" className="block text-sm font-medium text-gray-700 mb-1">
                      Arsa Büyüklüğü (m²)
                      <span className="text-gray-400 font-normal ml-2">(0 = Arsa hesaba katılmaz)</span>
                    </label>
                    <input
                      type="number"
                      id="landSize"
                      placeholder="0"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={currentLandSize || ''}
                      onChange={(e) => {
                        const value = Number(e.target.value) || 0
                        handleChange('landSize', value)
                        onParameterChange?.('timeline', 'landSize', value)
                      }}
                    />
                    {currentLandSize > 0 && landPricePerSqm > 0 && (
                      <p className="text-xs text-gray-500 mt-1">
                        Hesaplanan arsa maliyeti: {formatNumber(calculatedLandCost)} TL ({formatNumber(landPricePerSqm)} TL/m² × {formatNumber(currentLandSize)} m²)
                      </p>
                    )}
                  </div>

                  {/* Direct Land Cost */}
                  <div>
                    <label htmlFor="landCost" className="block text-sm font-medium text-gray-700 mb-1">
                      Arsa Maliyeti (TL)
                      <span className="text-gray-400 font-normal ml-2">(Doğrudan giriş - Hesaplamayı geçersiz kılar)</span>
                    </label>
                    <input
                      type="number"
                      id="landCost"
                      placeholder={calculatedLandCost > 0 ? `${formatNumber(calculatedLandCost)} (hesaplanan)` : '0'}
                      min="0"
                      step="100000"
                      className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                        directLandCost !== undefined && directLandCost > 0 ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                      }`}
                      value={directLandCost ?? ''}
                      onChange={(e) => {
                        const value = e.target.value ? Number(e.target.value) : undefined
                        onParameterChange?.('timeline', 'landCost', value)
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {directLandCost !== undefined && directLandCost > 0 
                        ? `✓ Doğrudan girilen arsa maliyeti kullanılacak: ${formatNumber(directLandCost)} TL`
                        : currentLandSize > 0 
                          ? `Arsa büyüklüğünden hesaplanan değer kullanılacak: ${formatNumber(calculatedLandCost)} TL`
                          : 'Arsa maliyeti hesaba katılmayacak (0 TL)'
                      }
                    </p>
                  </div>
                </div>

                {/* ============ TIMELINE SECTION ============ */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📅 Zaman ve Süre
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="globalConstructionMonths" className="block text-sm font-medium text-gray-700 mb-1">
                        İnşaat Süresi (Ay)
                      </label>
                      <input
                        type="number"
                        id="globalConstructionMonths"
                        placeholder={`${defaultDuration}`}
                        min="6"
                        max="36"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={parameterOverrides?.timeline?.constructionMonths ?? ''}
                        onChange={(e) => onParameterChange('timeline', 'constructionMonths', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Varsayılan: {defaultDuration} ay</p>
                    </div>

                    <div>
                      <label htmlFor="globalMonthsToSell" className="block text-sm font-medium text-gray-700 mb-1">
                        Satış Süresi (Ay)
                      </label>
                      <input
                        type="number"
                        id="globalMonthsToSell"
                        placeholder="6"
                        min="0"
                        max="24"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={parameterOverrides?.timeline?.monthsToSell ?? ''}
                        onChange={(e) => onParameterChange('timeline', 'monthsToSell', e.target.value ? Number(e.target.value) : undefined)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Varsayılan: 6 ay</p>
                    </div>
                  </div>
                </div>

                {/* ============ ECONOMIC RATES SECTION ============ */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    📈 Ekonomik Oranlar
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="globalInflationRate" className="block text-sm font-medium text-gray-700 mb-1">
                        Aylık Enflasyon (%)
                      </label>
                      <input
                        type="number"
                        id="globalInflationRate"
                        placeholder="2.5"
                        min="0"
                        max="10"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={parameterOverrides?.timeline?.monthlyInflationRate !== undefined
                          ? parameterOverrides.timeline.monthlyInflationRate * 100
                          : ''}
                        onChange={(e) => onParameterChange('timeline', 'monthlyInflationRate', e.target.value ? Number(e.target.value) / 100 : undefined)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Varsayılan: 2.5% (~%34/yıl)</p>
                    </div>

                    <div>
                      <label htmlFor="globalAppreciationRate" className="block text-sm font-medium text-gray-700 mb-1">
                        Aylık Fiyat Artışı (%)
                      </label>
                      <input
                        type="number"
                        id="globalAppreciationRate"
                        placeholder="1.5"
                        min="-2"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        value={parameterOverrides?.timeline?.monthlyAppreciationRate !== undefined
                          ? parameterOverrides.timeline.monthlyAppreciationRate * 100
                          : ''}
                        onChange={(e) => onParameterChange('timeline', 'monthlyAppreciationRate', e.target.value ? Number(e.target.value) / 100 : undefined)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Varsayılan: 1.5% (~%20/yıl)</p>
                    </div>
                  </div>
                </div>

                {/* ============ COST PARAMETERS SECTION ============ */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    🏗️ Maliyet Parametreleri
                  </h4>
                  <p className="text-xs text-gray-500 mb-4">
                    İnşaat maliyeti bileşenleri. Değiştirmek istediğiniz parametreleri güncelleyebilirsiniz.
                  </p>
                  
                  <div className="space-y-4">
                    {Object.entries(costCategories).map(([category, params]) => {
                      const categoryInfo = categoryLabels[category] || { icon: '📦', label: category }
                      return (
                        <div key={category} className="border-t pt-3 first:border-t-0 first:pt-0">
                          <h5 className="text-xs font-medium text-gray-600 mb-2 flex items-center gap-1">
                            {categoryInfo.icon} {categoryInfo.label}
                          </h5>
                          <div className="grid grid-cols-2 gap-2">
                            {params.map(param => {
                              const range = param.rangeByQuality[formData.qualityLevel]
                              const isOverridden = parameterOverrides?.cost?.[param.id] !== undefined
                              return (
                                <div key={param.id} className="text-xs">
                                  <label className="block text-gray-600 mb-1 truncate" title={param.labelTR}>
                                    {param.labelTR}
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      placeholder={`${param.effectiveValue}`}
                                      min={range.min}
                                      max={range.max}
                                      step={param.unit === '%' ? 0.1 : param.unit === 'TL' ? 1000 : 100}
                                      className={`w-full px-2 py-1 border rounded text-sm ${
                                        isOverridden ? 'border-blue-400 bg-blue-50' : 'border-gray-300'
                                      }`}
                                      value={parameterOverrides?.cost?.[param.id] ?? ''}
                                      onChange={(e) => {
                                        const val = e.target.value ? parseFloat(e.target.value) : undefined
                                        onParameterChange('cost', param.id, val ?? null)
                                      }}
                                    />
                                    <span className="text-gray-400 w-10 text-right">{param.unit}</span>
                                  </div>
                                  <p className="text-gray-400 mt-0.5">
                                    {formatNumber(range.min)} - {formatNumber(range.max)}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Info about S-curve */}
                <div className="bg-white border border-gray-200 rounded-md p-3 text-xs text-gray-600">
                  <strong>📈 Maliyet Dağılımı:</strong> S-Eğrisi modeli kullanılır (gerçekçi: başta ve sonda az, ortada yoğun harcama).
                </div>
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 transition-colors font-medium text-lg mt-6"
        >
          Hesapla
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-4">
          <p className="text-sm text-yellow-800">
            <strong>Not:</strong> Bu hesaplamalar varsayılan referans verilerine dayanmaktadır.
            Gerçek proje maliyetleri için profesyonel danışmanlık alınması önerilir.
          </p>
        </div>
      </form>
    </div>
  )
}
