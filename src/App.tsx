/**
 * Main Application Entry Point
 *
 * Phase 2.3: Feasibility Analysis Wizard
 */

import { ErrorBoundary } from './components/ErrorBoundary';
import { FeasibilityPage } from './pages';

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <FeasibilityPage />
      </div>
    </ErrorBoundary>
  );
}

export default App;
