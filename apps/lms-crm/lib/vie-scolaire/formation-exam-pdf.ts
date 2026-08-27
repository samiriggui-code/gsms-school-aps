import PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { loadAttendancePdfBrandContext, loadImageBuffer } from '@/lib/instructor/attendance-pdf-brand';
import { buildEmargementReportPdfBuffer } from '@/lib/instructor/session-attendance-pdf';
import {
  buildExamEmargementReportData,
  formatExamParticipantName,
  type ExamPdfParticipantRow,
} from '@/lib/vie-scolaire/formation-exam-emargement-payload';
import {
  drawBrandDocumentFooter,
  drawBulletList,
  drawPdfBrandFooter,
  drawPdfBrandHeader,
  drawPdfInfoBox,
  PDF_CONTENT_WIDTH,
  PDF_PAGE_MARGIN,
} from '@/lib/reports/pdfkit-brand-layout';
import { getExamConvocationRequiredItems } from '@/lib/vie-scolaire/formation-exam-convocation-content';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type FormationExamPdfDocType = 'candidats' | 'emargement' | 'convocation' | 'jury';

export type FormationExamPdfRow = {
  scheduledAt: Date | null;
  juryPresidentName: string | null;
  juryMemberNames: unknown;
  notes: string | null;
  venueRoom: {
    name: string;
    shortCode: string | null;
    floorLabel: string | null;
  } | null;
  session: {
    dateDisplayLabel: string;
    location: string;
    examDate: Date | null;
    traineesMin: number | null;
    traineesMax: number | null;
    trainer: {
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
    formation: { name: string; duration: string | null } | null;
    participants: ExamPdfParticipantRow[];
  };
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

function examDateLabel(examDate: Date | null | undefined): string {
  if (!examDate) return 'Date à confirmer auprès de l\'organisme';
  return examDate.toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function venueLabel(venueRoom: FormationExamPdfRow['venueRoom']): string {
  if (!venueRoom) return '';
  return [venueRoom.name, venueRoom.shortCode ? `(${venueRoom.shortCode})` : null]
    .filter(Boolean)
    .join(' ');
}

async function buildEmargementPdf(row: FormationExamPdfRow) {
  const payload = buildExamEmargementReportData(row);
  const avatarBuffers = await Promise.all(
    payload.participants.map((p) => loadImageBuffer(p.avatarUrl)),
  );
  const { buffer } = await buildEmargementReportPdfBuffer(payload, avatarBuffers);
  const safeSlug = payload.formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  const filename = `examen-emargement_${safeSlug}_${payload.attendanceDate}.pdf`;
  return { buffer, filename };
}

async function buildConvocationPdf(row: FormationExamPdfRow, brand: AttendancePdfBrandContext) {
  const doc = createPortraitPdf();
  const formationName = row.session.formation?.name ?? 'Formation';
  const examDate = row.scheduledAt ?? row.session.examDate;
  const dateStr = examDateLabel(examDate);
  const room = venueLabel(row.venueRoom);
  const location = row.session.location;
  const participants = row.session.participants;
  const requiredItems = getExamConvocationRequiredItems(formationName);
  const issuedOn = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const trainerName =
    row.session.trainer?.name?.trim() ||
    [row.session.trainer?.firstName, row.session.trainer?.lastName].filter(Boolean).join(' ') ||
    null;

  const renderEmpty = () => {
    let y = drawPdfBrandHeader(doc, brand);
    doc.fontSize(14).fillColor('#0f172a').text('Convocation à l\'examen', PDF_PAGE_MARGIN, y, {
      width: PDF_CONTENT_WIDTH,
      align: 'center',
    });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor('#64748b').text(formationName, { width: PDF_CONTENT_WIDTH, align: 'center' });
    doc.moveDown(1.5);
    doc.fontSize(10).fillColor('#334155').text(
      'Aucun stagiaire confirmé sur cette session. Inscrivez les candidats depuis la fiche session avant de générer les convocations.',
      PDF_PAGE_MARGIN,
      doc.y,
      { width: PDF_CONTENT_WIDTH, align: 'center' },
    );
    drawBrandDocumentFooter(doc, brand);
  };

  if (participants.length === 0) {
    renderEmpty();
  } else {
    for (let i = 0; i < participants.length; i += 1) {
      if (i > 0) doc.addPage();
      const p = participants[i];
      const candidateName = formatExamParticipantName(p.user);

      let y = drawPdfBrandHeader(doc, brand);

      doc.fontSize(14).fillColor('#0f172a').text('CONVOCATION À L\'EXAMEN', PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(9).fillColor('#64748b').text(formationName, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
        align: 'center',
      });
      y = doc.y + 4;
      doc.fontSize(8).fillColor('#94a3b8').text(
        `Session ${row.session.dateDisplayLabel} · Document établi le ${issuedOn}`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'center' },
      );
      y = doc.y + 18;

      doc.fontSize(10).fillColor('#0f172a').text(`Madame, Monsieur ${candidateName},`, PDF_PAGE_MARGIN, y, {
        width: PDF_CONTENT_WIDTH,
      });
      y = doc.y + 12;

      doc.fontSize(10).fillColor('#334155').text(
        `Nous avons l'honneur de vous convoquer à l'examen final de la formation « ${formationName} », ` +
          `organisé par ${brand.companyName}, dans le cadre de la session « ${row.session.dateDisplayLabel} ».`,
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'justify', lineGap: 3 },
      );
      y = doc.y + 14;

      y = drawPdfInfoBox(doc, y, [
        { label: 'Date et heure', value: dateStr },
        { label: 'Lieu', value: location },
        ...(room ? [{ label: 'Salle d\'examen', value: room }] : []),
        { label: 'Candidat', value: candidateName },
        { label: 'Courriel', value: p.user.email },
        ...(trainerName ? [{ label: 'Référent pédagogique', value: trainerName }] : []),
      ]);

      doc.fontSize(9).fillColor('#0f172a').text('Pièces et équipements à présenter le jour de l\'examen', PDF_PAGE_MARGIN, y);
      y = doc.y + 8;
      y = drawBulletList(doc, y, requiredItems);

      doc.fontSize(9).fillColor('#334155').text(
        'Tout retard ou absence non justifiée pourra entraîner le report de l\'examen selon les conditions générales de formation. ' +
          'En cas d\'empêchement, vous devez prévenir l\'organisme dans les meilleurs délais.',
        PDF_PAGE_MARGIN,
        y,
        { width: PDF_CONTENT_WIDTH, align: 'justify', lineGap: 2 },
      );
      y = doc.y + 20;

      doc.fontSize(9).fillColor('#64748b').text('Fait à ' + (location.split(',')[0]?.trim() || '—') + ', le ' + issuedOn, PDF_PAGE_MARGIN, y);
      doc.text('Le responsable pédagogique', PDF_PAGE_MARGIN + 300, y);

      if (row.juryPresidentName?.trim()) {
        doc.fontSize(8).fillColor('#475569').text(
          `Président du jury : ${row.juryPresidentName.trim()}`,
          PDF_PAGE_MARGIN + 300,
          y + 14,
          { width: 180 },
        );
      }

      if (participants.length > 1) {
        doc.fontSize(7).fillColor('#94a3b8').text(
          `Convocation ${i + 1} / ${participants.length}`,
          PDF_PAGE_MARGIN,
          730,
          { width: PDF_CONTENT_WIDTH, align: 'right' },
        );
      }

      drawBrandDocumentFooter(doc, brand);
    }
  }

  const safeSlug = formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  const buffer = await collectPdfBuffer(doc);
  return { buffer, filename: `examen-convocations_${safeSlug}.pdf` };
}

async function buildCandidatsPdf(row: FormationExamPdfRow, brand: AttendancePdfBrandContext) {
  const payload = buildExamEmargementReportData(row);
  const avatarBuffers = await Promise.all(
    payload.participants.map((p) => loadImageBuffer(p.avatarUrl)),
  );
  const { buffer } = await buildEmargementReportPdfBuffer(
    {
      ...payload,
      slotLabel: 'Liste candidats examen',
      journalNotes: null,
    },
    avatarBuffers,
  );
  const safeSlug = payload.formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  return { buffer, filename: `examen-liste-candidats_${safeSlug}.pdf` };
}

async function buildJuryPdf(row: FormationExamPdfRow, brand: AttendancePdfBrandContext) {
  const doc = createPortraitPdf();
  const formationName = row.session.formation?.name ?? 'Formation';
  const juryMembers = Array.isArray(row.juryMemberNames)
    ? row.juryMemberNames.filter((v): v is string => typeof v === 'string')
    : [];

  let y = drawPdfBrandHeader(doc, brand);
  doc.fontSize(13).fillColor('#0f172a').text('Fiche jury — examen', PDF_PAGE_MARGIN, y, {
    width: PDF_CONTENT_WIDTH,
    align: 'center',
  });
  y = doc.y + 6;
  doc.fontSize(9).fillColor('#64748b').text(`${formationName} · ${row.session.dateDisplayLabel}`, PDF_PAGE_MARGIN, y, {
    width: PDF_CONTENT_WIDTH,
    align: 'center',
  });
  y = doc.y + 16;

  y = drawPdfInfoBox(doc, y, [
    { label: 'Date examen', value: examDateLabel(row.scheduledAt ?? row.session.examDate) },
    { label: 'Président', value: row.juryPresidentName?.trim() || '—' },
    { label: 'Membres', value: juryMembers.length ? juryMembers.join(', ') : '—' },
    { label: 'Lieu', value: [row.session.location, venueLabel(row.venueRoom)].filter(Boolean).join(' — ') },
  ]);

  doc.fontSize(9).fillColor('#0f172a').text('Grille de délibération', PDF_PAGE_MARGIN, y);
  y = doc.y + 8;

  const colW = [24, 180, 70, 70, PDF_CONTENT_WIDTH - 344] as const;
  const headers = ['N°', 'Candidat', 'QCM /20', 'Pratique', 'Décision'];
  doc.rect(PDF_PAGE_MARGIN, y, PDF_CONTENT_WIDTH, 14).fill('#1e293b');
  doc.fillColor('#fff').fontSize(7);
  let x = PDF_PAGE_MARGIN + 4;
  headers.forEach((h, i) => {
    doc.text(h, x, y + 3, { width: colW[i] - 4 });
    x += colW[i];
  });
  y += 16;
  doc.fillColor('#000').fontSize(8);

  const rows = row.session.participants;
  if (rows.length === 0) {
    doc.text('Aucun candidat inscrit.', PDF_PAGE_MARGIN, y + 6, { width: PDF_CONTENT_WIDTH, align: 'center' });
  } else {
    for (let i = 0; i < rows.length; i += 1) {
      const p = rows[i];
      const name = formatExamParticipantName(p.user);
      if (i % 2 === 1) doc.rect(PDF_PAGE_MARGIN, y, PDF_CONTENT_WIDTH, 22).fill('#f8fafc');
      doc.fillColor('#475569').text(String(i + 1), PDF_PAGE_MARGIN + 4, y + 6, { width: colW[0] });
      doc.fillColor('#0f172a').text(name, PDF_PAGE_MARGIN + colW[0] + 4, y + 6, { width: colW[1] - 8 });
      x = PDF_PAGE_MARGIN + colW[0] + colW[1];
      for (let c = 2; c < colW.length; c += 1) {
        doc.rect(x + 2, y + 3, colW[c] - 6, 16).stroke('#cbd5e1');
        x += colW[c];
      }
      y += 22;
      doc.fillColor('#000');
    }
  }

  drawPdfBrandFooter(doc, brand);
  const safeSlug = formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  const buffer = await collectPdfBuffer(doc);
  return { buffer, filename: `examen-fiche-jury_${safeSlug}.pdf` };
}

export async function generateFormationExamPdf(
  docType: FormationExamPdfDocType,
  row: FormationExamPdfRow,
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();

  switch (docType) {
    case 'emargement':
      return buildEmargementPdf(row);
    case 'convocation':
      return buildConvocationPdf(row, brand);
    case 'candidats':
      return buildCandidatsPdf(row, brand);
    case 'jury':
      return buildJuryPdf(row, brand);
    default:
      throw new Error('DOC_TYPE_INVALID');
  }
}

export function buildFormationExamPdfRowFromPrisma(row: {
  scheduledAt: Date | null;
  juryPresidentName: string | null;
  juryMemberNames: unknown;
  notes: string | null;
  venueRoom: FormationExamPdfRow['venueRoom'];
  session: {
    dateDisplayLabel: string;
    location: string;
    examDate: Date | null;
    traineesMin: number | null;
    traineesMax: number | null;
    examVenueRoom: FormationExamPdfRow['venueRoom'];
    trainer: FormationExamPdfRow['session']['trainer'];
    formation: { name: string; duration: string | null } | null;
    participants: ExamPdfParticipantRow[];
  };
}): FormationExamPdfRow {
  return {
    scheduledAt: row.scheduledAt,
    juryPresidentName: row.juryPresidentName,
    juryMemberNames: row.juryMemberNames,
    notes: row.notes,
    venueRoom: row.venueRoom ?? row.session.examVenueRoom ?? null,
    session: {
      dateDisplayLabel: row.session.dateDisplayLabel,
      location: row.session.location,
      examDate: row.session.examDate,
      traineesMin: row.session.traineesMin,
      traineesMax: row.session.traineesMax,
      trainer: row.session.trainer,
      formation: row.session.formation,
      participants: row.session.participants,
    },
  };
}
