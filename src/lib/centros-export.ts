/**
 * Export utilities for Centros data
 * Supports Excel (XLSX), PDF, and Word (DOCX) formats
 */

import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, WidthType, HeadingLevel, AlignmentType, BorderStyle } from 'docx';

export interface ExportField {
  key: string;
  label: string;
  section?: string;
}

export interface ExportCentro {
  [key: string]: string | undefined;
}

// ─── EXCEL EXPORT ─────────────────────────────────────────────

export function exportToExcel(
  centros: ExportCentro[],
  fields: ExportField[],
  filename: string = 'centros_search'
) {
  // Create headers
  const headers = fields.map(f => f.label);

  // Create rows
  const rows = centros.map(centro =>
    fields.map(f => centro[f.key] || '')
  );

  // Create workbook with multiple sheets
  const wb = XLSX.utils.book_new();

  // Sheet 1: All data
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Set column widths
  ws['!cols'] = fields.map(f => ({
    wch: Math.max(f.label.length, 15)
  }));

  XLSX.utils.book_append_sheet(wb, ws, 'Datos Centros');

  // Sheet 2: Summary by Provincia
  if (centros.length > 0) {
    const provinciaField = fields.find(f => f.label === 'Provincia');
    if (provinciaField) {
      const byProvincia: Record<string, number> = {};
      centros.forEach(c => {
        const prov = c[provinciaField.key] || 'Sin asignar';
        byProvincia[prov] = (byProvincia[prov] || 0) + 1;
      });
      const summaryData = Object.entries(byProvincia).map(([prov, count]) => [prov, count]);
      const ws2 = XLSX.utils.aoa_to_sheet([['Provincia', 'Cantidad'], ...summaryData]);
      XLSX.utils.book_append_sheet(wb, ws2, 'Resumen Provincia');
    }
  }

  // Sheet 3: Summary by Prioridad
  if (centros.length > 0) {
    const prioridadField = fields.find(f => f.label === 'Prioridad');
    if (prioridadField) {
      const byPrioridad: Record<string, number> = {};
      centros.forEach(c => {
        const pri = c[prioridadField.key] || 'Sin asignar';
        byPrioridad[pri] = (byPrioridad[pri] || 0) + 1;
      });
      const summaryData = Object.entries(byPrioridad).map(([pri, count]) => [pri, count]);
      const ws3 = XLSX.utils.aoa_to_sheet([['Prioridad', 'Cantidad'], ...summaryData]);
      XLSX.utils.book_append_sheet(wb, ws3, 'Resumen Prioridad');
    }
  }

  // Generate and download
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// ─── PDF EXPORT ───────────────────────────────────────────────

export function exportToPDF(
  centros: ExportCentro[],
  fields: ExportField[],
  filename: string = 'centros_search'
) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a3' });

  // Title
  doc.setFontSize(18);
  doc.setTextColor(30, 58, 138);
  doc.text('Datos Centros - OnTower/Cellnex', 14, 20);

  // Subtitle with date and count
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')} | Total centros: ${centros.length}`, 14, 28);

  // Main data table
  const headers = fields.map(f => f.label);
  const rows = centros.map(centro =>
    fields.map(f => {
      const val = centro[f.key] || '';
      // Truncate long values for PDF
      return val.length > 40 ? val.substring(0, 37) + '...' : val;
    })
  );

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 34,
    styles: {
      fontSize: 6,
      cellPadding: 1.5,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7,
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    columnStyles: fields.reduce((acc, f, i) => {
      acc[i] = { cellWidth: Math.max(f.label.length * 1.8, 20) };
      return acc;
    }, {} as Record<number, { cellWidth: number }>),
    margin: { top: 34 },
    didDrawPage: (data) => {
      // Footer on each page
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Página ${data.pageNumber} | Electrónica Centeno`,
        doc.internal.pageSize.getWidth() / 2,
        doc.internal.pageSize.getHeight() - 8,
        { align: 'center' }
      );
    },
  });

  doc.save(`${filename}.pdf`);
}

// ─── WORD EXPORT ──────────────────────────────────────────────

export async function exportToWord(
  centros: ExportCentro[],
  fields: ExportField[],
  filename: string = 'centros_search'
) {
  // Limit fields for Word to keep it readable
  const maxFields = Math.min(fields.length, 20);
  const limitedFields = fields.slice(0, maxFields);

  const rows: TableRow[] = [];

  // Header row
  rows.push(
    new TableRow({
      tableHeader: true,
      children: limitedFields.map(f =>
        new TableCell({
          width: { size: Math.floor(9000 / maxFields), type: WidthType.DXA },
          shading: { fill: '1e3a8a' },
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: f.label,
                  bold: true,
                  color: 'FFFFFF',
                  size: 16,
                  font: 'Calibri',
                }),
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 40, after: 40 },
            }),
          ],
        })
      ),
    })
  );

  // Data rows
  centros.forEach((centro, idx) => {
    rows.push(
      new TableRow({
        children: limitedFields.map(f => {
          const val = centro[f.key] || '';
          return new TableCell({
            width: { size: Math.floor(9000 / maxFields), type: WidthType.DXA },
            shading: idx % 2 === 0 ? { fill: 'F5F7FA' } : undefined,
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: val.length > 60 ? val.substring(0, 57) + '...' : val,
                    size: 14,
                    font: 'Calibri',
                  }),
                ],
                spacing: { before: 20, after: 20 },
              }),
            ],
          });
        }),
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: [
          // Title
          new Paragraph({
            text: 'Datos Centros - OnTower/Cellnex',
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
          }),
          // Subtitle
          new Paragraph({
            children: [
              new TextRun({
                text: `Generado: ${new Date().toLocaleDateString('es-ES')} | Total centros: ${centros.length}`,
                color: '666666',
                size: 20,
                font: 'Calibri',
              }),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          // Data table
          new Table({
            rows,
            width: { size: 9000, type: WidthType.DXA },
          }),
          // Note about truncated fields
          ...(fields.length > maxFields
            ? [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `\nNota: Se muestran las primeras ${maxFields} columnas de ${fields.length} totales. Use la exportación Excel para ver todos los datos.`,
                      italics: true,
                      color: '999999',
                      size: 16,
                      font: 'Calibri',
                    }),
                  ],
                  spacing: { before: 200 },
                }),
              ]
            : []),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─── CSV EXPORT (bonus) ──────────────────────────────────────

export function exportToCSV(
  centros: ExportCentro[],
  fields: ExportField[],
  filename: string = 'centros_search'
) {
  const headers = fields.map(f => `"${f.label}"`).join(',');
  const rows = centros.map(centro =>
    fields.map(f => {
      const val = (centro[f.key] || '').replace(/"/g, '""');
      return `"${val}"`;
    }).join(',')
  );

  const csv = [headers, ...rows].join('\n');
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
