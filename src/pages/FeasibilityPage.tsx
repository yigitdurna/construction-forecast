/**
 * Feasibility Analysis Page
 *
 * Main page for Phase 2.3 - Complete feasibility wizard with auto-save
 */

import { FeasibilityProvider } from '../context/FeasibilityContext';
import { FeasibilityWizard } from '../components/phase2/FeasibilityWizard';

export interface FeasibilityPageProps {
  projectId?: string; // Optional project ID to load
}

/**
 * FeasibilityPage Component
 *
 * Wraps FeasibilityWizard with FeasibilityProvider
 * Supports loading existing projects via projectId prop
 */
export function FeasibilityPage({ projectId }: FeasibilityPageProps): JSX.Element {
  return (
    <FeasibilityProvider projectId={projectId}>
      <FeasibilityWizard />
    </FeasibilityProvider>
  );
}

export default FeasibilityPage;
