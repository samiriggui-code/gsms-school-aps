import PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { loadAttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import {
  drawBrandDocumentFooter,
  drawBulletList,
  drawPdfBrandHeader,
  drawPdfInfoBox,
  PDF_CONTENT_WIDTH,
  PDF_PAGE_MARGIN,
} from '@/lib/reports/pdfkit-brand-layout';
import { getSessionConvocationRequiredItems } from '@/lib/vie-scolaire/session-convocation-content';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type SessionConvocationParticipant = {
  participantId: string;
  name: string;
  email: string | null;
};

export type SessionConvocationPdfRow = {
  formationName: string;
  sessionLabel: string;
  startDate: Date | null;
  location: string;
  venueLabel: string | null;
  trainerName: string | null;
  participants: SessionConvocationParticipant[];
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

function startDateLabel(startDate: Date | null, fallback: string): string {
  if (!startDate) return fallback;
  return startDate.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

async function buildConvocationDoc(
  row: SessionConvocationPdfRow,
  brand: AttendancePdfBrandContext,
): Promise<Buffer> {
  const doc = createPortraitPdf();
  const dateStr = startDateLabel(row.startDate, row.sessionLabel);
  const requiredItems = getSessionConvocationRequiredItems(row.formationName);
  const issuedOn = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const renderEmpty = () => {
    const y = drawPdfBrandHeader(doc, brand);
    doc.fontSize(14).fillColor('#0f172a').text('Convocation de session', PDF_PAGE_MARGIN, y, {
      width: PDF_CONTENT_WIDTH,
      align: 'center',
    });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(row.formationName, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(10).fillColor('#334155').text(
      "Aucun stagiaire confirmé sur cette session. Inscrivez les participants depuis la fiche session avant de générer les convocations.",
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

      doc.fontSize(14).fillColor('#0f172a').text('CONVOCATION DE SESSION', PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(9).fillColor('#64748b').text(row.formationName, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Session ${row.sessionLabel} · Document établi le ${issuedOn}`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'center' },
      );
      y = doc.y + 18;

      doc.fontSize(10).fillColor('#0f172a').text(`Madame, Monsieur ${p.name},`, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
      });
      y = doc.y + 12;

      doc.fontSize(10).fillColor('#334155').text(
        `Nous avons le plaisir de vous convoquer à la formation « ${row.formationName} », ` +
          `organisée par ${brand.companyName}, dans le cadre de la session « ${row.sessionLabel} ».`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'justify', lineGap: 3 },
      );
      y = doc.y + 14;

      y = drawPdfInfoBox(doc, y, [
        { label: 'Date et heure', value: dateStr },
        { label: 'Lieu', value: row.location },
        ...(row.venueLabel ? [{ label: 'Salle', value: row.venueLabel }] : []),
        { label: 'Participant', value: p.name },
        ...(p.email ? [{ label: 'Courriel', value: p.email }] : []),
        ...(row.trainerName ? [{ label: 'Formateur', value: row.trainerName }] : []),
      ]);

      doc.fontSize(9).fillColor('#0f172a').text('À apporter le jour de la formation', PDF_PAGE_MARGIN, y);
      y = doc.y + 8;
      y = drawBulletList(doc, y, requiredItems);

      doc.fontSize(9).fillColor('#334155').text(
        "En cas d'empêchement, merci de prévenir l'organisme dans les meilleurs délais afin d'organiser " +
          'un report ou un remplacement selon les conditions générales de formation.',
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'justify', lineGap: 2 },
      );
      y = doc.y + 20;

      doc.fontSize(9).fillColor('#64748b').text(
        'Fait à ' + (row.location.split(',')[0]?.trim() || '—') + ', le ' + issuedOn,
        PDF_PAGE_MARGIN,
        y,
      );
      doc.text('Le responsable pédagogique', PDF_PAGE_MARGIN + 300, y);

      if (row.participants.length > 1) {
        doc.fontSize(7).fillColor('#94a3b8').text(
          `Convocation ${i + 1} / ${row.participants.length}`,
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

/** Génère les convocations (une page par participant confirmé) pour une session de formation. */
export async function buildSessionConvocationPdf(
  row: SessionConvocationPdfRow,
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();
  const buffer = await buildConvocationDoc(row, brand);
  const safeSlug = row.formationName.replace(/[^\w-]+/g, '-').slice(0, 40);
  return { buffer, filename: `session-convocations_${safeSlug}.pdf` };
}
