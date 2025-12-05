/**
 * İmar Explanation Modal
 *
 * Educational modal explaining İmar terminology (TAKS, KAKS, Kat Adedi)
 * Helps users understand what they're entering
 */

import React from 'react';

export interface ImarExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * İmar Explanation Modal Component
 *
 * Provides clear explanations of zoning terms
 */
export function ImarExplanationModal({
  isOpen,
  onClose,
}: ImarExplanationModalProps): JSX.Element | null {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                İmar Bilgileri Nedir?
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Kapat"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {/* TAKS Explanation */}
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <h3 className="flex items-center text-lg font-semibold text-blue-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white">
                    1
                  </span>
                  <span className="ml-3">TAKS (Taban Alanı Kat Sayısı)</span>
                </h3>
                <div className="mt-3 space-y-2 text-sm text-blue-800">
                  <p className="font-medium">Bina taban alanının parsel alanına oranı</p>
                  <p>
                    Arsanızın ne kadarının bina tabanı ile kaplanabileceğini gösterir.
                  </p>
                  <div className="mt-2 rounded bg-white p-3">
                    <p className="font-mono text-sm text-gray-700">
                      <strong>Örnek:</strong> 1,000 m² arsa, TAKS = 0.30
                    </p>
                    <p className="mt-1 font-mono text-sm text-blue-600">
                      → Taban Alanı = 1,000 × 0.30 = 300 m²
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                      Binanızın zemin katı maksimum 300 m² olabilir
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-blue-700">
                    <strong>Tipik değerler:</strong> Villa: 0.30, Apartman: 0.25-0.35
                  </div>
                </div>
              </div>

              {/* KAKS Explanation */}
              <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                <h3 className="flex items-center text-lg font-semibold text-green-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-white">
                    2
                  </span>
                  <span className="ml-3">KAKS / EMSAL (Kat Alanı Kat Sayısı)</span>
                </h3>
                <div className="mt-3 space-y-2 text-sm text-green-800">
                  <p className="font-medium">
                    Toplam inşaat alanının parsel alanına oranı
                  </p>
                  <p>
                    Arsanızda toplam kaç m² inşaat yapabileceğinizi gösterir.
                  </p>
                  <div className="mt-2 rounded bg-white p-3">
                    <p className="font-mono text-sm text-gray-700">
                      <strong>Örnek:</strong> 1,000 m² arsa, KAKS = 0.60
                    </p>
                    <p className="mt-1 font-mono text-sm text-green-600">
                      → Toplam İnşaat = 1,000 × 0.60 = 600 m²
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                      Tüm katların toplamı maksimum 600 m² olabilir
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-green-700">
                    <strong>Tipik değerler:</strong> Villa: 0.60, Düşük katlı: 1.05, Orta
                    katlı: 1.50
                  </div>
                  <div className="mt-2 rounded-lg bg-green-100 p-2 text-xs">
                    <strong>Not:</strong> KAKS ve EMSAL aynı anlama gelir. Belediye
                    belgelerinde ikisi de kullanılır.
                  </div>
                </div>
              </div>

              {/* Kat Adedi Explanation */}
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                <h3 className="flex items-center text-lg font-semibold text-purple-900">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white">
                    3
                  </span>
                  <span className="ml-3">Kat Adedi (Maksimum Kat Sayısı)</span>
                </h3>
                <div className="mt-3 space-y-2 text-sm text-purple-800">
                  <p className="font-medium">Yapılabilecek maksimum kat sayısı</p>
                  <p>İmar planında belirtilen azami kat sayısı limiti.</p>
                  <div className="mt-2 rounded bg-white p-3">
                    <p className="font-mono text-sm text-gray-700">
                      <strong>Örnek:</strong> TAKS = 0.30, KAKS = 0.60, Kat Adedi = 2
                    </p>
                    <p className="mt-1 font-mono text-sm text-purple-600">
                      → Zemin + 1 Normal Kat = 2 Kat
                    </p>
                    <p className="mt-2 text-xs text-gray-600">
                      Her kat yaklaşık 300 m² (TAKS = Taban alanı)
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-purple-700">
                    <strong>Tipik değerler:</strong> Villa: 2, Düşük katlı: 3-4, Orta
                    katlı: 5-8
                  </div>
                  <div className="mt-2 rounded-lg bg-purple-100 p-2 text-xs">
                    <strong>İlişki:</strong> Kat Adedi ≈ KAKS ÷ TAKS (genellikle)
                  </div>
                </div>
              </div>

              {/* Where to find info */}
              <div className="rounded-lg border-2 border-yellow-300 bg-yellow-50 p-4">
                <h3 className="flex items-center text-base font-semibold text-yellow-900">
                  <svg
                    className="mr-2 h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Bu bilgileri nerede bulabilirim?
                </h3>
                <div className="mt-3 space-y-2 text-sm text-yellow-800">
                  <p>
                    <strong>İmar Durumu Belgesi:</strong> Belediye'nin online İmar
                    Sorgu sisteminden alabilirsiniz.
                  </p>
                  <ol className="ml-4 mt-2 list-decimal space-y-1 text-xs">
                    <li>İlçenize ait belediye İmar sorgu sayfasına gidin</li>
                    <li>Ada ve Parsel numaranızı girin</li>
                    <li>İmar Durumu Belgesi'nde şu değerleri bulun:</li>
                    <ul className="ml-4 mt-1 list-disc">
                      <li>TAKS (Taban Alanı Katsayısı)</li>
                      <li>KAKS veya EMSAL (İmar Katsayısı)</li>
                      <li>Kat Adedi veya Max. Kat Sayısı</li>
                    </ul>
                    <li>Bu değerleri uygulamamıza girin</li>
                  </ol>
                </div>
              </div>

              {/* Example scenarios */}
              <div className="rounded-lg bg-gray-50 p-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Örnek Senaryolar
                </h3>
                <div className="mt-3 space-y-3">
                  {/* Villa example */}
                  <div className="rounded border border-gray-200 bg-white p-3">
                    <p className="font-semibold text-gray-900">Villa Projesi</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">TAKS:</span>
                        <span className="ml-1 font-mono font-semibold">0.30</span>
                      </div>
                      <div>
                        <span className="text-gray-600">KAKS:</span>
                        <span className="ml-1 font-mono font-semibold">0.60</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kat:</span>
                        <span className="ml-1 font-mono font-semibold">2</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      1,000 m² arsada → 300 m² taban, 600 m² toplam, 2 katlı
                    </p>
                  </div>

                  {/* Apartment example */}
                  <div className="rounded border border-gray-200 bg-white p-3">
                    <p className="font-semibold text-gray-900">Apartman Projesi</p>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-gray-600">TAKS:</span>
                        <span className="ml-1 font-mono font-semibold">0.35</span>
                      </div>
                      <div>
                        <span className="text-gray-600">KAKS:</span>
                        <span className="ml-1 font-mono font-semibold">1.05</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Kat:</span>
                        <span className="ml-1 font-mono font-semibold">3</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs text-gray-600">
                      2,000 m² arsada → 700 m² taban, 2,100 m² toplam, 3 katlı
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 px-6 py-4">
            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Anladım
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ImarExplanationModal;
