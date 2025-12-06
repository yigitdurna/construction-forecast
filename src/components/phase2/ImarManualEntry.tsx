/**
 * İmar Manual Entry Component
 *
 * Form for manual entry of İmar parameters (TAKS, KAKS)
 * Shows calculated values (Taban Alanı, Toplam İnşaat, Kat Adedi)
 * Phase 2.2 - Smart manual entry UI with calculation display
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useImarCache } from '../../hooks/useImarCache';
import { getMunicipalityConfig } from '../../data/municipalityLinks';
import { ImarExplanationModal } from './ImarExplanationModal';
import { DecimalInput } from '../ui/DecimalInput';
import { IMAR_VALIDATION } from '../../config/validationRules';
import {
  calculateImarValues,
  createImarData,
  validateImarInputs,
} from '../../utils/imarValidation';
import {
  formatNumber,
  formatCoefficient,
  formatKatAdedi,
} from '../../utils/formatting';
import type { ImarUserInputs, ImarData } from '../../types/zoning';

export interface ImarManualEntryProps {
  parselAlani: number; // From TKGM lookup
  ilce: string; // District for municipality link
  ada: string; // For caching
  parsel: string; // For caching
  onSubmit: (imarData: ImarData) => void;
  isLoading?: boolean;
}

/**
 * İmar Manual Entry Component
 *
 * Allows users to manually enter İmar parameters with live calculation display
 */
export function ImarManualEntry({
  parselAlani,
  ilce,
  ada,
  parsel,
  onSubmit,
  isLoading = false,
}: ImarManualEntryProps): JSX.Element {
  const municipalityConfig = getMunicipalityConfig(ilce);
  const { cachedEntry, saveEntry } = useImarCache({ ilce, ada, parsel });

  // User input state
  const [taks, setTaks] = useState<number | undefined>(undefined);
  const [kaks, setKaks] = useState<number | undefined>(undefined);
  const [cikmaKatsayisi, setCikmaKatsayisi] = useState<number | undefined>(undefined);
  const [yencokOverride, setYencokOverride] = useState<number | undefined>(undefined);
  const [hmaxOverride, setHmaxOverride] = useState<number | undefined>(undefined);

  const [showExplanation, setShowExplanation] = useState(false);
  const [showCachedNotice, setShowCachedNotice] = useState(false);

  // Initialize from cached data if available
  useEffect(() => {
    if (cachedEntry?.imarData) {
      const cached = cachedEntry.imarData;
      setTaks(cached.taks);
      setKaks(cached.kaks);
      setCikmaKatsayisi(cached.cikmaKatsayisi);
      setShowCachedNotice(true);
      setTimeout(() => setShowCachedNotice(false), 5000);
    }
  }, [cachedEntry]);

  // Build user inputs object
  const userInputs: Partial<ImarUserInputs> = useMemo(() => ({
    parselAlani,
    taks,
    kaks,
    cikmaKatsayisi,
    yencokOverride,
    hmaxOverride,
  }), [parselAlani, taks, kaks, cikmaKatsayisi, yencokOverride, hmaxOverride]);

  // Validate inputs
  const validation = useMemo(() =>
    validateImarInputs(userInputs),
    [userInputs]
  );

  // Calculate derived values (only if inputs are valid)
  const calculatedValues = useMemo(() => {
    if (validation.isValid && taks && kaks) {
      return calculateImarValues({
        parselAlani,
        taks,
        kaks,
        cikmaKatsayisi,
        yencokOverride,
        hmaxOverride,
      });
    }
    return null;
  }, [parselAlani, taks, kaks, cikmaKatsayisi, yencokOverride, hmaxOverride, validation.isValid]);

  // Check if form is complete
  const isComplete = validation.isValid && calculatedValues !== null;

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isComplete || !taks || !kaks || !calculatedValues) {
      return;
    }

    // Create complete ImarData
    const imarData = createImarData({
      parselAlani,
      taks,
      kaks,
      cikmaKatsayisi,
      yencokOverride,
      hmaxOverride,
    });

    // Save to cache (convert to old format for backward compatibility)
    // TODO: Update cache to use new ImarData structure
    const cacheData = {
      taks: imarData.inputs.taks,
      kaks: imarData.inputs.kaks,
      katAdedi: imarData.calculated.hesaplananKatAdedi,
      cikmaKatsayisi: imarData.inputs.cikmaKatsayisi,
    };
    saveEntry(ilce, ada, parsel, cacheData, parselAlani);

    // Pass to parent
    onSubmit(imarData);
  };


  return (
    <div className="space-y-6">
      {/* Cached data notice */}
      {showCachedNotice && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
          <div className="flex items-center">
            <svg
              className="h-5 w-5 text-blue-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span className="ml-3 text-sm text-blue-800">
              Bu parsel için daha önce girilen veriler yüklendi
            </span>
          </div>
        </div>
      )}

      {/* Header with explanation */}
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              İmar Bilgileri (Manuel Giriş)
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              Bu bilgileri belediye İmar Durumu belgesinden manuel olarak giriniz.
            </p>
          </div>
          <button
            onClick={() => setShowExplanation(true)}
            className="ml-4 flex items-center rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-100"
          >
            <svg
              className="mr-1 h-4 w-4"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                clipRule="evenodd"
              />
            </svg>
            Bu değerler nedir?
          </button>
        </div>

        {/* Municipality links */}
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">
            İmar bilgilerini belediye sitesinden sorgulayın:
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={municipalityConfig.imarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              {municipalityConfig.name} İmar Sorgu
            </a>
            <span className="inline-flex items-center rounded-lg bg-gray-100 px-3 py-2 text-xs text-gray-600">
              {municipalityConfig.system} sistemi
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* User Inputs Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h4 className="text-md font-semibold text-gray-800 mb-4">
            İmar Bilgileri (Belediye Belgesinden)
          </h4>
          <div className="space-y-4">
            {/* TAKS Input */}
            <DecimalInput
              value={taks ?? null}
              onChange={(val) => setTaks(val ?? undefined)}
              min={IMAR_VALIDATION.taks.min}
              max={IMAR_VALIDATION.taks.max}
              step={IMAR_VALIDATION.taks.step}
              placeholder={`örn: ${municipalityConfig.typicalTaks}`}
              label="TAKS (Taban Alanı Kat Sayısı)"
              error={validation.errors.find(e => e.message.includes('TAKS'))?.message}
              disabled={isLoading}
              required
            />

            {/* KAKS Input */}
            <DecimalInput
              value={kaks ?? null}
              onChange={(val) => setKaks(val ?? undefined)}
              min={IMAR_VALIDATION.kaks.min}
              max={IMAR_VALIDATION.kaks.max}
              step={IMAR_VALIDATION.kaks.step}
              placeholder={`örn: ${municipalityConfig.typicalKaks}`}
              label="KAKS / Emsal"
              error={validation.errors.find(e => e.message.includes('KAKS'))?.message}
              disabled={isLoading}
              required
            />

            {/* Çıkma Katsayısı (Optional) */}
            <DecimalInput
              value={cikmaKatsayisi ?? null}
              onChange={(val) => setCikmaKatsayisi(val ?? undefined)}
              min={IMAR_VALIDATION.cikmaKatsayisi.min}
              max={IMAR_VALIDATION.cikmaKatsayisi.max}
              step={IMAR_VALIDATION.cikmaKatsayisi.step}
              placeholder="örn: 1.60"
              label="Çıkma Katsayısı (Opsiyonel)"
              error={validation.errors.find(e => e.message.includes('katsayı'))?.message}
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Calculated Values Display */}
        {calculatedValues && (
          <div className="rounded-lg border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6">
            <h4 className="text-md font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <span className="text-xl">📐</span>
              Hesaplanan Değerler
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Taban Alanı */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Taban Alanı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(calculatedValues.tabanAlani, 1)}
                  <span className="text-sm font-normal text-gray-600 ml-1">m²</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  = {formatNumber(parselAlani, 0)} × {formatCoefficient(taks ?? 0)}
                </p>
              </div>

              {/* Toplam İnşaat Alanı */}
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-xs text-gray-600 mb-1">Toplam İnşaat Alanı</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(calculatedValues.toplamInsaatAlani, 1)}
                  <span className="text-sm font-normal text-gray-600 ml-1">m²</span>
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  = {formatNumber(parselAlani, 0)} × {formatCoefficient(kaks ?? 0)}
                </p>
              </div>

              {/* Kat Adedi - THE KEY VALUE */}
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg p-4 shadow-sm border-2 border-emerald-300">
                <p className="text-xs text-emerald-900 mb-1 font-medium">Kat Adedi</p>
                <p className="text-3xl font-bold text-emerald-700">
                  {formatKatAdedi(calculatedValues.hesaplananKatAdedi)}
                </p>
                <p className="text-xs text-emerald-700 mt-1">
                  = {formatCoefficient(kaks ?? 0)} ÷ {formatCoefficient(taks ?? 0)}
                </p>
              </div>
            </div>

            {/* Çıkma ile Alan */}
            {calculatedValues.cikmaIleToplamAlan && cikmaKatsayisi && (
              <div className="mt-4 bg-white rounded-lg p-3 border border-teal-200">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-xs text-gray-600">Çıkma İle Toplam Alan</p>
                  <div className="group relative">
                    <svg
                      className="w-4 h-4 text-gray-400 cursor-help"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="hidden group-hover:block absolute left-6 top-0 z-10 w-72 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
                      <p className="font-semibold mb-2">Çıkma Katsayısı Nedir?</p>
                      <p className="mb-2">
                        Belediyenin imar durumunda belirtilen değerdir. Balkon, cumba ve çıkma alanlarını hesaplamak için kullanılır.
                      </p>
                      <p className="mb-2">
                        Standart emsal harici alanlar için genellikle <strong>1.30</strong> kullanılır (%30 ekleme).
                      </p>
                      <p className="text-gray-400">
                        Bu değer belediyeden belediyeye ve parselden parsele farklılık gösterir.
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-lg font-semibold text-gray-900">
                  {formatNumber(calculatedValues.cikmaIleToplamAlan, 2)} m²
                  <span className="text-xs text-gray-500 ml-2">
                    (×{formatCoefficient(cikmaKatsayisi)} katsayısı uygulandı)
                  </span>
                </p>
              </div>
            )}
          </div>
        )}

        {/* Optional Overrides */}
        <details className="rounded-lg border border-gray-200 bg-gray-50">
          <summary className="cursor-pointer px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100">
            İmar Belgesinde Belirtilmişse (Opsiyonel) ▼
          </summary>
          <div className="p-4 space-y-4 border-t">
            <p className="text-xs text-gray-600 mb-2">
              Bazı belediyeler maksimum kat adedi veya yükseklik belirtir. Varsa giriniz:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DecimalInput
                value={yencokOverride ?? null}
                onChange={(val) => setYencokOverride(val ?? undefined)}
                min={IMAR_VALIDATION.katAdedi.min}
                max={IMAR_VALIDATION.katAdedi.max}
                step={IMAR_VALIDATION.katAdedi.step}
                placeholder="Yoksa boş bırakın"
                label="Yençok (Maks Kat Adedi)"
                disabled={isLoading}
              />

              <DecimalInput
                value={hmaxOverride ?? null}
                onChange={(val) => setHmaxOverride(val ?? undefined)}
                min={IMAR_VALIDATION.hMax.min}
                max={IMAR_VALIDATION.hMax.max}
                step={IMAR_VALIDATION.hMax.step}
                placeholder="Yoksa boş bırakın"
                label="Hmax (Maks Yükseklik)"
                suffix="m"
                disabled={isLoading}
              />
            </div>

            {(yencokOverride || hmaxOverride) && calculatedValues && (
              <div className="bg-blue-50 rounded p-3 text-sm">
                <p className="font-medium text-blue-900">Uygulanacak Kat Adedi:</p>
                <p className="text-blue-700">
                  {formatKatAdedi(calculatedValues.uygulanacakKatAdedi)}
                  {calculatedValues.uygulanacakKatAdedi !== calculatedValues.hesaplananKatAdedi && (
                    <span className="text-xs ml-2">
                      (Hesaplanan {formatKatAdedi(calculatedValues.hesaplananKatAdedi)} yerine kısıtlama uygulandı)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>
        </details>

        {/* Validation Messages */}
        {validation.errors.length > 0 && (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-medium text-red-800 mb-2">Lütfen düzeltin:</p>
            <ul className="text-sm text-red-700 space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>• {error.message}</li>
              ))}
            </ul>
          </div>
        )}

        {validation.warnings.length > 0 && (
          <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-4">
            <p className="text-sm font-medium text-yellow-800 mb-2">Uyarılar:</p>
            <ul className="text-sm text-yellow-700 space-y-1">
              {validation.warnings.map((warning, i) => (
                <li key={i}>• {warning}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExplanation(true)}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            📖 İmar terimlerini öğren
          </button>
          <button
            type="submit"
            disabled={!isComplete || isLoading}
            className={`rounded-lg px-8 py-3 text-sm font-semibold text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              !isComplete || isLoading
                ? 'cursor-not-allowed bg-gray-400'
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            {isLoading ? 'Hesaplanıyor...' : 'Hesapla →'}
          </button>
        </div>
      </form>

      {/* Explanation Modal */}
      <ImarExplanationModal
        isOpen={showExplanation}
        onClose={() => setShowExplanation(false)}
      />
    </div>
  );
}

export default ImarManualEntry;
