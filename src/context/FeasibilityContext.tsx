/**
 * Feasibility Wizard Context
 *
 * Manages state for the 4-step feasibility wizard
 */

import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import type {
  FeasibilityState,
  FeasibilityAction,
  WizardStep,
  ParselImarData,
  UnitMix,
  PricingConfig,
  FinancialResult,
} from '../types/feasibility';
import { isStepComplete } from '../types/feasibility';

// ============================================================================
// Context Type
// ============================================================================

interface FeasibilityContextType {
  state: FeasibilityState;
  dispatch: React.Dispatch<FeasibilityAction>;

  // Convenience methods
  setStep: (step: WizardStep) => void;
  goNext: () => void;
  goBack: () => void;
  setStep1Data: (data: ParselImarData) => void;
  setStep2Data: (data: UnitMix) => void;
  setStep3Data: (data: PricingConfig) => void;
  setStep4Data: (data: FinancialResult) => void;
  reset: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: FeasibilityState = {
  currentStep: 1,
  completedSteps: new Set<WizardStep>(),
  step1: null,
  step2: null,
  step3: null,
  step4: null,
  isStepValid: function (step: WizardStep): boolean {
    return isStepComplete(step, this);
  },
};

// ============================================================================
// Reducer
// ============================================================================

function feasibilityReducer(
  state: FeasibilityState,
  action: FeasibilityAction
): FeasibilityState {
  switch (action.type) {
    case 'SET_STEP': {
      // Can only navigate to completed steps or next step
      const canNavigate =
        action.step === 1 ||
        state.completedSteps.has((action.step - 1) as WizardStep);

      if (!canNavigate) {
        console.warn(`Cannot navigate to step ${action.step} - prerequisite not complete`);
        return state;
      }

      return {
        ...state,
        currentStep: action.step,
      };
    }

    case 'SET_STEP1_DATA': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(1);

      return {
        ...state,
        step1: action.data,
        completedSteps: newCompleted,
      };
    }

    case 'SET_STEP2_DATA': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(2);

      return {
        ...state,
        step2: action.data,
        completedSteps: newCompleted,
      };
    }

    case 'SET_STEP3_DATA': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(3);

      return {
        ...state,
        step3: action.data,
        completedSteps: newCompleted,
      };
    }

    case 'SET_STEP4_DATA': {
      const newCompleted = new Set(state.completedSteps);
      newCompleted.add(4);

      return {
        ...state,
        step4: action.data,
        completedSteps: newCompleted,
      };
    }

    case 'GO_NEXT': {
      const nextStep = Math.min(state.currentStep + 1, 4) as WizardStep;

      // Only proceed if current step is complete
      if (!isStepComplete(state.currentStep, state)) {
        console.warn('Current step not complete');
        return state;
      }

      return {
        ...state,
        currentStep: nextStep,
      };
    }

    case 'GO_BACK': {
      const prevStep = Math.max(state.currentStep - 1, 1) as WizardStep;
      return {
        ...state,
        currentStep: prevStep,
      };
    }

    case 'RESET': {
      return initialState;
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const FeasibilityContext = createContext<FeasibilityContextType | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface FeasibilityProviderProps {
  children: ReactNode;
}

export function FeasibilityProvider({ children }: FeasibilityProviderProps) {
  const [state, dispatch] = useReducer(feasibilityReducer, initialState);

  // Convenience methods
  const setStep = (step: WizardStep) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const goNext = () => {
    dispatch({ type: 'GO_NEXT' });
  };

  const goBack = () => {
    dispatch({ type: 'GO_BACK' });
  };

  const setStep1Data = (data: ParselImarData) => {
    dispatch({ type: 'SET_STEP1_DATA', data });
  };

  const setStep2Data = (data: UnitMix) => {
    dispatch({ type: 'SET_STEP2_DATA', data });
  };

  const setStep3Data = (data: PricingConfig) => {
    dispatch({ type: 'SET_STEP3_DATA', data });
  };

  const setStep4Data = (data: FinancialResult) => {
    dispatch({ type: 'SET_STEP4_DATA', data });
  };

  const reset = () => {
    dispatch({ type: 'RESET' });
  };

  const value: FeasibilityContextType = {
    state,
    dispatch,
    setStep,
    goNext,
    goBack,
    setStep1Data,
    setStep2Data,
    setStep3Data,
    setStep4Data,
    reset,
  };

  return (
    <FeasibilityContext.Provider value={value}>
      {children}
    </FeasibilityContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

/**
 * Hook to access feasibility wizard context
 *
 * @returns Feasibility context
 * @throws Error if used outside FeasibilityProvider
 */
export function useFeasibility(): FeasibilityContextType {
  const context = useContext(FeasibilityContext);

  if (!context) {
    throw new Error(
      'useFeasibility must be used within FeasibilityProvider'
    );
  }

  return context;
}

export default FeasibilityContext;
