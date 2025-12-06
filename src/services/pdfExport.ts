/**
 * PDF Export Service
 *
 * Phase 2.4 Part 3 - Generate feasibility reports as PDF
 */

import jsPDF from 'jspdf';
import type { FeasibilityProject } from '../types/project';
import type { FinancialResult } from '../types/feasibility';

/**
 * Format currency (Turkish Lira)
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format number with thousands separator
 */
function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format percentage
 */
function formatPercent(value: number): string {
  return `%${(value * 100).toFixed(1)}`;
}

/**
 * Generate feasibility PDF report
 */
export async function generateFeasibilityPDF(
  project: FeasibilityProject,
  financialResult?: FinancialResult
): Promise<void> {
  // Initialize PDF (A4 portrait)
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [37, 99, 235]; // blue-600
  const grayColor: [number, number, number] = [107, 114, 128]; // gray-500
  const darkColor: [number, number, number] = [17, 24, 39]; // gray-900

  /**
   * Add page if needed
   */
  const checkPage = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
  };

  /**
   * Add title
   */
  const addTitle = (text: string) => {
    pdf.setFontSize(20);
    pdf.setTextColor(...darkColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, y);
    y += 12;
  };

  /**
   * Add section header
   */
  const addSectionHeader = (text: string) => {
    checkPage(15);
    pdf.setFontSize(14);
    pdf.setTextColor(...primaryColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(text, margin, y);
    y += 10;
  };

  /**
   * Add key-value pair
   */
  const addKeyValue = (key: string, value: string, indent = 0) => {
    checkPage(8);
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(...grayColor);
    pdf.text(key + ':', margin + indent, y);
    pdf.setTextColor(...darkColor);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, margin + indent + 60, y);
    y += 7;
  };

  /**
   * Add horizontal line
   */
  const addLine = () => {
    checkPage(5);
    pdf.setDrawColor(...grayColor);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 8;
  };

  /**
   * Add table
   */
  const addTable = (
    headers: string[],
    rows: string[][],
    colWidths: number[]
  ) => {
    checkPage(20 + rows.length * 8);

    // Headers
    pdf.setFillColor(...primaryColor);
    pdf.rect(margin, y - 5, contentWidth, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');

    let x = margin;
    headers.forEach((header, i) => {
      pdf.text(header, x + 2, y);
      x += colWidths[i];
    });
    y += 8;

    // Rows
    pdf.setTextColor(...darkColor);
    pdf.setFont('helvetica', 'normal');
    rows.forEach((row, rowIndex) => {
      x = margin;
      if (rowIndex % 2 === 0) {
        pdf.setFillColor(249, 250, 251);
        pdf.rect(margin, y - 5, contentWidth, 7, 'F');
      }
      row.forEach((cell, i) => {
        pdf.text(cell, x + 2, y);
        x += colWidths[i];
      });
      y += 7;
    });

    y += 5;
  };

  // ============================================================================
  // PAGE 1: Cover & Overview
  // ============================================================================

  // Title
  addTitle(project.name);

  // Metadata
  pdf.setFontSize(10);
  pdf.setTextColor(...grayColor);
  pdf.text('Fizibilite Analizi Raporu', margin, y);
  y += 6;
  pdf.text(
    `Oluşturulma: ${new Date(project.createdAt).toLocaleDateString('tr-TR')}`,
    margin,
    y
  );
  y += 6;
  pdf.text(
    `Son Güncelleme: ${new Date(project.updatedAt).toLocaleDateString('tr-TR')}`,
    margin,
    y
  );
  y += 15;

  addLine();

  // Section 1: Parsel Bilgileri
  addSectionHeader('1. Parsel ve İmar Bilgileri');
  addKeyValue('İlçe', project.parsel.ilce);
  addKeyValue('Ada', project.parsel.ada);
  addKeyValue('Parsel', project.parsel.parsel);
  addKeyValue('Parsel Alanı', `${formatNumber(project.parsel.alan)} m²`);
  y += 5;

  addKeyValue('TAKS', formatNumber(project.imar.taks, 2));
  addKeyValue('KAKS', formatNumber(project.imar.kaks, 2));
  addKeyValue('Kat Adedi', formatNumber(project.imar.katAdedi));
  y += 5;

  addKeyValue('Taban Alanı', `${formatNumber(project.zoning.tabanAlani)} m²`);
  addKeyValue(
    'Toplam İnşaat',
    `${formatNumber(project.zoning.toplamInsaat)} m²`
  );
  addKeyValue(
    'Net Kullanım',
    `${formatNumber(project.zoning.netKullanim)} m²`
  );
  y += 10;

  addLine();

  // Section 2: Daire Karışımı
  addSectionHeader('2. Daire Karışımı');

  const unitTypes = Object.keys(project.unitMix) as Array<
    keyof typeof project.unitMix
  >;
  const unitRows = unitTypes
    .filter((type) => project.unitMix[type].count > 0)
    .map((type) => {
      const unit = project.unitMix[type];
      return [
        type,
        formatNumber(unit.count),
        `${formatNumber(unit.area)} m²`,
        `${formatNumber(unit.count * unit.area)} m²`,
      ];
    });

  if (unitRows.length > 0) {
    addTable(
      ['Tip', 'Adet', 'Alan (Net)', 'Toplam'],
      unitRows,
      [30, 30, 40, 40]
    );
  }

  addKeyValue(
    'Toplam Daire',
    formatNumber(project.unitMixSummary.totalUnits)
  );
  addKeyValue(
    'Net Alan',
    `${formatNumber(project.unitMixSummary.totalNetArea)} m²`
  );
  addKeyValue(
    'Brüt Alan',
    `${formatNumber(project.unitMixSummary.totalGrossArea)} m²`
  );
  addKeyValue(
    'Alan Kullanımı',
    formatPercent(project.unitMixSummary.utilization)
  );
  y += 10;

  addLine();

  // Section 3: Maliyet ve Fiyatlandırma
  addSectionHeader('3. Maliyet ve Fiyatlandırma');

  const qualityMap = {
    standard: 'Standart',
    mid: 'Orta Kalite',
    luxury: 'Lüks',
  };
  addKeyValue('İnşaat Kalitesi', qualityMap[project.constructionQuality]);
  addKeyValue(
    'İnşaat Maliyeti',
    `${formatCurrency(project.constructionCostPerM2)}/m²`
  );
  y += 5;

  addKeyValue('Satış Fiyatları', '', 0);
  Object.entries(project.salePrices).forEach(([type, price]) => {
    if (project.unitMix[type as keyof typeof project.unitMix].count > 0) {
      addKeyValue(`  ${type}`, `${formatCurrency(price)}/m²`, 5);
    }
  });
  y += 10;

  addLine();

  // ============================================================================
  // PAGE 2: Financial Results
  // ============================================================================

  pdf.addPage();
  y = margin;

  addSectionHeader('4. Finansal Analiz');

  addKeyValue('Toplam Maliyet', formatCurrency(project.results.totalCost));
  addKeyValue('Toplam Gelir (NPV)', formatCurrency(project.results.totalRevenue));
  addKeyValue('Brüt Kar', formatCurrency(project.results.grossProfit));
  addKeyValue('Kar Marjı', formatPercent(project.results.margin));
  addKeyValue('ROI', `%${formatNumber(project.results.roi, 1)}`);
  y += 5;

  addKeyValue('NPV Kar', formatCurrency(project.results.npvProfit));
  addKeyValue('NPV ROI', `%${formatNumber(project.results.npvROI, 1)}`);
  y += 10;

  // Simplified Summary (scenarios removed)
  if (financialResult) {
    addLine();
    addSectionHeader('Finansal Özet');

    addKeyValue('Toplam Gelir (NPV)', formatCurrency(financialResult.npvAdjustedRevenue));
    addKeyValue('Toplam Maliyet', formatCurrency(financialResult.totalConstructionCost));
    addKeyValue('Net Kar', formatCurrency(financialResult.npvProfit));
    addKeyValue('Kar Marjı', formatPercent(financialResult.profitMargin / 100));
  }

  y += 10;
  addLine();

  // Footer
  pdf.setFontSize(8);
  pdf.setTextColor(...grayColor);
  pdf.text(
    'Bu rapor Construction Forecast uygulaması ile oluşturulmuştur.',
    margin,
    pageHeight - 10
  );
  pdf.text(`Sayfa 1-2`, pageWidth - margin - 15, pageHeight - 10);

  // Download PDF
  const filename = `fizibilite-${project.name
    .toLowerCase()
    .replace(/\s+/g, '-')}-${Date.now()}.pdf`;
  pdf.save(filename);
}

export default generateFeasibilityPDF;
