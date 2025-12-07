# Construction Forecast - Implementation Plan (REVISED)

**Date**: December 7, 2025
**Status**: Awaiting Approval
**Scope**: Accurate Calculations + Editable Parameters + Research-Based Costs

---

## Executive Summary

This revised plan focuses on:
1. **Accurate calculations** - No presets, user enters exact values from their İmar Durumu
2. **Çıkma is editable** - User must enter from their specific parcel (varies by project)
3. **TL is primary currency** - Foreign currency only as background reference
4. **All parameters editable** - With source indicators showing where data came from
5. **Research-based costs** - Material-level pricing from official Turkish sources

**Critical Constraint**: Çıkma formula (`parsel × KAKS × çıkma`) remains unchanged.

---

## Phase A: Input Simplification (No Presets)

### A1. Step 1 - Parsel & İmar

**Principle**: User enters exact values from their İmar Durumu document

| Field | Implementation |
|-------|----------------|
| Parsel Alanı | Manual entry (required) |
| TAKS | Manual entry (required) + municipality link for reference |
| KAKS | Manual entry (required) + municipality link for reference |
| Çıkma Katsayısı | **Manual entry (required)** - no default, user must check İmar Durumu |
| Kat Adedi | Auto-calculated OR manual override |
| Hmax | Optional override |

**Key Change**: Remove default for Çıkma - force user to enter value from their document.
- Tooltip: "İmar durumunuzda belirtilen çıkma katsayısını giriniz (genelde 1.60-1.70)"
- Show warning if left empty

**Files to modify**:
- `src/components/phase2/ImarManualEntry.tsx` - Make çıkma required with guidance
- `src/utils/imarValidation.ts` - Add validation for required çıkma

---

### A2. Step 2 - Daire Karışımı

**No Presets** - User configures exact unit mix based on their project.

Current implementation is correct. No changes needed.

---

### A3. Step 3 - Maliyet & Fiyat

**Primary Currency**: TL (Turkish Lira)
**Secondary**: USD/EUR shown in small text as reference only

```
┌─────────────────────────────────────────────────────────────┐
│  💰 İnşaat Maliyeti                                         │
│                                                             │
│  Kalite Seviyesi: [Standart ▼]                             │
│                                                             │
│  Maliyet Kalemleri (Düzenlenebilir):                       │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Kalem              TL/m²    Kaynak         [Düzenle]  │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ Kaba Yapı          8,500    Sektör Ort.    [✏️]       │ │
│  │ İnce İşler         9,000    Sektör Ort.    [✏️]       │ │
│  │ Tesisat            3,500    Sektör Ort.    [✏️]       │ │
│  │ Elektrik           2,800    Sektör Ort.    [✏️]       │ │
│  │ Genel Gider (%12)  2,856    Hesaplanan     [✏️]       │ │
│  │ ─────────────────────────────────────────────────────  │ │
│  │ TOPLAM            26,656    TL/m²                      │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  📊 Veriler: Aralık 2024 | Kaynak: TÜİK + Sektör          │
│  💱 Referans: $628/m² | €539/m² (TCMB 07.12.2025)         │
└─────────────────────────────────────────────────────────────┘
```

**Files to modify**:
- `src/components/phase2/CostPricingStep.tsx` - Itemized editable costs
- `src/data/constructionCosts.ts` - New file with research-based defaults

---

### A4. Step 4 - Finansal Analiz

**All Parameters Editable** with source indicators:

```
┌─────────────────────────────────────────────────────────────┐
│  📊 Finansal Parametreler (Düzenlenebilir)                  │
│                                                             │
│  Parametre           Değer      Kaynak         [Düzenle]   │
│  ─────────────────────────────────────────────────────────  │
│  Aylık Enflasyon     %2.5       Varsayılan     [✏️]        │
│  Aylık Değer Artışı  %1.5       Varsayılan     [✏️]        │
│  İskonto Oranı       %1.0       Varsayılan     [✏️]        │
│  İnşaat Süresi       18 ay      Hesaplanan     [✏️]        │
│  Satış Süresi        6 ay       Varsayılan     [✏️]        │
│                                                             │
│  💡 Tüm değerler düzenlenebilir. Varsayılan değerler       │
│     sektör ortalamaları ve resmi kaynaklara dayanır.       │
└─────────────────────────────────────────────────────────────┘
```

**Files to modify**:
- `src/components/phase2/FinancialSummary.tsx` - Add edit buttons for parameters

---

## Phase B: Research-Based Construction Costs

### B1. Official Sources (2024-2025)

**Source 1: Çevre Şehircilik Bakanlığı - Yapı Yaklaşık Birim Maliyetleri**
- [2024 Resmi Gazete](https://www.resmigazete.gov.tr/eskiler/2024/02/20240220-2.htm)
- [2025 Tebliğ](https://www.hakedis.org/wp-content/uploads/2025/01/2025_Yapi_Yaklasik_Birim_Maliyetleri.pdf)

**Source 2: TÜİK İnşaat Maliyet Endeksi**
- [TÜİK Veri Portalı](https://data.tuik.gov.tr/Kategori/GetKategori?p=Insaat-ve-Konut-116)

**Source 3: Sektör Ortalamaları**
- [Sanal Şantiye](https://www.sanalsantiye.com/)
- [İnşaat Hesabı](https://insaathesabi.com/blog/insaat-maliyeti-hesaplama/)

---

### B2. Updated Cost Structure (December 2024)

**Official Emlak Vergisi Rates (2024 Resmi Gazete)**:
| Sınıf | TL/m² | Açıklama |
|-------|-------|----------|
| Lüks Betonarme | 6,768 | Resmi minimum (vergi matrahı) |
| 1. Sınıf | 4,227 | Resmi minimum |
| 2. Sınıf | 2,822 | Resmi minimum |
| 3. Sınıf | 1,999 | Resmi minimum |

**Note**: These are TAX BASIS values, NOT actual construction costs.

---

**Actual Market Costs (Sektör Ortalamaları 2024-2025)**:

| Kalem | TL/m² | % of Total | Kaynak |
|-------|-------|------------|--------|
| **Kaba Yapı** | 8,000-9,000 | ~35% | Sektör |
| - Temel | 2,000-3,500 | | |
| - Karkas (demir+beton) | 5,000-6,000 | | |
| - Duvar | 1,000-1,500 | | |
| **İnce İşler** | 8,500-9,500 | ~40% | Sektör |
| - Sıva/Boya | 1,500-2,000 | | |
| - Seramik/Parke | 2,000-2,500 | | |
| - Kapı/Pencere | 2,500-3,000 | | |
| - Mutfak/Banyo | 2,500-3,000 | | |
| **Tesisat** | 3,000-4,000 | ~15% | Sektör |
| - Elektrik | 1,200-1,500 | | |
| - Su/Kalorifer | 1,800-2,500 | | |
| **Genel Giderler** | %10-15 | | |
| **TOPLAM** | 17,000-28,000 | 100% | |

---

**Material Prices (Aralık 2024)**:

| Malzeme | Birim | Fiyat | Kaynak |
|---------|-------|-------|--------|
| İnşaat Demiri | TL/kg | 27-28 | [Sanal Şantiye](https://www.sanalsantiye.com/guncel-demir-fiyatlari/) |
| Hazır Beton C30 | TL/m³ | 2,200-2,400 | [Sanal Şantiye](https://www.sanalsantiye.com/hazir-beton-fiyatlari/) |
| Çimento (torba) | TL/adet | 150-230 | Sektör |

---

### B3. Proposed Default Values

Based on research, here are the proposed defaults for the app:

| Kalite | TL/m² (brüt) | Açıklama |
|--------|--------------|----------|
| **Standart** | 17,500 | Ekonomik malzeme, temel kalite |
| **Orta** | 22,500 | Orta kalite malzeme (VARSAYILAN) |
| **Lüks** | 28,000 | Yüksek kalite, premium malzeme |

**Breakdown for "Orta" (22,500 TL/m²)**:
| Kalem | TL/m² | % |
|-------|-------|---|
| Kaba Yapı | 8,000 | 35.6% |
| İnce İşler | 8,500 | 37.8% |
| Tesisat (Elektrik+Su) | 3,300 | 14.7% |
| Genel Gider (%12) | 2,700 | 12.0% |
| **TOPLAM** | 22,500 | 100% |

---

### B4. Exchange Rate (Reference Only)

**Source**: TCMB Daily XML
**Endpoint**: `https://www.tcmb.gov.tr/kurlar/today.xml`
**Usage**: Display as small reference text, NOT primary display

Current rates (December 2025):
- USD: 42.44 TL
- EUR: 49.46 TL

---

## Phase C: Editable Parameters UI

### C1. Parameter Edit Component

```typescript
// src/components/ui/EditableParameter.tsx

interface EditableParameterProps {
  label: string;
  value: number;
  unit: string;
  source: 'default' | 'manual' | 'calculated';
  sourceLabel: string;
  onChange: (value: number) => void;
}
```

**Visual Design**:
```
┌─────────────────────────────────────────────────────────┐
│  Kaba Yapı Maliyeti                                     │
│  ┌─────────────┐                                        │
│  │ 8,000      │ TL/m²    [Sektör Ort.]  [✏️ Düzenle]  │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

When clicked, inline edit mode:
```
┌─────────────────────────────────────────────────────────┐
│  Kaba Yapı Maliyeti                                     │
│  ┌─────────────┐                                        │
│  │ 8,500      │ TL/m²    [Manuel]       [✓] [✗]       │
│  └─────────────┘                                        │
└─────────────────────────────────────────────────────────┘
```

---

### C2. Source Indicator Badge

```typescript
// src/components/ui/SourceBadge.tsx

type DataSource = 'default' | 'manual' | 'calculated';

const sourceLabels = {
  default: { text: 'Varsayılan', color: 'gray' },
  manual: { text: 'Manuel', color: 'blue' },
  calculated: { text: 'Hesaplanan', color: 'green' },
};
```

---

## Implementation Order

### Phase 1: Cost Research Integration (Priority: HIGH)
1. Create `src/data/constructionCosts.ts` with research-based defaults
2. Update `CostPricingStep.tsx` to show itemized costs
3. Add edit capability for each cost item

### Phase 2: Parameter Editability (Priority: HIGH)
4. Create `EditableParameter.tsx` component
5. Create `SourceBadge.tsx` component
6. Update `FinancialSummary.tsx` with editable parameters

### Phase 3: İmar Validation (Priority: MEDIUM)
7. Make Çıkma required in `ImarManualEntry.tsx`
8. Add validation message when Çıkma is empty

### Phase 4: Exchange Rate Reference (Priority: LOW)
9. Create `tcmbService.ts` for TCMB API
10. Add small reference text showing USD/EUR equivalents

---

## Files Summary

### New Files (4)
| File | Purpose | Lines (est) |
|------|---------|-------------|
| `src/data/constructionCosts.ts` | Research-based cost defaults | ~120 |
| `src/components/ui/EditableParameter.tsx` | Editable field component | ~80 |
| `src/components/ui/SourceBadge.tsx` | Source indicator | ~30 |
| `src/services/tcmbService.ts` | Exchange rate fetch | ~60 |

### Modified Files (4)
| File | Changes |
|------|---------|
| `src/components/phase2/ImarManualEntry.tsx` | Make Çıkma required |
| `src/components/phase2/CostPricingStep.tsx` | Itemized editable costs |
| `src/components/phase2/FinancialSummary.tsx` | Editable parameters |
| `src/types/feasibility.ts` | Add source tracking types |

**Total**: ~290 new lines, ~100 modified lines

---

## Data Sources Summary

| Data | Source | Update Frequency | API |
|------|--------|------------------|-----|
| Construction Costs | TÜİK + Sektör | Quarterly (manual) | No |
| Material Prices | Sanal Şantiye | Monthly (manual) | No |
| Exchange Rates | TCMB | Daily | Yes (XML) |
| Property Prices | Endeksa | Monthly (manual) | No |
| Inflation | TCMB PKA | Monthly (manual) | EVDS (future) |

---

## Testing Checklist

- [ ] Step 1: Çıkma shows warning if empty
- [ ] Step 1: Municipality link works for reference
- [ ] Step 3: All cost items are editable
- [ ] Step 3: Source badge shows correctly (default vs manual)
- [ ] Step 3: Exchange rate reference displays (or graceful fallback)
- [ ] Step 4: All financial parameters are editable
- [ ] Step 4: Source badges update when values changed
- [ ] Build passes with no TypeScript errors
- [ ] Bundle size increase < 15 KB

---

## Key Decisions Made

1. ✅ **No Presets** - User enters exact values for their project
2. ✅ **Çıkma is Required** - No default, user must check their İmar Durumu
3. ✅ **TL is Primary** - Foreign currency shown only as small reference
4. ✅ **All Parameters Editable** - With visual source indicators
5. ✅ **Research-Based Costs** - From official Turkish sources (TÜİK, Bakanlık, Sektör)

---

## Approval

**Approve to proceed?** [ ] Yes [ ] No

If approved, I will implement in the order specified above.

---

*Plan revised: December 7, 2025*
*Estimated effort: 4-6 hours implementation*
