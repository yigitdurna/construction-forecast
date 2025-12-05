/**
 * Step Indicator Component
 *
 * Visual progress bar for the feasibility wizard
 */

import React from 'react';
import type { WizardStep } from '../../types/feasibility';
import { WIZARD_STEP_LABELS } from '../../types/feasibility';

export interface StepIndicatorProps {
  currentStep: WizardStep;
  completedSteps: Set<WizardStep>;
  onStepClick?: (step: WizardStep) => void;
}

/**
 * StepIndicator Component
 *
 * Shows wizard progress with clickable completed steps
 */
export function StepIndicator({
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps): JSX.Element {
  const steps: WizardStep[] = [1, 2, 3, 4];

  const handleStepClick = (step: WizardStep) => {
    // Only allow clicking on completed steps or current step
    if (step === currentStep || completedSteps.has(step)) {
      onStepClick?.(step);
    }
  };

  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isComplete = completedSteps.has(step);
          const isCurrent = step === currentStep;
          const isClickable = isComplete || isCurrent;

          return (
            <React.Fragment key={step}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <button
                  onClick={() => handleStepClick(step)}
                  disabled={!isClickable}
                  className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-semibold transition-all ${
                    isCurrent
                      ? 'border-blue-600 bg-blue-600 text-white shadow-lg'
                      : isComplete
                      ? 'border-green-500 bg-green-500 text-white hover:scale-110'
                      : 'border-gray-300 bg-white text-gray-400'
                  } ${
                    isClickable
                      ? 'cursor-pointer hover:scale-105'
                      : 'cursor-not-allowed'
                  }`}
                  aria-label={`Adım ${step}: ${WIZARD_STEP_LABELS[step]}`}
                >
                  {isComplete && !isCurrent ? (
                    // Checkmark for completed steps
                    <svg
                      className="h-6 w-6"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    // Step number
                    <span>{step}</span>
                  )}
                </button>

                {/* Step Label */}
                <span
                  className={`mt-2 text-center text-xs font-medium sm:text-sm ${
                    isCurrent
                      ? 'text-blue-600'
                      : isComplete
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {WIZARD_STEP_LABELS[step]}
                </span>
              </div>

              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div
                  className={`-mt-6 h-0.5 flex-1 transition-all ${
                    completedSteps.has(step) && completedSteps.has(steps[index + 1])
                      ? 'bg-green-500'
                      : completedSteps.has(step)
                      ? 'bg-gradient-to-r from-green-500 to-gray-300'
                      : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
