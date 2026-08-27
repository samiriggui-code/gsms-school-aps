import PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { loadAttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import {
  drawBrandDocumentFooter,
  drawPdfBrandHeader,
  drawPdfInfoBox,
  PDF_CONTENT_WIDTH,
  PDF_PAGE_MARGIN,
} from '@/lib/reports/pdfkit-brand-layout';
import { buildCertificateStatement, CERTIFICATE_LEGAL_MENTION } from '@/lib/vie-scolaire/session-certificate-content';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type SessionCertificateParticipant = {
  participantId: string;
  name: string;
};

export type SessionCertificatePdfRow = {
  formationName: string;
  /** Durée contractuelle de la formation telle que déclarée sur la fiche formation (ex. "35 heures"). */
  formationDuration: string | null;
  sessionLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string;
  trainerName: string | null;
  participants: SessionCertificateParticipant[];
};

function createPortraitPdf(): PdfDoc {
  return new PDFDocument({ size: 'A4', margin: PDF_PAGE_MARGIN });
}

async function collectPdfBuffer(doc: PdfDoc): Promise<Buffer> {
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  doc.end();
  return done;
}

function dateRangeLabel(startDate: Date | null, endDate: Date | null, fallback: string): string {
  if (!startDate) return `Réalisée du ${fallback}`;
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!endDate || endDate.getTime() === startDate.getTime()) return `Réalisée le ${fmt(startDate)}`;
  return `Réalisée du ${fmt(startDate)} au ${fmt(endDate)}`;
}

async function buildCertificateDoc(
  row: SessionCertificatePdfRow,
  brand: AttendancePdfBrandContext,
): Promise<Buffer> {
  const doc = createPortraitPdf();
  const dateRange = dateRangeLabel(row.startDate, row.endDate, row.sessionLabel);
  const issuedOn = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderEmpty = () => {
    const y = drawPdfBrandHeader(doc, brand);
    doc.fontSize(14).fillColor('#0f172a').text('Certificat de réalisation', PDF_PAGE_MARGIN, y, {
      width: PDF_CONTENT_WIDTH,
      align: 'center',
    });
    doc.moveDown(1.5);
    doc.fontSize(10).fillColor('#334155').text(
      'Aucun stagiaire confirmé sur cette session. Inscrivez les participants avant de générer les certificats.',
      PDF_PAGE_MARGIN,
      doc.y,
      { width: PDF_CONTENT_WIDTH, align: 'center' },
    );
    drawBrandDocumentFooter(doc, brand);
  };

  if (row.participants.length === 0) {
    renderEmpty();
  } else {
    for (let i = 0; i < row.participants.length; i += 1) {
      if (i > 0) doc.addPage();
      const p = row.participants[i];

      let y = drawPdfBrandHeader(doc, brand);

      doc.fontSize(16).fillColor('#0f172a').text('CERTIFICAT DE RÉALISATION', PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(8).fillColor('#94a3b8').text(CERTIFICATE_LEGAL_MENTION, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 24;

      const statement = buildCertificateStatement({
        participantName: p.name,
        formationName: row.formationName,
        dateRangeLabel: dateRange,
        hoursLabel: row.formationDuration,
      });
      doc.fontSize(11).fillColor('#0f172a').text(statement, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'justify',
        lineGap: 4,
      });
      y = doc.y + 20;

      y = drawPdfInfoBox(doc, y, [
        { label: 'Stagiaire', value: p.name },
        { label: 'Formation', value: row.formationName },
        { label: 'Période', value: dateRange },
        { label: 'Lieu', value: row.location },
        ...(row.formationDuration ? [{ label: 'Durée', value: row.formationDuration }] : []),
        ...(row.trainerName ? [{ label: 'Formateur', value: row.trainerName }] : []),
      ]);

      doc.fontSize(9).fillColor('#334155').text(
        "Ce certificat de réalisation atteste de la présence et de la participation du stagiaire à " +
          "l'action de formation. Il ne préjuge pas des résultats obtenus à une évaluation ou un examen, " +
          'qui font le cas échéant l\'objet d\'une attestation ou d\'un certificat distinct.',
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'justify', lineGap: 2 },
      );
      y = doc.y + 30;

      doc.fontSize(9).fillColor('#64748b').text(
        'Fait à ' + (row.location.split(',')[0]?.trim() || '—') + ', le ' + issuedOn,
        PDF_PAGE_MARGIN,
        y,
      );
      y = doc.y + 30;
      doc.text("Pour l'organisme de formation,", PDF_PAGE_MARGIN, y);
      doc.text('(cachet et signature)', PDF_PAGE_MARGIN, y + 40);

      if (row.participants.length > 1) {
        doc.fontSize(7).fillColor('#94a3b8').text(
          `Certificat ${i + 1} / ${row.participants.length}`,
          PDF_PAGE_MARGIN,
          730,
          { width: PDF_CONTENT_WIDTH, align: 'right' },
        );
      }

      drawBrandDocumentFooter(doc, brand);
    }
  }

  return collectPdfBuffer(doc);
}

/** Génère les certificats de réalisation (une page par participant confirmé) pour une session. */
export async function buildSessionCertificatePdf(
  row: SessionCertificatePdfRow,
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();
  const buffer = await buildCertificateDoc(row, brand);
  const safeSlug = row.formationName.replace(/[^\w-]+/g, '-').slice(0, 40);
  return { buffer, filename: `session-certificats_${safeSlug}.pdf` };
}
