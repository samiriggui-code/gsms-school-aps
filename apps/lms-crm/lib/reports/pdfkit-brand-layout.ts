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
