import type PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';

type PdfDoc = InstanceType<typeof PDFDocument>;

export const PDF_PAGE_MARGIN = 48;
export const PDF_CONTENT_WIDTH = 499;

/** En-tête institutionnel (logo, coordonnées, Qualiopi) — aligné sur les PDF émargement. */
export function drawPdfBrandHeader(doc: PdfDoc, brand: AttendancePdfBrandContext): number {
  const topY = PDF_PAGE_MARGIN;
  let headerBottom = topY + 52;

  if (brand.logoBuffer) {
    try {
      doc.image(brand.logoBuffer, PDF_PAGE_MARGIN, topY, { fit: [140, 48] });
    } catch {
      doc.fontSize(14).text(brand.companyName, PDF_PAGE_MARGIN, topY);
    }
  } else {
    doc.fontSize(14).text(brand.companyName, PDF_PAGE_MARGIN, topY);
  }

  const infoX = 200;
  doc.fontSize(8).fillColor('#333');
  doc.text(brand.companyName, infoX, topY, { width: 355 });
  let infoY = doc.y + 2;
  if (brand.addressLine) {
    doc.text(brand.addressLine, infoX, infoY, { width: 355 });
    infoY = doc.y + 2;
  }
  const legalBits = [
    brand.siret ? `SIRET : ${brand.siret}` : null,
    brand.ndaNumber ? `NDA : ${brand.ndaNumber}` : null,
    brand.qualiopiRef ? `Qualiopi : ${brand.qualiopiRef}` : null,
  ].filter(Boolean);
  if (legalBits.length) {
    doc.text(legalBits.join('  ·  '), infoX, infoY, { width: 355 });
    infoY = doc.y + 2;
  }
  const contactBits = [brand.phone, brand.email, brand.website].filter(Boolean);
  if (contactBits.length) {
    doc.text(contactBits.join('  ·  '), infoX, infoY, { width: 355 });
    infoY = doc.y + 2;
  }

  if (brand.qualiopiLogoBuffer) {
    try {
      doc.image(brand.qualiopiLogoBuffer, 480, topY, { fit: [75, 36] });
      headerBottom = Math.max(headerBottom, topY + 40);
    } catch {
      /* ignore */
    }
  }

  headerBottom = Math.max(headerBottom, infoY + 4);
  doc.moveTo(PDF_PAGE_MARGIN, headerBottom).lineTo(PDF_PAGE_MARGIN + PDF_CONTENT_WIDTH, headerBottom).stroke('#bbb');
  return headerBottom + 10;
}

export function drawPdfBrandFooter(doc: PdfDoc, brand: AttendancePdfBrandContext, note?: string) {
  const footerY = 770;
  doc.fontSize(8).fillColor('#666');
  const line = [
    brand.companyName,
    brand.addressLine,
    [brand.siret ? `SIRET ${brand.siret}` : null, brand.ndaNumber ? `NDA ${brand.ndaNumber}` : null]
      .filter(Boolean)
      .join(' · '),
  ]
    .filter(Boolean)
    .join(' — ');
  doc.text(line, PDF_PAGE_MARGIN, footerY, { width: PDF_CONTENT_WIDTH, align: 'center' });
  if (note?.trim()) {
    doc.text(note.trim(), PDF_PAGE_MARGIN, footerY + 14, { width: PDF_CONTENT_WIDTH, align: 'center' });
  }
  doc.fillColor('#000');
}

/**
 * Pied de page « document officiel » (logo Qualiopi, mentions légales, contact) — utilisé par tous
 * les documents personnalisés multi-pages (convocations examen, convocations session, à terme
 * conventions/certificats). Distinct de `drawPdfBrandFooter` (pied simple une ligne).
 */
export function drawBrandDocumentFooter(doc: PdfDoc, brand: AttendancePdfBrandContext) {
  const footerY = 755;
  doc.moveTo(PDF_PAGE_MARGIN, footerY - 8)
    .lineTo(PDF_PAGE_MARGIN + PDF_CONTENT_WIDTH, footerY - 8)
    .stroke('#e2e8f0');

  if (brand.qualiopiLogoBuffer) {
    try {
      doc.image(brand.qualiopiLogoBuffer, PDF_PAGE_MARGIN, footerY, { fit: [72, 34] });
    } catch {
      /* ignore */
    }
  }

  const note = [
    brand.companyName,
    [brand.siret ? `SIRET ${brand.siret}` : null, brand.ndaNumber ? `NDA ${brand.ndaNumber}` : null]
      .filter(Boolean)
      .join(' · '),
    brand.qualiopiRef ? `Certification Qualiopi — ${brand.qualiopiRef}` : null,
  ]
    .filter(Boolean)
    .join(' — ');

  doc.fontSize(7).fillColor('#64748b').text(note, PDF_PAGE_MARGIN + 84, footerY + 6, {
    width: PDF_CONTENT_WIDTH - 84,
    align: 'center',
  });

  const contact = [brand.phone, brand.email, brand.website].filter(Boolean).join(' · ');
  if (contact) {
    doc.text(contact, PDF_PAGE_MARGIN + 84, footerY + 18, {
      width: PDF_CONTENT_WIDTH - 84,
      align: 'center',
    });
  }
  doc.fillColor('#000');
}

/** Liste à puces sobre (pièces à présenter, consignes...), retourne le nouveau curseur Y. */
export function drawBulletList(doc: PdfDoc, y: number, items: readonly string[]): number {
  doc.fontSize(9).fillColor('#334155');
  let cy = y;
  for (const item of items) {
    doc.text('•', PDF_PAGE_MARGIN + 8, cy, { continued: true, width: 12 });
    doc.text(` ${item}`, { width: PDF_CONTENT_WIDTH - 24, lineGap: 1 });
    cy = doc.y + 4;
  }
  doc.fillColor('#000');
  return cy + 6;
}

/** Encadré « clé / valeur » (infos pratiques : date, lieu, participant...). */
export function drawPdfInfoBox(
  doc: PdfDoc,
  y: number,
  rows: Array<{ label: string; value: string }>,
): number {
  const boxH = 16 + rows.length * 18;
  doc.roundedRect(PDF_PAGE_MARGIN, y, PDF_CONTENT_WIDTH, boxH, 4).fillAndStroke('#f8fafc', '#e2e8f0');
  let cy = y + 10;
  doc.fillColor('#334155').fontSize(9);
  for (const row of rows) {
    doc.font('Helvetica-Bold').text(`${row.label}`, PDF_PAGE_MARGIN + 12, cy, { continued: true });
    doc.font('Helvetica').text(`  ${row.value}`, { width: PDF_CONTENT_WIDTH - 24 });
    cy += 18;
  }
  doc.fillColor('#000');
  return y + boxH + 14;
}
