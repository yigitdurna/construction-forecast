import { DataSourceInfo, getConfidenceBadgeColor, getConfidenceLabelTR, formatDateTR } from '../utils/dataLoader';

interface DataSourceBadgeProps {
  dataSource: DataSourceInfo;
  compact?: boolean;
}

export function DataSourceBadge({ dataSource, compact = false }: DataSourceBadgeProps) {
  const badgeColor = getConfidenceBadgeColor(dataSource.confidenceLevel);
  const confidenceLabel = getConfidenceLabelTR(dataSource.confidenceLevel);

  if (compact) {
    return (
      <div className="group relative inline-block">
        <span
          className={`text-xs px-2 py-0.5 rounded ${badgeColor} cursor-help`}
          title="Veri kaynağı bilgisi için üzerine gelin"
        >
          {dataSource.isOutdated && '⚠️ '}
          Kaynak
        </span>

        {/* Tooltip */}
        <div className="invisible group-hover:visible absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-lg">
          <div className="space-y-2">
            <div>
              <div className="font-semibold text-yellow-300">Kaynak:</div>
              <div className="text-gray-200">{dataSource.source}</div>
            </div>
            <div>
              <div className="font-semibold text-yellow-300">Son Güncelleme:</div>
              <div className="text-gray-200">
                {formatDateTR(dataSource.lastUpdated)}
                {dataSource.isOutdated && (
                  <span className="text-red-300 ml-2">
                    ({dataSource.daysOld} gün önce)
                  </span>
                )}
              </div>
            </div>
            <div>
              <div className="font-semibold text-yellow-300">Güvenilirlik:</div>
              <div className="text-gray-200">{confidenceLabel}</div>
            </div>
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-block">
      <div
        className={`text-xs px-2 py-1 rounded-md ${badgeColor} cursor-help flex items-center gap-1`}
        title="Veri kaynağı detayları"
      >
        {dataSource.isOutdated && <span className="text-red-600">⚠️</span>}
        <span className="font-medium">{confidenceLabel}</span>
        <span className="text-gray-500">•</span>
        <span>{dataSource.daysOld}g</span>
      </div>

      {/* Detailed Tooltip */}
      <div className="invisible group-hover:visible absolute z-50 top-full left-0 mt-2 w-80 p-4 bg-gray-900 text-white text-xs rounded-lg shadow-xl">
        <div className="space-y-3">
          <div>
            <div className="font-semibold text-yellow-300 mb-1">📊 Veri Kaynağı</div>
            <div className="text-gray-200 leading-relaxed">{dataSource.source}</div>
          </div>

          <div className="border-t border-gray-700 pt-2">
            <div className="font-semibold text-yellow-300 mb-1">🕒 Son Güncelleme</div>
            <div className="text-gray-200">
              {formatDateTR(dataSource.lastUpdated)}
              <span className="text-gray-400 ml-2">
                ({dataSource.daysOld} gün önce)
              </span>
            </div>
          </div>

          <div className="border-t border-gray-700 pt-2">
            <div className="font-semibold text-yellow-300 mb-1">✓ Güvenilirlik Seviyesi</div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeColor}`}>
                {confidenceLabel}
              </span>
              <span className="text-gray-400 text-xs">
                {dataSource.confidenceLevel === 'high' && 'Doğrulanmış kaynak'}
                {dataSource.confidenceLevel === 'medium' && 'Piyasa tahmini'}
                {dataSource.confidenceLevel === 'low' && 'Sınırlı veri'}
              </span>
            </div>
          </div>

          {dataSource.isOutdated && (
            <div className="border-t border-gray-700 pt-2">
              <div className="bg-red-900/30 border border-red-700 rounded p-2">
                <div className="font-semibold text-red-300 mb-1">⚠️ Güncel Olmayan Veri</div>
                <div className="text-red-200 text-xs">
                  Bu veri 90 günden eski. Güncel piyasa koşullarını yansıtmayabilir.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Arrow */}
        <div className="absolute bottom-full left-4 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
      </div>
    </div>
  );
}
