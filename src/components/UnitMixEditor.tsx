/**
 * Unit Mix Editor Component
 * 
 * Allows users to:
 * - View auto-optimized unit mix for maximum profitability
 * - Manually adjust unit counts and sizes
 * - See real-time revenue calculations per unit type
 */

import { useState, useEffect, useMemo } from 'react';
import { ProjectType, UnitMixConfig } from '../types';
import { getUnitTypesForProject } from '../data/unitTypes';
import { 
  calculateOptimalUnitMix, 
  calculateCustomUnitMix, 
  validateUnitMix,
  getOptimizationSuggestions 
} from '../utils/unitMixCalculator';

interface UnitMixEditorProps {
  totalSqm: number;
  projectType: ProjectType;
  location: string;
  basePricePerSqm: number;
  onMixChange?: (mix: UnitMixConfig) => void;
}

// Format currency in Turkish Lira
function formatCurrency(value: number): string {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M ₺`;
  }
  return value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 });
}

export function UnitMixEditor({
  totalSqm,
  projectType,
  location,
  basePricePerSqm,
  onMixChange,
}: UnitMixEditorProps) {
  const [isAutoMode, setIsAutoMode] = useState(true);
  const [customUnits, setCustomUnits] = useState<Array<{ unitTypeId: string; count: number; sizePerUnit: number }>>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Get available unit types for this project
  const availableUnitTypes = useMemo(() => 
    getUnitTypesForProject(projectType), 
    [projectType]
  );
  
  // Calculate optimal mix
  const optimalMix = useMemo(() => 
    calculateOptimalUnitMix(totalSqm, projectType, location, basePricePerSqm),
    [totalSqm, projectType, location, basePricePerSqm]
  );
  
  // Calculate custom mix when in manual mode
  const customMix = useMemo(() => {
    if (isAutoMode || customUnits.length === 0) return null;
    return calculateCustomUnitMix(customUnits, projectType, basePricePerSqm);
  }, [isAutoMode, customUnits, projectType, basePricePerSqm]);
  
  // Active mix is either optimal or custom
  const activeMix = isAutoMode ? optimalMix : (customMix || optimalMix);
  
  // Validation
  const validation = useMemo(() => 
    validateUnitMix(activeMix, totalSqm),
    [activeMix, totalSqm]
  );
  
  // Suggestions for improvement (only in manual mode)
  const suggestions = useMemo(() => {
    if (isAutoMode || !customMix) return [];
    return getOptimizationSuggestions(customMix, optimalMix);
  }, [isAutoMode, customMix, optimalMix]);
  
  // Initialize custom units from optimal mix when switching to manual
  useEffect(() => {
    if (!isAutoMode && customUnits.length === 0) {
      setCustomUnits(optimalMix.units.map(u => ({
        unitTypeId: u.unitTypeId,
        count: u.count,
        sizePerUnit: u.sizePerUnit,
      })));
    }
  }, [isAutoMode, optimalMix.units, customUnits.length]);
  
  // Notify parent of changes
  useEffect(() => {
    if (onMixChange) {
      onMixChange(activeMix);
    }
  }, [activeMix, onMixChange]);
  
  // Handle unit count change
  const handleUnitChange = (unitTypeId: string, field: 'count' | 'sizePerUnit', value: number) => {
    setCustomUnits(prev => {
      const existing = prev.find(u => u.unitTypeId === unitTypeId);
      if (existing) {
        return prev.map(u => 
          u.unitTypeId === unitTypeId ? { ...u, [field]: value } : u
        );
      }
      const unitType = availableUnitTypes.find(ut => ut.id === unitTypeId);
      if (!unitType) return prev;
      return [...prev, { 
        unitTypeId, 
        count: field === 'count' ? value : 0,
        sizePerUnit: field === 'sizePerUnit' ? value : unitType.avgSize 
      }];
    });
  };
  
  // Add a new unit type to custom mix
  const addUnitType = (unitTypeId: string) => {
    const unitType = availableUnitTypes.find(ut => ut.id === unitTypeId);
    if (!unitType) return;
    
    setCustomUnits(prev => {
      if (prev.find(u => u.unitTypeId === unitTypeId)) return prev;
      return [...prev, { 
        unitTypeId, 
        count: 1,
        sizePerUnit: unitType.avgSize 
      }];
    });
  };
  
  // Remove a unit type from custom mix
  const removeUnitType = (unitTypeId: string) => {
    setCustomUnits(prev => prev.filter(u => u.unitTypeId !== unitTypeId));
  };
  
  // Reset to optimal
  const resetToOptimal = () => {
    setIsAutoMode(true);
    setCustomUnits([]);
  };
  
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="text-xl">🏢</span>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800">Daire/Birim Dağılımı</h3>
            <p className="text-xs text-gray-500">
              {activeMix.totalUnits} birim • Ort. {activeMix.averageUnitSize.toFixed(0)} m²
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-indigo-600">
            {formatCurrency(activeMix.totalEstimatedRevenue)}
          </span>
          <span className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>
      
      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAutoMode(true)}
                className={`px-3 py-1.5 text-sm rounded-l-lg border transition-colors ${
                  isAutoMode 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                🎯 Otomatik Optimize
              </button>
              <button
                onClick={() => setIsAutoMode(false)}
                className={`px-3 py-1.5 text-sm rounded-r-lg border-t border-r border-b transition-colors ${
                  !isAutoMode 
                    ? 'bg-indigo-600 text-white border-indigo-600' 
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                ✏️ Manuel
              </button>
            </div>
            {!isAutoMode && (
              <button
                onClick={resetToOptimal}
                className="text-xs text-indigo-600 hover:text-indigo-800"
              >
                Optimize'a Dön
              </button>
            )}
          </div>
          
          {/* Validation Status */}
          <div className={`text-xs px-3 py-2 rounded-lg ${
            validation.isValid 
              ? 'bg-green-50 text-green-700' 
              : 'bg-yellow-50 text-yellow-700'
          }`}>
            {validation.message}
          </div>
          
          {/* Unit Mix Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-2 font-medium">Birim Tipi</th>
                  <th className="pb-2 font-medium text-center">Adet</th>
                  <th className="pb-2 font-medium text-center">m²/Birim</th>
                  <th className="pb-2 font-medium text-right">Toplam m²</th>
                  <th className="pb-2 font-medium text-right">₺/m²</th>
                  <th className="pb-2 font-medium text-right">Gelir</th>
                  {!isAutoMode && <th className="pb-2 w-8"></th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeMix.units.map((unit) => {
                  const unitType = availableUnitTypes.find(ut => ut.id === unit.unitTypeId);
                  const customUnit = customUnits.find(cu => cu.unitTypeId === unit.unitTypeId);
                  
                  return (
                    <tr key={unit.unitTypeId} className="hover:bg-gray-50">
                      <td className="py-2">
                        <div>
                          <span className="font-medium">{unit.label}</span>
                          {unitType && (
                            <span className="text-xs text-gray-400 ml-1">
                              ({unitType.priceMultiplier > 1 ? '+' : ''}{((unitType.priceMultiplier - 1) * 100).toFixed(0)}%)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 text-center">
                        {isAutoMode ? (
                          <span>{unit.count}</span>
                        ) : (
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={customUnit?.count ?? unit.count}
                            onChange={(e) => handleUnitChange(unit.unitTypeId, 'count', parseInt(e.target.value) || 0)}
                            className="w-16 px-2 py-1 text-center border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        )}
                      </td>
                      <td className="py-2 text-center">
                        {isAutoMode ? (
                          <span>{unit.sizePerUnit}</span>
                        ) : (
                          <input
                            type="number"
                            min={unitType?.minSize ?? 30}
                            max={unitType?.maxSize ?? 500}
                            value={customUnit?.sizePerUnit ?? unit.sizePerUnit}
                            onChange={(e) => handleUnitChange(unit.unitTypeId, 'sizePerUnit', parseInt(e.target.value) || unitType?.avgSize || 100)}
                            className="w-16 px-2 py-1 text-center border rounded focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                          />
                        )}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {unit.totalSqm.toLocaleString('tr-TR')}
                      </td>
                      <td className="py-2 text-right text-gray-600">
                        {unit.pricePerSqm.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-2 text-right font-medium text-green-600">
                        {formatCurrency(unit.estimatedRevenue)}
                      </td>
                      {!isAutoMode && (
                        <td className="py-2 text-center">
                          <button
                            onClick={() => removeUnitType(unit.unitTypeId)}
                            className="text-red-400 hover:text-red-600"
                            title="Kaldır"
                          >
                            ✕
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t-2 border-gray-200 font-medium">
                <tr>
                  <td className="pt-2">Toplam</td>
                  <td className="pt-2 text-center">{activeMix.totalUnits}</td>
                  <td className="pt-2 text-center">{activeMix.averageUnitSize.toFixed(0)}</td>
                  <td className="pt-2 text-right">{activeMix.totalSqm.toLocaleString('tr-TR')}</td>
                  <td className="pt-2 text-right">-</td>
                  <td className="pt-2 text-right text-green-600">{formatCurrency(activeMix.totalEstimatedRevenue)}</td>
                  {!isAutoMode && <td></td>}
                </tr>
              </tfoot>
            </table>
          </div>
          
          {/* Add Unit Type (Manual Mode) */}
          {!isAutoMode && (
            <div className="pt-2 border-t">
              <p className="text-xs text-gray-500 mb-2">Birim tipi ekle:</p>
              <div className="flex flex-wrap gap-2">
                {availableUnitTypes
                  .filter(ut => !customUnits.find(cu => cu.unitTypeId === ut.id))
                  .map(ut => (
                    <button
                      key={ut.id}
                      onClick={() => addUnitType(ut.id)}
                      className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    >
                      + {ut.labelTR}
                    </button>
                  ))
                }
              </div>
            </div>
          )}
          
          {/* Suggestions (Manual Mode) */}
          {!isAutoMode && suggestions.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-700 mb-1">💡 Optimizasyon Önerileri:</p>
              <ul className="text-xs text-blue-600 space-y-1">
                {suggestions.map((s, i) => (
                  <li key={i}>• {s}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Visual Distribution */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 mb-2">Alan Dağılımı:</p>
            <div className="flex h-6 rounded-lg overflow-hidden">
              {activeMix.units.map((unit, index) => {
                const percent = (unit.totalSqm / activeMix.totalSqm) * 100;
                const colors = [
                  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
                  'bg-blue-500', 'bg-teal-500', 'bg-green-500'
                ];
                return (
                  <div
                    key={unit.unitTypeId}
                    className={`${colors[index % colors.length]} relative group`}
                    style={{ width: `${percent}%` }}
                    title={`${unit.label}: ${percent.toFixed(1)}%`}
                  >
                    {percent > 15 && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                        {unit.label}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {activeMix.units.map((unit, index) => {
                const percent = (unit.totalSqm / activeMix.totalSqm) * 100;
                const colors = [
                  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 
                  'bg-blue-500', 'bg-teal-500', 'bg-green-500'
                ];
                return (
                  <div key={unit.unitTypeId} className="flex items-center gap-1 text-xs">
                    <div className={`w-3 h-3 rounded ${colors[index % colors.length]}`}></div>
                    <span className="text-gray-600">{unit.label} ({percent.toFixed(0)}%)</span>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Info Box */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <p className="font-medium mb-1">ℹ️ Birim Fiyatlandırma Hakkında:</p>
            <ul className="space-y-1">
              <li>• Küçük birimler (1+1, 2+1) genellikle m² başına %5-15 daha yüksek fiyatlanır</li>
              <li>• Büyük birimler (4+1, villa) m² başına daha düşük ama toplam değer daha yüksek olabilir</li>
              <li>• {location} bölgesi için talep ve fiyat çarpanları uygulanmıştır</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

export default UnitMixEditor;
