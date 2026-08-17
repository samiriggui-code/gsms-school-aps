import PDFDocument from 'pdfkit';
import { loadAttendancePdfBrandContext, loadImageBuffer } from '@/lib/instructor/attendance-pdf-brand';
import {
  buildDocumentClientBlock,
  clientVisibleDocumentNotes,
  formatDocumentDate,
} from './finance-devis-document-view';
import { FINANCE_DOC_THEME as T } from './finance-document-theme';
import type { FinanceDevisDocumentKind, FinanceDevisPdfRow } from './finance-devis-types';
import { decimalNum, moneyFrPdf } from './finance-devis-html-core';

type PdfDoc = InstanceType<typeof PDFDocument>;
type Brand = Awaited<ReturnType<typeof loadAttendancePdfBrandContext>>;

const MARGIN = 44;
const WIDTH = 507;
const FOOTER_H = 88;
const TOTALS_H = 82;
const DOC_CARD_W = 172;
const TABLE_HEAD_H = 24;
const ROW_H = 22;

/** Colonnes : désignation large, montants assez larges pour éviter la coupure. */
const COL_W = [248, 36, 76, 44, 103] as const;
const COL_X = COL_W.reduce(
  (acc, w, i) => {
    acc.push(i === 0 ? MARGIN : acc[i - 1]! + COL_W[i - 1]!);
    return acc;
  },
  [] as number[],
);

function documentLabel(kind: FinanceDevisDocumentKind): string {
  return kind === 'facture' ? 'FACTURE' : 'DEVIS';
}

function pdfFilename(kind: FinanceDevisDocumentKind, referenceCode: string): string {
  const prefix = kind === 'facture' ? 'facture' : 'devis';
  return `${prefix}-${referenceCode.replace(/[^a-zA-Z0-9._-]+/g, '-')}.pdf`;
}

function pageBottom(doc: PdfDoc): number {
  return doc.page.height - MARGIN;
}

function footerTop(doc: PdfDoc): number {
  return pageBottom(doc) - FOOTER_H;
}

function drawAccentBar(doc: PdfDoc) {
  doc.rect(MARGIN, MARGIN - 8, WIDTH, 4).fill(T.primary);
}

function issuerLegalLine(brand: Brand): string | null {
  const parts = [
    brand.siret ? `SIRET ${brand.siret}` : null,
    brand.ndaNumber ? `NDA ${brand.ndaNumber}` : null,
    brand.qualiopiRef ? `Qualiopi ${brand.qualiopiRef}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

function drawFinanceFooter(doc: PdfDoc, brand: Brand, kind: FinanceDevisDocumentKind, validUntil: Date | string | null) {
  const top = footerTop(doc);
  doc.rect(MARGIN, top, WIDTH, FOOTER_H).fill(T.pageBg);
  doc.moveTo(MARGIN, top).lineTo(MARGIN + WIDTH, top).stroke(T.border);

  let y = top + 10;
  if (brand.qualiopiLogoBuffer) {
    try {
      doc.image(brand.qualiopiLogoBuffer, MARGIN + WIDTH - 70, y, { fit: [64, 34] });
    } catch {
      /* ignore */
    }
  }

  doc.fontSize(8).fillColor(T.text).font('Helvetica-Bold').text(brand.companyName, MARGIN, y, { width: WIDTH - 78 });
  y = doc.y + 3;
  doc.font('Helvetica').fontSize(7).fillColor(T.textMuted);
  for (const line of [brand.addressLine, issuerLegalLine(brand), [brand.phone, brand.email].filter(Boolean).join(' · ') || null].filter(Boolean)) {
    doc.text(String(line), MARGIN, y, { width: WIDTH - 78 });
    y = doc.y + 2;
  }

  const legal =
    kind === 'facture'
      ? 'Facture — TVA sur les débits. Retard de paiement : pénalités légales + indemnité forfaitaire 40 € (art. L.441-10 C. com.).'
      : `Devis non contractuel — valable jusqu'au ${formatDocumentDate(validUntil)}.`;
  doc.fontSize(6.5).fillColor(T.textLight).text(legal, MARGIN, pageBottom(doc) - 12, { width: WIDTH, align: 'center' });
  doc.fillColor('#000');
}

function drawHeader(
  doc: PdfDoc,
  brand: Brand,
  iconBuffer: Buffer | null,
  row: FinanceDevisPdfRow,
  kind: FinanceDevisDocumentKind,
): number {
  const topY = MARGIN + 6;
  const iconSize = 36;
  const textX = MARGIN + iconSize + 10;
  const leftW = MARGIN + WIDTH - DOC_CARD_W - textX - 14;
  const cardX = MARGIN + WIDTH - DOC_CARD_W;
  const cardPad = 12;
  const icon = iconBuffer ?? brand.logoBuffer;

  if (icon) {
    try {
      doc.image(icon, MARGIN, topY, { fit: [iconSize, iconSize] });
    } catch {
      /* ignore */
    }
  }

  doc.font('Helvetica-Bold').fontSize(11).fillColor(T.text);
  doc.text(brand.companyName, textX, topY, { width: leftW });
  let leftBottom = doc.y + 3;
  if (brand.addressLine) {
    doc.font('Helvetica').fontSize(8.5).fillColor(T.textMuted);
    doc.text(brand.addressLine, textX, leftBottom, { width: leftW, lineGap: 1 });
    leftBottom = doc.y;
  }

  let cardY = topY;

  doc.roundedRect(cardX + cardPad, cardY, 58, 15, 3).fill(T.primary);
  doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
  doc.text(documentLabel(kind), cardX + cardPad, cardY + 4, { width: 58, align: 'center' });
  cardY += 20;

  doc.fontSize(11).fillColor(T.text).font('Helvetica-Bold');
  doc.text(row.referenceCode, cardX + cardPad, cardY, { width: DOC_CARD_W - cardPad * 2, align: 'right' });
  cardY = doc.y + 8;

  doc.font('Helvetica').fontSize(8).fillColor(T.textMuted);
  const meta: [string, string][] = [['Date', formatDocumentDate(row.updatedAt)]];
  if (kind === 'devis' && row.validUntil) {
    meta.push(['Validité', formatDocumentDate(row.validUntil)]);
  }
  for (const [k, v] of meta) {
    doc.text(k, cardX + cardPad, cardY, { width: 48, continued: true });
    doc.fillColor(T.text).font('Helvetica-Bold').text(v, { width: DOC_CARD_W - cardPad * 2 - 48, align: 'right' });
    doc.font('Helvetica').fillColor(T.textMuted);
    cardY = doc.y + 4;
  }

  const cardBottom = cardY + 4;
  doc.roundedRect(cardX, topY - 4, DOC_CARD_W, cardBottom - topY + 8, 6).stroke(T.border);

  const sepY = Math.max(leftBottom, cardBottom) + 14;
  doc.moveTo(MARGIN, sepY).lineTo(MARGIN + WIDTH, sepY).lineWidth(1).stroke(T.border);
  doc.lineWidth(1);
  return sepY + 14;
}

function drawClientBlock(doc: PdfDoc, row: FinanceDevisPdfRow, startY: number): number {
  const client = buildDocumentClientBlock(row);
  const boxW = DOC_CARD_W;
  const boxX = MARGIN + WIDTH - boxW;
  let y = startY;

  doc.fontSize(7).fillColor(T.primary).font('Helvetica-Bold').text('CLIENT', boxX, y, {
    width: boxW,
    align: 'right',
  });
  y = doc.y + 5;
  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.text).text(client.title, boxX, y, {
    width: boxW,
    align: 'right',
  });
  y = doc.y + 3;
  doc.font('Helvetica').fontSize(8.5).fillColor(T.textMuted);
  for (const line of client.lines) {
    doc.text(line, boxX, y, { width: boxW, align: 'right' });
    y = doc.y + 2;
  }

  return y + 20;
}

function pdfMoney(doc: PdfDoc, text: string, x: number, y: number, w: number) {
  doc.text(text, x, y, { width: w, align: 'right', lineBreak: false });
}

function drawTable(
  doc: PdfDoc,
  row: FinanceDevisPdfRow,
  startY: number,
  bodyEndY: number,
): number {
  const items = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];
  let y = startY;

  doc.roundedRect(MARGIN, y, WIDTH, TABLE_HEAD_H, 4).fill(T.primary);
  doc.fontSize(7).fillColor('#ffffff').font('Helvetica-Bold');
  ['Désignation', 'Qté', 'P.U. HT', 'TVA', 'Montant HT'].forEach((h, i) => {
    doc.text(h, COL_X[i]!, y + 8, { width: COL_W[i]!, align: i === 0 ? 'left' : 'right' });
  });
  y += TABLE_HEAD_H + 4;

  doc.font('Helvetica').fillColor(T.textBody).fontSize(9);
  const bodyTop = y;

  if (items.length === 0) {
    doc.fillColor(T.textLight).text('Aucune ligne renseignée.', MARGIN + 8, y + 6);
    y += ROW_H;
  } else {
    for (let i = 0; i < items.length; i++) {
      const l = items[i]!;
      if (i % 2 === 1) {
        doc.rect(MARGIN, y - 1, WIDTH, ROW_H).fill(T.pageBg);
        doc.fillColor(T.textBody);
      }
      const label = typeof l.label === 'string' ? l.label : '';
      const qty = Number(l.quantity ?? 1) || 0;
      const unit = Number(l.unitPriceHt ?? 0) || 0;
      const vat = Number(l.vatRate ?? 0) || 0;
      const ht = qty * unit;
      const rowY = y + 6;

      doc.text(label, COL_X[0]! + 4, rowY, { width: COL_W[0]! - 8, lineGap: 1 });
      pdfMoney(doc, String(qty), COL_X[1]!, rowY, COL_W[1]!);
      pdfMoney(doc, moneyFrPdf(unit, row.currency), COL_X[2]!, rowY, COL_W[2]!);
      pdfMoney(doc, `${vat} %`, COL_X[3]!, rowY, COL_W[3]!);
      pdfMoney(doc, moneyFrPdf(ht, row.currency), COL_X[4]!, rowY, COL_W[4]! - 4);
      y += ROW_H;
    }
  }

  const bodyUsed = y - bodyTop;
  const bodyTarget = Math.max(bodyUsed, bodyEndY - bodyTop);
  const filler = bodyTarget - bodyUsed;
  if (filler > 0) {
    doc.rect(MARGIN, y, WIDTH, filler).fill(T.surface);
    doc.rect(MARGIN, y, WIDTH, filler).stroke(T.border);
    y += filler;
  }

  doc.moveTo(MARGIN, y).lineTo(MARGIN + WIDTH, y).lineWidth(1).stroke(T.border);
  doc.lineWidth(1);
  return y + 4;
}

function drawTotals(doc: PdfDoc, row: FinanceDevisPdfRow, totalsY: number): void {
  const boxW = 240;
  const boxX = MARGIN + WIDTH - boxW;

  doc.roundedRect(boxX, totalsY, boxW, TOTALS_H, 8).stroke(T.border);
  doc.fontSize(9).fillColor(T.textBody).font('Helvetica');
  let ty = totalsY + 12;
  for (const [label, val] of [
    ['Total HT', moneyFrPdf(decimalNum(row.subtotalHt), row.currency)],
    ['TVA', moneyFrPdf(decimalNum(row.vatTotal), row.currency)],
  ] as const) {
    doc.text(label, boxX + 14, ty, { width: 100 });
    pdfMoney(doc, val, boxX + 14, ty, boxW - 28);
    ty += 16;
  }
  doc.roundedRect(boxX + 1, ty + 2, boxW - 2, 28, 6).fill(T.primary);
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#ffffff');
  doc.text('Total TTC', boxX + 14, ty + 11, { width: 100 });
  pdfMoney(doc, moneyFrPdf(decimalNum(row.totalTtc), row.currency), boxX + 14, ty + 11, boxW - 28);
  doc.font('Helvetica').fillColor(T.textBody);
}

/** PDF devis / facture — montants corrigés, tableau étiré sur la page. */
export async function buildFinanceDevisPdfBuffer(
  row: FinanceDevisPdfRow,
  kind: FinanceDevisDocumentKind = 'devis',
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();
  const iconBuffer = await loadImageBuffer('/brand/formssi-icon.png');

  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  drawAccentBar(doc);

  let y = drawHeader(doc, brand, iconBuffer, row, kind);
  y = drawClientBlock(doc, row, y);

  const notes = clientVisibleDocumentNotes(row.notes);
  const notesBlockH = notes ? 48 : 0;
  const totalsY = footerTop(doc) - TOTALS_H - notesBlockH - 16;
  const tableBodyEndY = totalsY - 20;

  y = drawTable(doc, row, y, tableBodyEndY);
  drawTotals(doc, row, totalsY);

  if (notes) {
    const notesY = totalsY + TOTALS_H + 12;
    doc.fontSize(7).fillColor(T.primary).font('Helvetica-Bold').text('MENTIONS', MARGIN, notesY);
    doc.font('Helvetica').fontSize(8.5).fillColor(T.textMuted).text(notes, MARGIN, notesY + 10, { width: WIDTH });
  }

  drawFinanceFooter(doc, brand, kind, row.validUntil);
  doc.end();

  return { buffer: await done, filename: pdfFilename(kind, row.referenceCode) };
}
