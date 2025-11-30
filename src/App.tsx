import { useState } from 'react'
import { ProjectForm } from './components/ProjectForm'
import { ResultsView } from './components/ResultsView'
import { ProjectInputs, CalculationResults } from './types'
import { calculateProjectCosts } from './utils/calculations'

function App() {
  const [results, setResults] = useState<CalculationResults | null>(null)
  const [parameterOverrides, setParameterOverrides] = useState<{
    timeline?: any;
    cost?: Record<string, number>;
    sales?: Record<string, number>;
  }>({})

  const handleCalculate = (inputs: ProjectInputs) => {
    // Apply any initial parameter overrides set before calculation
    const updatedInputs = applyParameterOverrides(inputs, parameterOverrides)
    const calculatedResults = calculateProjectCosts(updatedInputs, {
      cost: parameterOverrides.cost,
      sales: parameterOverrides.sales,
    })
    setResults(calculatedResults)
  }

  const handleInitialParameterChange = (type: 'timeline' | 'cost' | 'sales', key: string, value: any) => {
    const newOverrides = { ...parameterOverrides }

    // Handle timeline parameters
    if (type === 'timeline') {
      if (!newOverrides.timeline) newOverrides.timeline = {}
      newOverrides.timeline[key] = value
    } else if (type === 'cost') {
      if (!newOverrides.cost) newOverrides.cost = {}
      newOverrides.cost[key] = value
    } else if (type === 'sales') {
      if (!newOverrides.sales) newOverrides.sales = {}
      newOverrides.sales[key] = value
    }

    setParameterOverrides(newOverrides)
  }

  const handleParameterChange = (type: 'timeline' | 'cost' | 'sales', key: string, value: any) => {
    if (!results) return

    const newOverrides = { ...parameterOverrides }

    // Handle timeline parameters
    if (type === 'timeline') {
      if (!newOverrides.timeline) newOverrides.timeline = {}
      newOverrides.timeline[key] = value
    } else if (type === 'cost') {
      if (!newOverrides.cost) newOverrides.cost = {}
      newOverrides.cost[key] = value
    } else if (type === 'sales') {
      if (!newOverrides.sales) newOverrides.sales = {}
      newOverrides.sales[key] = value
    }

    setParameterOverrides(newOverrides)

    // Recalculate with new parameters
    const updatedInputs = applyParameterOverrides(results.inputs, newOverrides)
    const recalculatedResults = calculateProjectCosts(updatedInputs, {
      cost: newOverrides.cost,
      sales: newOverrides.sales,
    })
    setResults(recalculatedResults)
  }

  const applyParameterOverrides = (inputs: ProjectInputs, overrides: typeof parameterOverrides): ProjectInputs => {
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
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white py-6 shadow-md">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold">İnşaat Maliyet ve Satış Tahmin Aracı</h1>
          <p className="text-blue-100 mt-2">Antalya Bölgesi - Temel Hesaplama</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
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
  )
}

export default App
