/**
 * İmar Manual Entry Component
 *
 * Form for manual entry of İmar parameters (TAKS, KAKS, Kat Adedi)
 * Phase 2.2 - Smart manual entry UI
 */

import React, { useState, useEffect } from 'react';
import { useImarValidation } from '../../hooks/useImarValidation';
import { useImarCache } from '../../hooks/useImarCache';
import { getMunicipalityConfig } from '../../data/municipalityLinks';
import { ImarPreview } from './ImarPreview';
import { ImarExplanationModal } from './ImarExplanationModal';
import type { ManualImarParams } from '../../utils/imarValidation';

export interface ImarManualEntryProps {
  parselAlani: number; // From TKGM lookup
  ilce: string; // District for municipality link
  ada: string; // For caching
  parsel: string; // For caching
  onSubmit: (params: ManualImarParams) => void;
  isLoading?: boolean;
}

/**
 * İmar Manual Entry Component
 *
 * Allows users to manually enter TAKS, KAKS, and Kat Adedi
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

  // Initialize with cached data if available
  const {
    values,
    validation,
    isComplete,
    fieldErrors,
    setValue,
  } = useImarValidation({
    initialValues: cachedEntry?.imarData || {},
    validateOnChange: true,
  });

  // Local state for display strings (allows typing decimals like "0.")
  const [taksInput, setTaksInput] = useState(
    cachedEntry?.imarData?.taks !== undefined ? String(cachedEntry.imarData.taks) : ''
  );
  const [kaksInput, setKaksInput] = useState(
    cachedEntry?.imarData?.kaks !== undefined ? String(cachedEntry.imarData.kaks) : ''
  );
  const [katAdediInput, setKatAdediInput] = useState(
    cachedEntry?.imarData?.katAdedi !== undefined ? String(cachedEntry.imarData.katAdedi) : ''
  );

  const [showExplanation, setShowExplanation] = useState(false);
  const [showCachedNotice, setShowCachedNotice] = useState(false);

  // Show cached data notice on mount
  useEffect(() => {
    if (cachedEntry) {
      setShowCachedNotice(true);
      setTimeout(() => setShowCachedNotice(false), 5000);
    }
  }, [cachedEntry]);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!isComplete) {
      return;
    }

    const params = values as ManualImarParams;

    // Save to cache for future lookups
    saveEntry(ilce, ada, parsel, params, parselAlani);

    // Pass to parent
    onSubmit(params);
  };

  /**
   * Handle TAKS input change (display only, no validation)
   */
  const handleTaksChange = (inputValue: string) => {
    // Allow typing anything (including partial decimals like "0.")
    setTaksInput(inputValue);
  };

  /**
   * Handle TAKS blur (parse and validate)
   */
  const handleTaksBlur = () => {
    if (taksInput === '') {
      setValue('taks', undefined);
      return;
    }

    // Replace Turkish comma with period, then parse
    const normalized = taksInput.replace(',', '.');
    const numValue = parseFloat(normalized);

    if (!isNaN(numValue)) {
      setValue('taks', numValue);
      // Update display to show parsed number
      setTaksInput(String(numValue));
    }
  };

  /**
   * Handle KAKS input change (display only, no validation)
   */
  const handleKaksChange = (inputValue: string) => {
    setKaksInput(inputValue);
  };

  /**
   * Handle KAKS blur (parse and validate)
   */
  const handleKaksBlur = () => {
    if (kaksInput === '') {
      setValue('kaks', undefined);
      return;
    }

    const normalized = kaksInput.replace(',', '.');
    const numValue = parseFloat(normalized);

    if (!isNaN(numValue)) {
      setValue('kaks', numValue);
      setKaksInput(String(numValue));
    }
  };

  /**
   * Handle Kat Adedi input change (display only, no validation)
   */
  const handleKatAdediChange = (inputValue: string) => {
    setKatAdediInput(inputValue);
  };

  /**
   * Handle Kat Adedi blur (parse and validate)
   */
  const handleKatAdediBlur = () => {
    if (katAdediInput === '') {
      setValue('katAdedi', undefined);
      return;
    }

    const numValue = parseInt(katAdediInput, 10);

    if (!isNaN(numValue)) {
      setValue('katAdedi', numValue);
      setKatAdediInput(String(numValue));
    }
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
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="space-y-4">
            {/* TAKS Input */}
            <div>
              <label
                htmlFor="taks"
                className="block text-sm font-medium text-gray-700"
              >
                TAKS (Taban Alanı Katsayısı)
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  id="taks"
                  name="taks"
                  value={taksInput}
                  onChange={(e) => handleTaksChange(e.target.value)}
                  onBlur={handleTaksBlur}
                  placeholder={`örn: ${municipalityConfig.typicalTaks}`}
                  className={`block w-full rounded-lg border ${
                    fieldErrors.taks
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 shadow-sm focus:outline-none focus:ring-1`}
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-500">
                  (0.05 - 0.70)
                </span>
              </div>
              {fieldErrors.taks && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.taks}</p>
              )}
              <p className="mt-1 text-xs text-gray-600">
                Binanın zemin kat alanının parsel alanına oranı
              </p>
            </div>

            {/* KAKS Input */}
            <div>
              <label
                htmlFor="kaks"
                className="block text-sm font-medium text-gray-700"
              >
                KAKS / EMSAL (Kat Alanı Katsayısı)
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="text"
                  inputMode="decimal"
                  id="kaks"
                  name="kaks"
                  value={kaksInput}
                  onChange={(e) => handleKaksChange(e.target.value)}
                  onBlur={handleKaksBlur}
                  placeholder={`örn: ${municipalityConfig.typicalKaks}`}
                  className={`block w-full rounded-lg border ${
                    fieldErrors.kaks
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 shadow-sm focus:outline-none focus:ring-1`}
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-500">
                  (0.10 - 3.00)
                </span>
              </div>
              {fieldErrors.kaks && (
                <p className="mt-1 text-sm text-red-600">{fieldErrors.kaks}</p>
              )}
              <p className="mt-1 text-xs text-gray-600">
                Toplam inşaat alanının parsel alanına oranı
              </p>
            </div>

            {/* Kat Adedi Input */}
            <div>
              <label
                htmlFor="katAdedi"
                className="block text-sm font-medium text-gray-700"
              >
                Kat Adedi (Maksimum Kat Sayısı)
                <span className="ml-1 text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center">
                <input
                  type="text"
                  inputMode="numeric"
                  id="katAdedi"
                  name="katAdedi"
                  value={katAdediInput}
                  onChange={(e) => handleKatAdediChange(e.target.value)}
                  onBlur={handleKatAdediBlur}
                  placeholder={`örn: ${municipalityConfig.typicalKatAdedi}`}
                  className={`block w-full rounded-lg border ${
                    fieldErrors.katAdedi
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                  } px-3 py-2 shadow-sm focus:outline-none focus:ring-1`}
                  disabled={isLoading}
                />
                <span className="ml-2 text-sm text-gray-500">(1 - 15)</span>
              </div>
              {fieldErrors.katAdedi && (
                <p className="mt-1 text-sm text-red-600">
                  {fieldErrors.katAdedi}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-600">
                İzin verilen maksimum kat sayısı
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Preview */}
        <ImarPreview
          params={values}
          parselAlani={parselAlani}
          isValid={validation.isValid}
          errors={validation.errors.map((e) => e.message)}
          warnings={validation.warnings}
        />

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
