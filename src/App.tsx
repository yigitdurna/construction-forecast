import { useState, useCallback } from 'react'
import { ProjectForm } from './components/ProjectForm'
import { ResultsView } from './components/ResultsView'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ProjectInputs, CalculationResults, ParameterOverrides } from './types'
import { calculateProjectCosts } from './utils/calculations'

function App() {
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [parameterOverrides, setParameterOverrides] = useState<ParameterOverrides>({})
  const [error, setError] = useState<string | null>(null)

  const handleCalculate = useCallback((inputs: ProjectInputs) => {
    try {
      // Clear any previous errors
      setError(null)

      // Apply any initial parameter overrides set before calculation
      const updatedInputs = applyParameterOverrides(inputs, parameterOverrides)
      const calculatedResults = calculateProjectCosts(updatedInputs, {
        cost: parameterOverrides.cost,
        sales: parameterOverrides.sales,
      })
      setResults(calculatedResults)
    } catch (err) {
      // Handle calculation errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'Hesaplama sırasında bir hata oluştu'
      setError(errorMessage)
      console.error('Calculation error:', err)
    }
  }, [parameterOverrides])

  const handleInitialParameterChange = (type: 'timeline' | 'cost' | 'sales', key: string, value: number | string | undefined | null) => {
    const newOverrides = { ...parameterOverrides }

    // Handle timeline parameters
    if (type === 'timeline') {
      if (!newOverrides.timeline) newOverrides.timeline = {}
      newOverrides.timeline[key] = value
    } else if (type === 'cost') {
      if (!newOverrides.cost) newOverrides.cost = {}
      newOverrides.cost[key] = value as number
    } else if (type === 'sales') {
      if (!newOverrides.sales) newOverrides.sales = {}
      newOverrides.sales[key] = value as number
    }

    setParameterOverrides(newOverrides)
  }

  const handleParameterChange = (type: 'timeline' | 'cost' | 'sales', key: string, value: number | string | undefined | null) => {
    if (!results) return

    try {
      // Clear any previous errors
      setError(null)

      const newOverrides = { ...parameterOverrides }

      // Handle timeline parameters
      if (type === 'timeline') {
        if (!newOverrides.timeline) newOverrides.timeline = {}
        newOverrides.timeline[key] = value
      } else if (type === 'cost') {
        if (!newOverrides.cost) newOverrides.cost = {}
        newOverrides.cost[key] = value as number
      } else if (type === 'sales') {
        if (!newOverrides.sales) newOverrides.sales = {}
        newOverrides.sales[key] = value as number
      }

      setParameterOverrides(newOverrides)

      // Recalculate with new parameters
      const updatedInputs = applyParameterOverrides(results.inputs, newOverrides)
      const recalculatedResults = calculateProjectCosts(updatedInputs, {
        cost: newOverrides.cost,
        sales: newOverrides.sales,
      })
      setResults(recalculatedResults)
    } catch (err) {
      // Handle recalculation errors gracefully
      const errorMessage = err instanceof Error ? err.message : 'Parametre güncellemesi sırasında bir hata oluştu'
      setError(errorMessage)
      console.error('Parameter change error:', err)
    }
  }

  const applyParameterOverrides = (inputs: ProjectInputs, overrides: ParameterOverrides): ProjectInputs => {
    let updatedInputs = { ...inputs }

    // Apply timeline overrides
    if (overrides.timeline) {
      updatedInputs = {
        ...updatedInputs,
        startDate: overrides.timeline.startDate || inputs.startDate,
        landSize: overrides.timeline.landSize ?? inputs.landSize,
        constructionMonths: overrides.timeline.constructionMonths ?? inputs.constructionMonths,
        monthsToSellAfterCompletion: overrides.timeline.monthsToSell ?? inputs.monthsToSellAfterCompletion,
        monthlyInflationRate: overrides.timeline.monthlyInflationRate ?? inputs.monthlyInflationRate,
        monthlyAppreciationRate: overrides.timeline.monthlyAppreciationRate ?? inputs.monthlyAppreciationRate,
        costDistribution: overrides.timeline.costDistribution ?? inputs.costDistribution,
      }
    }

    // Note: Cost and sales overrides are handled in the calculation functions
    // via the parameter objects, not through input overrides

    return updatedInputs
  }

  const handleReset = () => {
    setResults(null)
    setParameterOverrides({})
    setError(null)
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-blue-600 text-white py-6 shadow-md">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold">İnşaat Maliyet ve Satış Tahmin Aracı</h1>
            <p className="text-blue-100 mt-2">Antalya Bölgesi - Temel Hesaplama</p>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          {/* Error Message Display */}
          {error && (
            <div className="max-w-2xl mx-auto mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl">⚠️</span>
                <div className="flex-1">
                  <h3 className="font-semibold text-red-800 mb-1">Hata</h3>
                  <p className="text-red-700 text-sm">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="mt-3 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}

          {!results ? (
            <ProjectForm
              onCalculate={handleCalculate}
              onParameterChange={handleInitialParameterChange}
              parameterOverrides={parameterOverrides}
            />
          ) : (
            <ResultsView
              results={results}
              onReset={handleReset}
              onParameterChange={handleParameterChange}
              parameterOverrides={parameterOverrides}
            />
          )}
        </main>

        <footer className="bg-gray-800 text-gray-300 py-6 mt-12">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm">
              © 2024 İnşaat Tahmin Aracı - Faz 1 (Temel Hesaplayıcı)
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Tüm veriler varsayılan referans değerlerdir. Profesyonel danışmanlık alınması önerilir.
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  )
}

export default App
