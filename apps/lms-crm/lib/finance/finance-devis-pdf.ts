import PDFDocument from 'pdfkit';
import type { FinanceDevisDocumentKind, FinanceDevisPdfRow } from './finance-devis-types';
import { decimalNum, moneyFr } from './finance-devis-html';

function documentLabel(kind: FinanceDevisDocumentKind): string {
  return kind === 'facture' ? 'Facture' : 'Devis';
}

function pdfFilename(kind: FinanceDevisDocumentKind, referenceCode: string): string {
  const prefix = kind === 'facture' ? 'facture' : 'devis';
  const safeRef = referenceCode.replace(/[^a-zA-Z0-9._-]+/g, '-');
  return `${prefix}-${safeRef}.pdf`;
}

/** Génère un PDF binaire à partir des données devis / facture. */
export async function buildFinanceDevisPdfBuffer(
  row: FinanceDevisPdfRow,
  kind: FinanceDevisDocumentKind = 'devis',
): Promise<{ buffer: Buffer; filename: string }> {
  const label = documentLabel(kind);
  const lines = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];
  const snap =
    row.clientSnapshot && typeof row.clientSnapshot === 'object' && !Array.isArray(row.clientSnapshot)
      ? (row.clientSnapshot as Record<string, unknown>)
      : {};

  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];

  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.fontSize(18).text(`${label} ${row.referenceCode}`, { continued: false });
  doc.moveDown(0.3);
  doc.fontSize(11).fillColor('#444').text(row.title);
  doc.fillColor('#000');

  if (row.lead) {
    doc.moveDown(0.8);
    doc.fontSize(10).text(
      `Client : ${row.lead.firstName} ${row.lead.lastName} — ${row.lead.email}`,
    );
  }
  if (row.formation) {
    doc.text(`Formation : ${row.formation.name}`);
  }

  doc.moveDown(1);
  doc.fontSize(12).text('Lignes', { underline: true });
  doc.moveDown(0.4);

  const tableTop = doc.y;
  const colX = [48, 260, 310, 380, 430] as const;
  const colW = [200, 40, 60, 40, 90] as const;

  doc.fontSize(9).fillColor('#333');
  ['Libellé', 'Qté', 'PU HT', 'TVA', 'Montant HT'].forEach((h, i) => {
    doc.text(h, colX[i], tableTop, { width: colW[i], align: i === 0 ? 'left' : 'right' });
  });

  let y = tableTop + 16;
  doc.moveTo(48, y - 4).lineTo(547, y - 4).stroke('#ccc');

  if (lines.length === 0) {
    doc.text('Aucune ligne', 48, y);
    y += 18;
  } else {
    for (const l of lines) {
      if (y > 720) {
        doc.addPage();
        y = 48;
      }
      const lineLabel = typeof l.label === 'string' ? l.label : '';
      const qty = Number(l.quantity ?? 1) || 0;
      const unit = Number(l.unitPriceHt ?? 0) || 0;
      const vat = Number(l.vatRate ?? 0) || 0;
      const ht = qty * unit;
      const cells = [
        lineLabel,
        String(qty),
        moneyFr(unit, row.currency),
        `${vat}%`,
        moneyFr(ht, row.currency),
      ];
      cells.forEach((cell, i) => {
        doc.text(cell, colX[i], y, { width: colW[i], align: i === 0 ? 'left' : 'right' });
      });
      y += 18;
    }
  }

  const snapEntries = Object.entries(snap).filter(([, v]) => v != null && String(v).trim() !== '');
  if (snapEntries.length > 0) {
    doc.y = y + 12;
    doc.fontSize(12).fillColor('#000').text('Contexte client', { underline: true });
    doc.moveDown(0.4);
    doc.fontSize(9);
    for (const [k, v] of snapEntries) {
      doc.text(`${k} : ${String(v)}`);
    }
  }

  doc.moveDown(1.2);
  const totalsX = 360;
  doc.fontSize(10);
  doc.text(`Sous-total HT : ${moneyFr(decimalNum(row.subtotalHt), row.currency)}`, totalsX, doc.y, {
    align: 'right',
    width: 187,
  });
  doc.text(`TVA : ${moneyFr(decimalNum(row.vatTotal), row.currency)}`, totalsX, doc.y, {
    align: 'right',
    width: 187,
  });
  doc.fontSize(11).text(
    `Total TTC : ${moneyFr(decimalNum(row.totalTtc), row.currency)}`,
    totalsX,
    doc.y,
    { align: 'right', width: 187 },
  );

  if (row.notes?.trim()) {
    doc.moveDown(1);
    doc.fontSize(12).text('Notes', { underline: true });
    doc.moveDown(0.3);
    doc.fontSize(9).text(row.notes, { width: 500 });
  }

  doc.end();

  const buffer = await done;
  return { buffer, filename: pdfFilename(kind, row.referenceCode) };
}
