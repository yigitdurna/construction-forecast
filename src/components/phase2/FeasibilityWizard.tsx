/**
 * Feasibility Wizard Orchestrator
 *
 * Main container for the 4-step feasibility analysis wizard
 */

import { useFeasibility } from '../../context/FeasibilityContext';
import { StepIndicator } from './StepIndicator';
import { ParselLookupWithImar } from './ParselLookupWithImar';
import { UnitMixEditor } from './UnitMixEditor';
import { CostPricingStep } from './CostPricingStep';
import { FinancialSummary } from './FinancialSummary';
import type {
  ParselImarData,
  UnitMix,
  PricingConfig,
  FinancialResult,
  TKGMParcelData,
} from '../../types/feasibility';
import { WIZARD_TEXT } from '../../types/feasibility';
import type { ZoningResult } from '../../types/zoning';
import type { ManualImarParams } from '../../utils/imarValidation';

/**
 * FeasibilityWizard Component
 *
 * Orchestrates the complete 4-step workflow:
 * 1. Parsel & İmar → ParselLookupWithImar
 * 2. Unit Mix → UnitMixEditor
 * 3. Cost & Pricing → CostPricingStep
 * 4. Financial Analysis → FinancialSummary
 */
export function FeasibilityWizard(): JSX.Element {
  const {
    state,
    setStep,
    goNext,
    goBack,
    setStep1Data,
    setStep2Data,
    setStep3Data,
    setStep4Data,
  } = useFeasibility();

  const { currentStep, completedSteps, step1, step2, step3 } = state;

  /**
   * Handle Step 1 completion (Parsel & İmar)
   */
  const handleStep1Complete = (result: {
    parselAlani: number;
    imarParams: ManualImarParams;
    zoningResult: ZoningResult;
  }) => {
    // Create Step 1 data structure
    const parselData: TKGMParcelData = {
      ilce: 'Antalya', // TODO: Get from ParselLookupWithImar
      ada: '-',
      parsel: '-',
      parselAlani: result.parselAlani,
      source: 'manual',
    };

    const step1Data: ParselImarData = {
      parselData,
      imarParams: result.imarParams,
      zoningResult: result.zoningResult,
    };

    setStep1Data(step1Data);
    goNext();
  };

  /**
   * Handle Step 2 update (Unit Mix)
   */
  const handleStep2Update = (unitMix: UnitMix) => {
    setStep2Data(unitMix);
  };

  /**
   * Handle Step 3 update (Pricing)
   */
  const handleStep3Update = (pricing: PricingConfig) => {
    setStep3Data(pricing);
  };

  /**
   * Handle Step 4 update (Financial)
   */
  const handleStep4Update = (result: FinancialResult) => {
    setStep4Data(result);
  };

  /**
   * Can proceed to next step?
   */
  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return step1 !== null;
      case 2:
        return step2 !== null && step2.units.length > 0;
      case 3:
        return step3 !== null;
      case 4:
        return false; // Last step
      default:
        return false;
    }
  };

  /**
   * Get current step component
   */
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <ParselLookupWithImar onComplete={handleStep1Complete} />;

      case 2:
        if (!step1) {
          return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Lütfen önce Parsel ve İmar bilgilerini girin (Adım 1)
              </p>
            </div>
          );
        }
        return (
          <UnitMixEditor
            availableArea={step1.zoningResult.netKullanimAlani}
            initialMix={step2 ?? undefined}
            onMixChange={handleStep2Update}
          />
        );

      case 3:
        if (!step1 || !step2) {
          return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Lütfen önce önceki adımları tamamlayın
              </p>
            </div>
          );
        }
        return (
          <CostPricingStep
            unitMix={step2}
            district={step1.parselData.ilce}
            onPricingChange={handleStep3Update}
          />
        );

      case 4:
        if (!step1 || !step2 || !step3) {
          return (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-800">
                Lütfen önce önceki adımları tamamlayın
              </p>
            </div>
          );
        }
        return (
          <FinancialSummary
            step1Data={step1}
            step2Data={step2}
            step3Data={step3}
            onResultChange={handleStep4Update}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Fizibilite Analizi Sihirbazı
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          4 adımda kapsamlı inşaat fizibilite analizi
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        completedSteps={completedSteps}
        onStepClick={setStep}
      />

      {/* Current Step Content */}
      <div className="mt-8">{renderCurrentStep()}</div>

      {/* Navigation Buttons */}
      <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
        {/* Back Button */}
        <button
          onClick={goBack}
          disabled={currentStep === 1}
          className={`rounded-lg px-6 py-2 text-sm font-medium ${
            currentStep === 1
              ? 'cursor-not-allowed text-gray-400'
              : 'text-gray-700 hover:bg-gray-100'
          }`}
        >
          {WIZARD_TEXT.buttons.back}
        </button>

        {/* Step Info */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Adım {currentStep} / 4
          </p>
        </div>

        {/* Next Button */}
        {currentStep < 4 ? (
          <button
            onClick={goNext}
            disabled={!canProceed()}
            className={`rounded-lg px-6 py-3 text-sm font-semibold text-white shadow-sm ${
              canProceed()
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'cursor-not-allowed bg-gray-400'
            }`}
          >
            {WIZARD_TEXT.buttons.next}
          </button>
        ) : (
          <div className="w-32" />
        )}
      </div>

      {/* Help Text */}
      {!canProceed() && currentStep < 4 && (
        <div className="mt-4 rounded-lg bg-yellow-50 p-4">
          <p className="text-sm text-yellow-800">
            💡 {WIZARD_TEXT.validation.completeStep}
          </p>
        </div>
      )}
    </div>
  );
}

export default FeasibilityWizard;
