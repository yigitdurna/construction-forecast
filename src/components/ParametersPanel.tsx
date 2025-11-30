import { useState } from 'react';
import { CostParameter } from '../types/costParameters';
import { SalesParameter } from '../types/salesParameters';
import { QualityLevel } from '../types';
import { formatNumber } from '../utils/calculations';

interface ParametersPanelProps {
  timelineParams: {
    constructionMonths: number;
    monthlyInflationRate: number;
    monthlyAppreciationRate: number;
  };
  costParameters: CostParameter[];
  salesParameters: SalesParameter[];
  qualityLevel: QualityLevel;
  onTimelineChange: (key: string, value: number) => void;
  onCostParameterChange: (id: string, value: number | null) => void;
  onSalesParameterChange: (id: string, value: number | null) => void;
  onResetAll: () => void;
}

export function ParametersPanel({
  timelineParams,
  costParameters,
  salesParameters,
  qualityLevel,
  onTimelineChange,
  onCostParameterChange,
  onSalesParameterChange,
  onResetAll,
}: ParametersPanelProps) {
  // Start with all sections collapsed for cleaner UI
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const costCategories = groupBy(costParameters, 'category');

  return (
    <div className="bg-white rounded-lg border">
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          ⚙️ Parametreler
        </h3>
        <button
          onClick={onResetAll}
          className="text-sm text-gray-500 hover:text-red-600"
        >
          Tümünü Sıfırla
        </button>
      </div>

      <div className="divide-y">
        {/* Timeline Parameters */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('timeline')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-blue-600 transition-colors mb-3"
          >
            <span className="flex items-center gap-2">
              {expandedSections.has('timeline') ? '▼' : '▶'} Zaman ve Enflasyon
            </span>
          </button>

          {expandedSections.has('timeline') && (
            <div className="space-y-3">
              <ParameterRow
                label="Aylık Enflasyon"
                value={timelineParams.monthlyInflationRate * 100}
                unit="%"
                source="Varsayılan"
                editable={true}
                min={0}
                max={10}
                step={0.1}
                onChange={(value) => onTimelineChange('monthlyInflationRate', value / 100)}
              />

              <ParameterRow
                label="Aylık Fiyat Artışı"
                value={timelineParams.monthlyAppreciationRate * 100}
                unit="%"
                source="Varsayılan"
                editable={true}
                min={-5}
                max={10}
                step={0.1}
                onChange={(value) => onTimelineChange('monthlyAppreciationRate', value / 100)}
              />
            </div>
          )}
        </div>

        {/* Structure Costs (Kaba Yapı) */}
        <CostCategorySection
          title="Kaba Yapı"
          icon="🏗️"
          sectionKey="structure"
          isExpanded={expandedSections.has('structure')}
          onToggle={() => toggleSection('structure')}
          parameters={costCategories['structure'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Envelope Costs (Dış Cephe) */}
        <CostCategorySection
          title="Dış Cephe"
          icon="🧱"
          sectionKey="envelope"
          isExpanded={expandedSections.has('envelope')}
          onToggle={() => toggleSection('envelope')}
          parameters={costCategories['envelope'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* MEP Costs */}
        <CostCategorySection
          title="MEP (Mekanik/Elektrik)"
          icon="⚡"
          sectionKey="mep"
          isExpanded={expandedSections.has('mep')}
          onToggle={() => toggleSection('mep')}
          parameters={costCategories['mep'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Interior Costs */}
        <CostCategorySection
          title="İç Mekan"
          icon="🏠"
          sectionKey="interior"
          isExpanded={expandedSections.has('interior')}
          onToggle={() => toggleSection('interior')}
          parameters={costCategories['interior'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Site Costs */}
        <CostCategorySection
          title="Saha İşleri"
          icon="🌳"
          sectionKey="site"
          isExpanded={expandedSections.has('site')}
          onToggle={() => toggleSection('site')}
          parameters={costCategories['site'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Soft Costs */}
        <CostCategorySection
          title="Yumuşak Maliyetler"
          icon="📋"
          sectionKey="soft"
          isExpanded={expandedSections.has('soft')}
          onToggle={() => toggleSection('soft')}
          parameters={costCategories['soft'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Financial Parameters */}
        <CostCategorySection
          title="Finansal"
          icon="💰"
          sectionKey="financial"
          isExpanded={expandedSections.has('financial')}
          onToggle={() => toggleSection('financial')}
          parameters={costCategories['financial'] || []}
          qualityLevel={qualityLevel}
          onParameterChange={onCostParameterChange}
        />

        {/* Sales Parameters */}
        <div className="p-4">
          <button
            onClick={() => toggleSection('sales')}
            className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-blue-600 transition-colors mb-3"
          >
            <span className="flex items-center gap-2">
              {expandedSections.has('sales') ? '▼' : '▶'} Satış Parametreleri
            </span>
          </button>

          {expandedSections.has('sales') && (
            <div className="space-y-3">
              {salesParameters.map(param => (
                <SalesParameterRow
                  key={param.id}
                  parameter={param}
                  onChange={(value) => onSalesParameterChange(param.id, value)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ParameterRow({
  label,
  value,
  unit,
  source,
  editable,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  unit: string;
  source: string;
  editable: boolean;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (value: number) => void;
}) {
  return (
    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
      <div className="flex-1">
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange?.(parseFloat(e.target.value) || 0)}
          disabled={!editable}
          min={min}
          max={max}
          step={step || 1}
          className={`w-20 border rounded px-2 py-1 text-right text-sm ${
            editable ? 'border-gray-300' : 'border-gray-200 bg-gray-50'
          }`}
        />
        <span className="text-sm text-gray-500 w-6">{unit}</span>
        <span className="text-xs text-gray-400">Kaynak: {source}</span>
      </div>
    </div>
  );
}

function CostParameterRow({
  parameter,
  qualityLevel,
  onChange,
}: {
  parameter: CostParameter;
  qualityLevel: QualityLevel;
  onChange: (value: number | null) => void;
}) {
  const range = parameter.rangeByQuality[qualityLevel];
  const isUserOverride = parameter.userValue !== null;

  return (
    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{parameter.labelTR}</span>
          {isUserOverride && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Kullanıcı</span>
          )}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          Aralık: {formatNumber(range.min)} - {formatNumber(range.max)}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={parameter.effectiveValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? null : val);
          }}
          min={range.min}
          max={range.max}
          step={parameter.unit === '%' ? 0.1 : parameter.unit === 'TL' ? 1000 : 1}
          className={`w-24 border rounded px-2 py-1 text-right text-sm ${
            isUserOverride ? 'border-blue-400 bg-blue-50' : ''
          }`}
        />
        <span className="text-sm text-gray-500 w-8">{parameter.unit}</span>

        {isUserOverride && (
          <button
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-500 text-sm"
            title="Varsayılana dön"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function SalesParameterRow({
  parameter,
  onChange,
}: {
  parameter: SalesParameter;
  onChange: (value: number | null) => void;
}) {
  const isUserOverride = parameter.userValue !== null;

  const getSourceLabel = (source: string) => {
    switch (source) {
      case 'district_data':
        return 'Bölge Verisi';
      case 'user':
        return 'Kullanıcı';
      case 'calculated':
        return 'Hesaplanan';
      default:
        return 'Varsayılan';
    }
  };

  return (
    <div className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{parameter.labelTR}</span>
          {isUserOverride && (
            <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">Üzerine Yazıldı</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={parameter.effectiveValue}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            onChange(isNaN(val) ? null : val);
          }}
          min={parameter.min}
          max={parameter.max}
          step={parameter.unit === '%' ? 0.1 : parameter.unit === 'x' ? 0.01 : 1000}
          disabled={!parameter.editable}
          className={`w-24 border rounded px-2 py-1 text-right text-sm ${
            isUserOverride
              ? 'border-blue-400 bg-blue-50'
              : parameter.editable
              ? 'border-gray-300'
              : 'border-gray-200 bg-gray-50'
          }`}
        />
        <span className="text-sm text-gray-500 w-8">{parameter.unit}</span>
        <span className="text-xs text-gray-400">Kaynak: {getSourceLabel(parameter.source)}</span>

        {isUserOverride && (
          <button
            onClick={() => onChange(null)}
            className="text-gray-400 hover:text-red-500 text-sm"
            title="Varsayılana dön"
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
}

function CostCategorySection({
  title,
  icon,
  sectionKey,
  isExpanded,
  onToggle,
  parameters,
  qualityLevel,
  onParameterChange,
}: {
  title: string;
  icon: string;
  sectionKey: string;
  isExpanded: boolean;
  onToggle: () => void;
  parameters: CostParameter[];
  qualityLevel: QualityLevel;
  onParameterChange: (id: string, value: number | null) => void;
}) {
  if (parameters.length === 0) return null;

  // Calculate category total
  const categoryTotal = parameters.reduce((sum, p) => sum + p.effectiveValue, 0);

  return (
    <div className="p-4">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full text-left font-medium text-gray-700 hover:text-blue-600 transition-colors mb-3"
      >
        <span className="flex items-center gap-2">
          {isExpanded ? '▼' : '▶'} {icon} {title}
          <span className="text-xs text-gray-400">({parameters.length} parametre)</span>
        </span>
      </button>

      {isExpanded && (
        <div className="space-y-3">
          {parameters.map(param => (
            <CostParameterRow
              key={param.id}
              parameter={param}
              qualityLevel={qualityLevel}
              onChange={(value) => onParameterChange(param.id, value)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function groupBy<T, K extends keyof T>(array: T[], key: K): Record<string, T[]> {
  return array.reduce((result, item) => {
    const groupKey = String(item[key]);
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {} as Record<string, T[]>);
}
