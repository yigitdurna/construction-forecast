/**
 * Feasibility Analysis Page
 *
 * Main page for Phase 2.3 - Complete feasibility wizard
 */

import { FeasibilityProvider } from '../context/FeasibilityContext';
import { FeasibilityWizard } from '../components/phase2/FeasibilityWizard';

/**
 * FeasibilityPage Component
 *
 * Wraps FeasibilityWizard with FeasibilityProvider
 */
export function FeasibilityPage(): JSX.Element {
  return (
    <FeasibilityProvider>
      <FeasibilityWizard />
    </FeasibilityProvider>
  );
}

export default FeasibilityPage;
