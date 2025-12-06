/**
 * Bodrum Kat Configuration Panel
 *
 * Phase 3.2 - Allow users to configure basement usage type
 * Affects sellable area calculation and unit count
 */

import type { BodrumConfig, BodrumUsage } from '../../utils/imarCalculations';
import { getBodrumUsageLabel } from '../../utils/imarCalculations';

export interface BodrumConfigPanelProps {
  config: BodrumConfig;
  tabanAlani: number; // Default bodrum area = taban alanı
  onChange: (config: BodrumConfig) => void;
  className?: string;
}

/**
 * Bodrum Kat Configuration Panel
 *
 * Allows users to enable/disable bodrum and select usage type
 */
export function BodrumConfigPanel({
  config,
  tabanAlani,
  onChange,
  className = '',
}: BodrumConfigPanelProps): JSX.Element {
  const usageOptions: Array<{ value: BodrumUsage; info: string }> = [
    {
      value: 'otopark',
      info: 'Emsal dışı - Satılamaz, inşaat alanına eklenir',
    },
    {
      value: 'depo',
      info: 'Emsal dışı - Satılamaz, inşaat alanına eklenir',
    },
    {
      value: 'ticaret',
      info: 'Satılabilir - Dükkan/mağaza olarak değerlendirilebilir',
    },
    {
      value: 'konut',
      info: 'Satılabilir - Daire olarak değerlendirilebilir',
    },
  ];

  const handleToggle = (enabled: boolean) => {
    onChange({
      ...config,
      enabled,
      // If enabling for first time, set default area
      area: enabled && !config.area ? tabanAlani : config.area,
    });
  };

  const handleUsageChange = (usage: BodrumUsage) => {
    onChange({
      ...config,
      usage,
    });
  };

  const handleAreaChange = (value: string) => {
    if (value === '') {
      onChange({
        ...config,
        area: 0,
      });
      return;
    }
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed >= 0) {
      onChange({
        ...config,
        area: parsed,
      });
    }
  };

  const handleAreaBlur = (value: string) => {
    if (value === '' || isNaN(parseFloat(value))) {
      onChange({
        ...config,
        area: tabanAlani,
      });
    }
  };

  return (
    <div className={`rounded-lg border bg-white ${className}`}>
      {/* Header with toggle */}
      <div className="flex items-center justify-between border-b border-gray-200 p-4">
        <div className="flex-1">
          <h4 className="text-md font-semibold text-gray-900">
            Bodrum Kat (Opsiyonel)
          </h4>
          <p className="mt-1 text-sm text-gray-600">
            Bodrum katı kullanım amacına göre yapılandırın
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleToggle(!config.enabled)}
          className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            config.enabled ? 'bg-blue-600' : 'bg-gray-200'
          }`}
          role="switch"
          aria-checked={config.enabled}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              config.enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Configuration (shown when enabled) */}
      {config.enabled && (
        <div className="space-y-4 p-4">
          {/* Usage type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kullanım Amacı
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {usageOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleUsageChange(option.value)}
                  className={`relative rounded-lg border-2 p-3 text-left transition-all ${
                    config.usage === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start">
                    <div className="flex-1">
                      <p
                        className={`text-sm font-semibold ${
                          config.usage === option.value
                            ? 'text-blue-900'
                            : 'text-gray-900'
                        }`}
                      >
                        {getBodrumUsageLabel(option.value)}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          config.usage === option.value
                            ? 'text-blue-700'
                            : 'text-gray-600'
                        }`}
                      >
                        {option.info}
                      </p>
                    </div>
                    {config.usage === option.value && (
                      <svg
                        className="h-5 w-5 text-blue-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Area input */}
          <div>
            <label
              htmlFor="bodrum-area"
              className="block text-sm font-medium text-gray-700"
            >
              Bodrum Alanı
            </label>
            <div className="mt-1 relative rounded-lg shadow-sm">
              <input
                type="number"
                id="bodrum-area"
                value={(config.area || 0) === 0 ? '' : (config.area || tabanAlani)}
                onChange={(e) => handleAreaChange(e.target.value)}
                onBlur={(e) => handleAreaBlur(e.target.value)}
                min={0}
                max={tabanAlani * 1.5} // Allow up to 150% of taban alanı
                step={0.1}
                placeholder="0"
                className="block w-full rounded-lg border-gray-300 pr-12 focus:border-blue-500 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">m²</span>
              </div>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Varsayılan: {tabanAlani.toFixed(1)} m² (= Taban Alanı)
            </p>
          </div>

          {/* Info based on usage type */}
          <div
            className={`rounded-lg p-3 ${
              config.usage === 'konut' || config.usage === 'ticaret'
                ? 'bg-green-50 border border-green-200'
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            {config.usage === 'konut' && (
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Bodrum konut alanı daire sayısını artırır
                  </p>
                  <p className="mt-1 text-xs text-green-700">
                    Bu alan satılabilir net alana eklenir ve daha fazla daire
                    yapılmasına olanak tanır (1+0 veya 1+1).
                  </p>
                </div>
              </div>
            )}

            {config.usage === 'ticaret' && (
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Bodrum ticari alan ek gelir sağlar
                  </p>
                  <p className="mt-1 text-xs text-green-700">
                    Dükkan/mağaza olarak satılabilir veya kiralanabilir. Yüksek
                    m² fiyatı ile değerlendirilir.
                  </p>
                </div>
              </div>
            )}

            {(config.usage === 'otopark' || config.usage === 'depo') && (
              <div className="flex items-start gap-2">
                <svg
                  className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Emsal dışı alan - Satılmaz
                  </p>
                  <p className="mt-1 text-xs text-gray-700">
                    Bu alan toplam inşaat alanına eklenir ancak satılabilir net
                    alana dahil edilmez. Yasal olarak %30'a kadar emsal dışı
                    alan yapılabilir.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default BodrumConfigPanel;
