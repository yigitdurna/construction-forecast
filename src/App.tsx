/**
 * Main Application Entry Point
 *
 * Phase 2.4: Multi-Project Feasibility Analysis with Routing
 */

import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { FeasibilityPage } from './pages/FeasibilityPage';
import { ProjectListPage } from './pages/ProjectListPage';

/**
 * FeasibilityPageWrapper
 *
 * Extracts projectId from URL query params and passes to FeasibilityPage
 */
function FeasibilityPageWrapper() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || undefined;

  return <FeasibilityPage projectId={projectId} />;
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter basename="/construction-forecast">
        <div className="min-h-screen bg-gray-50">
          <Routes>
            <Route path="/" element={<ProjectListPage />} />
            <Route path="/feasibility" element={<FeasibilityPageWrapper />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
