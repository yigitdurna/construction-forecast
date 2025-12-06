/**
 * Parsel Lookup with İmar Component
 *
 * Combined component integrating:
 * 1. TKGM parcel lookup (Phase 2.1)
 * 2. Manual İmar entry (Phase 2.2)
 * 3. Zoning calculation
 * 4. Unit mix generation
 *
 * This is the main entry point for Phase 2 workflow
 */

import { useState, useEffect } from 'react';
import { ImarManualEntry } from './ImarManualEntry';
import { BodrumConfigPanel } from './BodrumConfigPanel';
import { calculateZoning } from '../../services/zoningCalculator';
import { calculateAreaBreakdown } from '../../utils/imarCalculations';
import type { ManualImarParams } from '../../utils/imarValidation';
import type { ZoningResult, ImarData } from '../../types/zoning';
import type { BodrumConfig } from '../../utils/imarCalculations';

export interface ParselLookupWithImarProps {
  onComplete: (result: {
    parselAlani: number;
    imarParams: ManualImarParams;
    zoningResult: ZoningResult;
    bodrumConfig?: BodrumConfig;
  }) => void;
}

/**
 * Parsel Lookup with İmar Component
 *
 * Complete workflow:
 * Step 1: User enters Ada/Parsel
 * Step 2: TKGM API fetches parsel data
 * Step 3: User enters İmar params manually
 * Step 4: Calculate zoning automatically
 * Step 5: Pass to parent for unit mix & cost calculation
 */
export function ParselLookupWithImar({
  onComplete,
}: ParselLookupWithImarProps): JSX.Element {
  // Step 1: Ada/Parsel input
  const [ilce, setIlce] = useState('');
  const [ada, setAda] = useState('');
  const [parsel, setParsel] = useState('');
  const [step, setStep] = useState<'input' | 'imar' | 'complete'>('input');

  // Step 2: TKGM data (mock for now - Phase 2.1 integration pending)
  const [parselAlani, setParselAlani] = useState<number | null>(null);
  const [isLoadingTKGM, setIsLoadingTKGM] = useState(false);
  const [tkgmError, setTkgmError] = useState<string | null>(null);

  // Step 3: İmar data (after manual entry)
  const [imarData, setImarData] = useState<ImarData | null>(null);
  const [tabanAlani, setTabanAlani] = useState<number>(0);

  // Step 4: Bodrum configuration (Phase 3.2)
  const [bodrumConfig, setBodrumConfig] = useState<BodrumConfig>({
    enabled: false,
    usage: 'otopark',
  });

  /**
   * Handle TKGM lookup
   * TODO: Replace with actual TKGM service from Phase 2.1
   */
  const handleTKGMLookup = async () => {
    setIsLoadingTKGM(true);
    setTkgmError(null);

    try {
      // Mock TKGM API call
      // In real implementation, use: import { fetchParcelData } from '../../services/tkgm';
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock response - in production, this comes from TKGM API
      const mockParselAlani = 2146; // Example: Ada 6960, Parsel 4 in Muratpaşa

      setParselAlani(mockParselAlani);
      setStep('imar');
    } catch (error) {
      setTkgmError(
        'TKGM sorgusu başarısız oldu. Lütfen Ada ve Parsel numarasını kontrol edin.'
      );
    } finally {
      setIsLoadingTKGM(false);
    }
  };

  /**
   * Handle İmar submission
   * Store imar data and proceed to bodrum config
   */
  const handleImarSubmit = (imarDataInput: ImarData) => {
    if (!parselAlani) {
      return;
    }

    // Store imar data
    setImarData(imarDataInput);
    setTabanAlani(imarDataInput.calculated.tabanAlani);

    // No need to change step - bodrum config appears inline
  };

  /**
   * Handle final submission after bodrum config
   * Calculate zoning and pass to parent
   * Phase 3.2: Integrate bodrum-aware area calculations
   */
  const handleFinalSubmit = () => {
    if (!parselAlani || !imarData) {
      return;
    }

    // Calculate zoning using Phase 2.1 engine
    let zoningResult = calculateZoning({
      parselAlani,
      taks: imarData.inputs.taks,
      kaks: imarData.inputs.kaks,
      maxKatAdedi: imarData.calculated.uygulanacakKatAdedi,
      cikmaKatsayisi: imarData.inputs.cikmaKatsayisi || 1.0,
    });

    // Phase 3.2: If bodrum is enabled with sellable usage, calculate adjusted area
    if (bodrumConfig.enabled && (bodrumConfig.usage === 'konut' || bodrumConfig.usage === 'ticaret')) {
      const areaBreakdown = calculateAreaBreakdown(
        zoningResult,
        bodrumConfig,
        0.85 // net/gross ratio
      );

      // Update zoningResult with bodrum-adjusted sellable area
      // toplamSatilabilir = netKullanim + bodrum sellable area
      zoningResult = {
        ...zoningResult,
        netKullanimAlani: areaBreakdown.toplamSatilabilir,
      };
    }

    // Convert ImarData to ManualImarParams for backward compatibility
    // TODO: Update parent components to use ImarData
    const imarParams = {
      taks: imarData.inputs.taks,
      kaks: imarData.inputs.kaks,
      katAdedi: imarData.calculated.hesaplananKatAdedi,
      cikmaKatsayisi: imarData.inputs.cikmaKatsayisi,
    };

    // Pass complete data to parent (including bodrum config)
    onComplete({
      parselAlani,
      imarParams,
      zoningResult,
      bodrumConfig: bodrumConfig.enabled ? bodrumConfig : undefined,
    });

    setStep('complete');
  };

  /**
   * Auto-submit when imar data is complete (Phase 3.3 UX improvement)
   * This eliminates the need for "İmar Hesaplamasına Devam Et" button
   */
  useEffect(() => {
    if (!parselAlani || !imarData || step !== 'imar') {
      return;
    }

    // Auto-submit after a brief delay to allow user to see bodrum panel
    const timer = setTimeout(() => {
      handleFinalSubmit();
    }, 300);

    return () => clearTimeout(timer);
  }, [imarData, bodrumConfig]); // Re-run when bodrum config changes

  // Step 1: Ada/Parsel input form
  if (step === 'input') {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Parsel Bilgileri
          </h3>
          <p className="mt-1 text-sm text-gray-600">
            Ada ve Parsel numaranızı girerek TKGM'den parsel alanını sorgulayın
          </p>

          <div className="mt-6 space-y-4">
            {/* İlçe Selection */}
            <div>
              <label
                htmlFor="ilce"
                className="block text-sm font-medium text-gray-700"
              >
                İlçe
              </label>
              <select
                id="ilce"
                value={ilce}
                onChange={(e) => setIlce(e.target.value)}
                className="mt-1 block w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Seçiniz</option>
                <option value="kepez">Kepez</option>
                <option value="muratpasa">Muratpaşa</option>
                <option value="konyaalti">Konyaaltı</option>
              </select>
            </div>

            {/* Ada Input */}
            <div>
              <label
                htmlFor="ada"
                className="block text-sm font-medium text-gray-700"
              >
                Ada
              </label>
              <input
                type="text"
                id="ada"
                value={ada}
                onChange={(e) => setAda(e.target.value)}
                placeholder="örn: 6960"
                className="mt-1 block w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Parsel Input */}
            <div>
              <label
                htmlFor="parsel"
                className="block text-sm font-medium text-gray-700"
              >
                Parsel
              </label>
              <input
                type="text"
                id="parsel"
                value={parsel}
                onChange={(e) => setParsel(e.target.value)}
                placeholder="örn: 4"
                className="mt-1 block w-full rounded-lg border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {/* Error Message */}
            {tkgmError && (
              <div className="rounded-lg bg-red-50 p-4">
                <p className="text-sm text-red-800">{tkgmError}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={handleTKGMLookup}
              disabled={!ilce || !ada || !parsel || isLoadingTKGM}
              className={`w-full rounded-lg px-4 py-3 text-sm font-semibold text-white shadow-sm ${
                !ilce || !ada || !parsel || isLoadingTKGM
                  ? 'cursor-not-allowed bg-gray-400'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isLoadingTKGM ? 'TKGM\'den Sorgulanıyor...' : 'TKGM\'den Sorgula'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: İmar manual entry
  if (step === 'imar' && parselAlani) {
    return (
      <div className="space-y-6">
        {/* Parsel info header */}
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <p className="text-sm font-medium text-green-800">
                Parsel bilgileri TKGM'den alındı
              </p>
              <p className="mt-1 text-xs text-green-700">
                {ilce.toUpperCase()} - Ada: {ada}, Parsel: {parsel} - Parsel
                Alanı: {parselAlani.toLocaleString('tr-TR')} m²
              </p>
            </div>
          </div>
        </div>

        {/* İmar Manual Entry */}
        <ImarManualEntry
          parselAlani={parselAlani}
          ilce={ilce}
          ada={ada}
          parsel={parsel}
          onSubmit={handleImarSubmit}
        />

        {/* Bodrum Configuration (always shown after İmar data, collapsible) */}
        {imarData && tabanAlani > 0 && (
          <BodrumConfigPanel
            config={bodrumConfig}
            tabanAlani={tabanAlani}
            onChange={setBodrumConfig}
            className="border-blue-200"
          />
        )}

        {/* Back button */}
        <button
          onClick={() => {
            setImarData(null);
            setStep('input');
          }}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          ← Parsel bilgilerini değiştir
        </button>
      </div>
    );
  }

  // Step 3: Complete (handled by parent)
  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-6">
      <div className="text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-400"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <p className="mt-3 text-lg font-semibold text-green-900">
          Hesaplama Tamamlandı
        </p>
        <p className="mt-1 text-sm text-green-700">
          Daire dağılımı ve maliyet hesaplaması devam ediyor...
        </p>
      </div>
    </div>
  );
}

export default ParselLookupWithImar;
