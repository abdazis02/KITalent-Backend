import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface PdfTable {
  columns: string[];
  /** Optional per-column width weights (sum need not be 1; defaults to equal). */
  widths?: number[];
  rows: Array<Array<string | number>>;
}

/** A simple, domain-agnostic document spec rendered to a PDF (PRD §18 generate-pdf). */
export interface PdfDocSpec {
  title: string;
  subtitle?: string;
  /** Label/value pairs shown as a header block (e.g. No, Date, Client). */
  meta?: Array<[string, string]>;
  table?: PdfTable;
  /** Label/value pairs shown right-aligned under the table (e.g. Subtotal, Total). */
  totals?: Array<[string, string]>;
  footer?: string;
}

/**
 * Generic PDF generator (PRD §18). Domain services compose a PdfDocSpec from
 * their data; this renders a clean A4 document — used for invoices, contracts,
 * salary slips, and report exports alike.
 */
@Injectable()
export class PdfService {
  generate(spec: PdfDocSpec): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      try {
        this.render(doc, spec);
        doc.end();
      } catch (err) {
        reject(err as Error);
      }
    });
  }

  private render(doc: PDFKit.PDFDocument, spec: PdfDocSpec): void {
    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // Header: brand + title
    doc.fontSize(18).font('Helvetica-Bold').text('KITalent', left, doc.y, { continued: false });
    doc.moveDown(0.2);
    doc.fontSize(15).font('Helvetica-Bold').text(spec.title);
    if (spec.subtitle) doc.fontSize(10).font('Helvetica').fillColor('#555').text(spec.subtitle).fillColor('#000');
    doc.moveDown(0.5);
    doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor('#cccccc').stroke().strokeColor('#000');
    doc.moveDown(0.6);

    // Meta block (label: value)
    if (spec.meta?.length) {
      doc.fontSize(10).font('Helvetica');
      for (const [label, value] of spec.meta) {
        doc.font('Helvetica-Bold').text(`${label}: `, { continued: true }).font('Helvetica').text(value);
      }
      doc.moveDown(0.6);
    }

    // Table
    if (spec.table?.columns.length) {
      this.renderTable(doc, spec.table, left, width);
      doc.moveDown(0.6);
    }

    // Totals (right aligned)
    if (spec.totals?.length) {
      doc.fontSize(10);
      for (const [label, value] of spec.totals) {
        doc.font('Helvetica-Bold').text(`${label}: ${value}`, left, doc.y, { width, align: 'right' });
      }
      doc.moveDown(0.6);
    }

    // Footer
    const footer = spec.footer ?? 'Dokumen ini dihasilkan otomatis oleh sistem KITalent.';
    doc.fontSize(8).font('Helvetica').fillColor('#888').text(footer, left, doc.page.height - doc.page.margins.bottom - 20, { width, align: 'center' }).fillColor('#000');
  }

  private renderTable(doc: PDFKit.PDFDocument, table: PdfTable, left: number, width: number): void {
    const cols = table.columns.length;
    const weights = table.widths && table.widths.length === cols ? table.widths : new Array(cols).fill(1);
    const weightSum = weights.reduce((s, w) => s + w, 0);
    const colWidths = weights.map((w) => (w / weightSum) * width);
    const xs: number[] = [];
    let acc = left;
    for (const w of colWidths) { xs.push(acc); acc += w; }

    const rowHeight = 18;
    const drawRow = (cells: Array<string | number>, bold: boolean) => {
      const y = doc.y;
      doc.fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      cells.forEach((cell, i) => {
        const align = i === 0 ? 'left' : 'right';
        doc.text(String(cell), xs[i] + 2, y + 4, { width: colWidths[i] - 4, align });
      });
      doc.y = y + rowHeight;
      doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#eeeeee').stroke().strokeColor('#000');
    };

    // Header row with light background line
    doc.moveTo(left, doc.y).lineTo(left + width, doc.y).strokeColor('#999999').stroke().strokeColor('#000');
    drawRow(table.columns, true);
    for (const row of table.rows) {
      // New page if near the bottom.
      if (doc.y + rowHeight > doc.page.height - doc.page.margins.bottom - 30) doc.addPage();
      drawRow(row, false);
    }
  }
}
