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
import { DecimalInput } from '../ui/DecimalInput';
import { IMAR_VALIDATION } from '../../config/validationRules';
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
            <DecimalInput
              value={values.taks}
              onChange={(val) => setValue('taks', val ?? undefined)}
              min={IMAR_VALIDATION.taks.min}
              max={IMAR_VALIDATION.taks.max}
              step={IMAR_VALIDATION.taks.step}
              placeholder={`örn: ${municipalityConfig.typicalTaks}`}
              label="TAKS (Taban Alanı Kat Sayısı)"
              error={fieldErrors.taks}
              disabled={isLoading}
              required
            />

            {/* KAKS Input */}
            <DecimalInput
              value={values.kaks}
              onChange={(val) => setValue('kaks', val ?? undefined)}
              min={IMAR_VALIDATION.kaks.min}
              max={IMAR_VALIDATION.kaks.max}
              step={IMAR_VALIDATION.kaks.step}
              placeholder={`örn: ${municipalityConfig.typicalKaks}`}
              label="KAKS / Emsal"
              error={fieldErrors.kaks}
              disabled={isLoading}
              required
            />

            {/* Kat Adedi Input */}
            <DecimalInput
              value={values.katAdedi}
              onChange={(val) => setValue('katAdedi', val ?? undefined)}
              min={IMAR_VALIDATION.katAdedi.min}
              max={IMAR_VALIDATION.katAdedi.max}
              step={IMAR_VALIDATION.katAdedi.step}
              placeholder={`örn: ${municipalityConfig.typicalKatAdedi}`}
              label="Yençok (Kat Adedi)"
              error={fieldErrors.katAdedi}
              disabled={isLoading}
              required
            />
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
