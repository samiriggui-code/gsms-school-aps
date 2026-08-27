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
import { CONVENTION_STANDARD_CLAUSES, fundingModeLabel } from '@/lib/vie-scolaire/session-convention-content';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type SessionConventionParticipant = {
  participantId: string;
  name: string;
  email: string | null;
  fundingMode: string | null;
};

export type SessionConventionPdfRow = {
  formationName: string;
  formationDescription: string | null;
  sessionLabel: string;
  startDate: Date | null;
  endDate: Date | null;
  location: string;
  trainerName: string | null;
  participants: SessionConventionParticipant[];
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
  if (!startDate) return fallback;
  const fmt = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  if (!endDate || endDate.getTime() === startDate.getTime()) return `Le ${fmt(startDate)}`;
  return `Du ${fmt(startDate)} au ${fmt(endDate)}`;
}

async function buildConventionDoc(
  row: SessionConventionPdfRow,
  brand: AttendancePdfBrandContext,
): Promise<Buffer> {
  const doc = createPortraitPdf();
  const dateRange = dateRangeLabel(row.startDate, row.endDate, row.sessionLabel);
  const issuedOn = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const renderEmpty = () => {
    const y = drawPdfBrandHeader(doc, brand);
    doc.fontSize(14).fillColor('#0f172a').text('Convention de formation professionnelle', PDF_PAGE_MARGIN, y, {
      width: PDF_CONTENT_WIDTH,
      align: 'center',
    });
    doc.moveDown(1.5);
    doc.fontSize(10).fillColor('#334155').text(
      'Aucun stagiaire confirmé sur cette session. Inscrivez les participants avant de générer les conventions.',
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

      doc.fontSize(14).fillColor('#0f172a').text('CONVENTION DE FORMATION PROFESSIONNELLE', PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Établie en application des articles L.6353-1 et suivants du Code du travail · Document établi le ${issuedOn}`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'center' },
      );
      y = doc.y + 18;

      doc.fontSize(9).fillColor('#0f172a').text('Entre les soussignés :', PDF_PAGE_MARGIN, y);
      y = doc.y + 6;
      doc.fontSize(9).fillColor('#334155').text(
        `${brand.companyName}, organisme de formation, ci-après « l'organisme »,`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH },
      );
      y = doc.y + 4;
      doc.text('et', PDF_PAGE_MARGIN, y);
      y = doc.y + 4;
      doc.text(`${p.name}, ci-après « le stagiaire »,`, PDF_PAGE_MARGIN, y, { width: PDF_CONTENT_WIDTH });
      y = doc.y + 14;

      doc.fontSize(9).fillColor('#0f172a').text('Il est convenu ce qui suit :', PDF_PAGE_MARGIN, y);
      y = doc.y + 10;

      y = drawPdfInfoBox(doc, y, [
        { label: 'Intitulé de la formation', value: row.formationName },
        { label: 'Dates', value: dateRange },
        { label: 'Lieu', value: row.location },
        ...(row.trainerName ? [{ label: 'Formateur', value: row.trainerName }] : []),
        { label: 'Stagiaire', value: p.name },
        ...(p.email ? [{ label: 'Courriel', value: p.email }] : []),
        { label: 'Financement', value: fundingModeLabel(p.fundingMode) },
      ]);

      if (row.formationDescription?.trim()) {
        doc.fontSize(9).fillColor('#0f172a').text('Objectifs et contenu de la formation', PDF_PAGE_MARGIN, y);
        y = doc.y + 6;
        doc.fontSize(9).fillColor('#334155').text(row.formationDescription.trim(), PDF_PAGE_MARGIN, y, {
          width: PDF_CONTENT_WIDTH,
          align: 'justify',
          lineGap: 2,
        });
        y = doc.y + 14;
      }

      doc.fontSize(9).fillColor('#0f172a').text('Engagements réciproques', PDF_PAGE_MARGIN, y);
      y = doc.y + 8;
      y = drawBulletList(doc, y, CONVENTION_STANDARD_CLAUSES);

      doc.fontSize(9).fillColor('#64748b').text(
        'Fait à ' + (row.location.split(',')[0]?.trim() || '—') + ', le ' + issuedOn + ', en deux exemplaires.',
        PDF_PAGE_MARGIN,
        y,
      );
      y = doc.y + 24;
      doc.text("Pour l'organisme", PDF_PAGE_MARGIN, y);
      doc.text('Le stagiaire', PDF_PAGE_MARGIN + 300, y);
      doc.text('(signature)', PDF_PAGE_MARGIN, y + 40);
      doc.text('(signature)', PDF_PAGE_MARGIN + 300, y + 40);

      if (row.participants.length > 1) {
        doc.fontSize(7).fillColor('#94a3b8').text(
          `Convention ${i + 1} / ${row.participants.length}`,
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

/** Génère les conventions de formation (une page par participant confirmé) pour une session. */
export async function buildSessionConventionPdf(
  row: SessionConventionPdfRow,
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();
  const buffer = await buildConventionDoc(row, brand);
  const safeSlug = row.formationName.replace(/[^\w-]+/g, '-').slice(0, 40);
  return { buffer, filename: `session-conventions_${safeSlug}.pdf` };
}
