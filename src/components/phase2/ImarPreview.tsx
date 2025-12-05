/**
 * İmar Preview Component
 *
 * Shows real-time calculation preview as user enters İmar parameters
 * Displays calculated areas and validation status
 */

import type { ManualImarParams } from '../../utils/imarValidation';

export interface ImarPreviewProps {
  params: Partial<ManualImarParams>;
  parselAlani: number; // From TKGM
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Format number with Turkish locale
 */
function formatNumber(value: number | undefined, decimals: number = 2): string {
  if (value === undefined || isNaN(value)) {
    return '-';
  }
  return value.toLocaleString('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * ImarPreview Component
 *
 * Shows calculated buildable areas based on İmar parameters
 */
export function ImarPreview({
  params,
  parselAlani,
  isValid,
  errors,
  warnings,
}: ImarPreviewProps): JSX.Element {
  const { taks, kaks, katAdedi } = params;

  // Calculate derived values
  const tabanAlani =
    taks !== undefined && !isNaN(taks) ? parselAlani * taks : undefined;

  const toplamInsaatAlani =
    kaks !== undefined && !isNaN(kaks) ? parselAlani * kaks : undefined;

  const katBasinaAlan =
    tabanAlani !== undefined && katAdedi !== undefined && katAdedi > 0
      ? tabanAlani
      : undefined;

  const emsalDisiMax =
    toplamInsaatAlani !== undefined ? toplamInsaatAlani * 0.3 : undefined;

  const netKullanimAlani =
    toplamInsaatAlani !== undefined && emsalDisiMax !== undefined
      ? (toplamInsaatAlani - emsalDisiMax) * 0.85
      : undefined;

  // Show placeholder if no values entered yet
  const hasAnyValue =
    taks !== undefined || kaks !== undefined || katAdedi !== undefined;

  if (!hasAnyValue) {
    return (
      <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm font-medium">Hesaplama Önizlemesi</p>
          <p className="mt-1 text-xs">
            İmar bilgilerini girdikçe hesaplamalar burada görünecek
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Validation Status */}
      {isValid && (
        <div className="rounded-lg bg-green-50 p-4">
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
            <span className="ml-2 text-sm font-medium text-green-800">
              Bu değerler geçerli - hesaplama yapılabilir
            </span>
          </div>
        </div>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-red-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Hata{errors.length > 1 ? 'lar' : ''}:
              </h3>
              <ul className="mt-2 list-inside list-disc text-sm text-red-700">
                {errors.map((error, idx) => (
                  <li key={idx}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Uyarı:</h3>
              <ul className="mt-2 list-inside list-disc text-sm text-yellow-700">
                {warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Calculated Values */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Hesaplanan Alanlar
          </h3>
          <p className="mt-1 text-xs text-gray-600">
            Girilen İmar parametrelerine göre otomatik hesaplama
          </p>
        </div>

        <div className="divide-y divide-gray-200">
          {/* Parsel Alanı (input) */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-sm text-gray-600">Parsel Alanı</span>
                <span className="ml-2 text-xs text-gray-400">(TKGM)</span>
              </div>
              <span className="font-mono text-sm font-semibold text-gray-900">
                {formatNumber(parselAlani, 0)} m²
              </span>
            </div>
          </div>

          {/* Taban Alanı */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-900">Taban Alanı</span>
                {taks !== undefined && !isNaN(taks) && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatNumber(parselAlani, 0)} × {formatNumber(taks)})
                  </span>
                )}
              </div>
              <span
                className={`font-mono text-sm font-semibold ${
                  tabanAlani !== undefined ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                {formatNumber(tabanAlani, 2)} m²
              </span>
            </div>
          </div>

          {/* Toplam İnşaat Alanı */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-900">
                  Toplam İnşaat Alanı
                </span>
                {kaks !== undefined && !isNaN(kaks) && (
                  <span className="ml-2 text-xs text-gray-500">
                    ({formatNumber(parselAlani, 0)} × {formatNumber(kaks)})
                  </span>
                )}
              </div>
              <span
                className={`font-mono text-sm font-semibold ${
                  toplamInsaatAlani !== undefined
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {formatNumber(toplamInsaatAlani, 2)} m²
              </span>
            </div>
          </div>

          {/* Kat Adedi */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-900">Kat Adedi</span>
              <span
                className={`font-mono text-sm font-semibold ${
                  katAdedi !== undefined && !isNaN(katAdedi)
                    ? 'text-blue-600'
                    : 'text-gray-400'
                }`}
              >
                {katAdedi !== undefined && !isNaN(katAdedi)
                  ? Math.round(katAdedi)
                  : '-'}
              </span>
            </div>
          </div>

          {/* Kat Başına Alan */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Kat Başına Alan</span>
              <span
                className={`font-mono text-sm ${
                  katBasinaAlan !== undefined
                    ? 'text-gray-700'
                    : 'text-gray-400'
                }`}
              >
                {formatNumber(katBasinaAlan, 2)} m²
              </span>
            </div>
          </div>

          {/* Emsal Dışı Max */}
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm text-gray-600">Emsal Dışı Max</span>
                <span className="ml-2 text-xs text-gray-400">(30%)</span>
              </div>
              <span
                className={`font-mono text-sm ${
                  emsalDisiMax !== undefined ? 'text-gray-700' : 'text-gray-400'
                }`}
              >
                {formatNumber(emsalDisiMax, 2)} m²
              </span>
            </div>
          </div>

          {/* Net Kullanım Alanı */}
          <div className="bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-blue-900">
                  Net Kullanım Alanı
                </span>
                <span className="ml-2 text-xs text-blue-600">(~85%)</span>
              </div>
              <span
                className={`font-mono text-sm font-bold ${
                  netKullanimAlani !== undefined
                    ? 'text-blue-700'
                    : 'text-gray-400'
                }`}
              >
                {formatNumber(netKullanimAlani, 2)} m²
              </span>
            </div>
            <p className="mt-1 text-xs text-blue-700">
              Bu alan daire dağılımı için kullanılacak
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImarPreview;
