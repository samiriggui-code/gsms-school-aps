import PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { loadAttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type AttendancePdfParticipant = {
  index: number;
  name: string;
  email: string;
};

export type AttendancePdfInput = {
  formationName: string;
  sessionLabel: string;
  location: string;
  trainerName: string;
  attendanceDate: string;
  participants: AttendancePdfParticipant[];
};

export type AttendanceBlankPdfInput = {
  formationName?: string;
  sessionLabel?: string;
  location?: string;
  trainerName?: string;
  attendanceDate?: string;
  /** Nombre de lignes vides à imprimer (défaut 18). */
  blankRowCount?: number;
};

const PAGE_MARGIN = 40;
const CONTENT_WIDTH = 515;
const BLANK_ROW_COUNT_DEFAULT = 18;

function formatDisplayDate(isoDate: string): string {
  const d = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function createPdfDocument(): PdfDoc {
  return new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, layout: 'portrait' });
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

function drawBrandHeader(doc: PdfDoc, brand: AttendancePdfBrandContext): number {
  const topY = PAGE_MARGIN;
  let headerBottom = topY + 52;

  if (brand.logoBuffer) {
    try {
      doc.image(brand.logoBuffer, PAGE_MARGIN, topY, { fit: [140, 48] });
    } catch {
      doc.fontSize(14).text(brand.companyName, PAGE_MARGIN, topY);
    }
  } else {
    doc.fontSize(14).text(brand.companyName, PAGE_MARGIN, topY);
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
  doc.moveTo(PAGE_MARGIN, headerBottom).lineTo(PAGE_MARGIN + CONTENT_WIDTH, headerBottom).stroke('#bbb');
  return headerBottom + 10;
}

function drawTitle(doc: PdfDoc, title: string, subtitle?: string) {
  doc.fontSize(13).fillColor('#111').text(title, PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  if (subtitle) {
    doc.moveDown(0.25);
    doc.fontSize(9).fillColor('#555').text(subtitle, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
  }
  doc.moveDown(0.6);
  doc.fillColor('#000');
}

function drawFieldLine(
  doc: PdfDoc,
  label: string,
  value: string | undefined,
  opts?: { blank?: boolean },
) {
  const y = doc.y;
  doc.fontSize(9).fillColor('#333').text(`${label} :`, PAGE_MARGIN, y, { continued: false });
  const lineX = PAGE_MARGIN + 95;
  const lineW = CONTENT_WIDTH - 95;

  if (opts?.blank || !value?.trim()) {
    doc
      .moveTo(lineX, y + 10)
      .lineTo(lineX + lineW, y + 10)
      .stroke('#999');
    doc.y = y + 16;
  } else {
    doc.fontSize(9).fillColor('#000').text(value.trim(), lineX, y, { width: lineW });
    doc.y = Math.max(doc.y, y + 14);
  }
}

type AttendanceTableMode = 'filled' | 'blank';

function drawAttendanceTable(
  doc: PdfDoc,
  mode: AttendanceTableMode,
  participants: AttendancePdfParticipant[],
  blankRowCount: number,
) {
  const colX = [PAGE_MARGIN, PAGE_MARGIN + 28, PAGE_MARGIN + 210, PAGE_MARGIN + 400] as const;
  const colW = [24, 170, 180, 115] as const;
  const headers = ['#', 'Nom et prénom', mode === 'blank' ? 'Observations' : 'Email', 'Signature'];
  const rowHeight = 28;

  let y = doc.y;
  doc.fontSize(8).fillColor('#333');
  headers.forEach((h, i) => {
    doc.text(h, colX[i], y, { width: colW[i], align: i === 3 ? 'center' : 'left' });
  });
  y += 14;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).stroke('#999');
  y += 6;

  doc.fontSize(9).fillColor('#000');

  const rowCount = mode === 'blank' ? blankRowCount : Math.max(participants.length, 1);

  for (let i = 0; i < rowCount; i += 1) {
    if (y > 720) {
      doc.addPage();
      y = PAGE_MARGIN + 8;
    }

    const p = participants[i];
    doc.text(String(i + 1), colX[0], y + 8, { width: colW[0] });

    if (mode === 'blank') {
      doc.rect(colX[1], y + 4, colW[1], rowHeight - 8).stroke('#ccc');
      doc.rect(colX[2], y + 4, colW[2], rowHeight - 8).stroke('#ccc');
    } else if (p) {
      doc.text(p.name, colX[1], y + 8, { width: colW[1] });
      doc.fontSize(8).text(p.email, colX[2], y + 8, { width: colW[2] });
      doc.fontSize(9);
    } else {
      doc.text('Aucun stagiaire inscrit', colX[1], y + 8, { width: colW[1] });
    }

    doc.rect(colX[3], y + 4, colW[3], rowHeight - 8).stroke('#bbb');
    y += rowHeight;
  }

  doc.y = y + 12;
}

function drawFooter(doc: PdfDoc, brand: AttendancePdfBrandContext, trainerName?: string) {
  doc.fontSize(8).fillColor('#666');
  doc.text(
    'Document de présence — à conserver 3 ans minimum (Code du travail, art. L.6353-1). ' +
      'La session présentielle fait foi ; l’e-formation accompagne la révision des modules vus en classe.',
    PAGE_MARGIN,
    doc.y,
    { width: CONTENT_WIDTH },
  );
  doc.moveDown(0.8);

  const sigY = doc.y;
  doc.fontSize(9).fillColor('#333').text('Formateur', PAGE_MARGIN, sigY);
  doc.text('Cachet / signature organisme', PAGE_MARGIN + 280, sigY);
  doc.moveDown(0.35);
  const lineY = doc.y + 18;
  doc.moveTo(PAGE_MARGIN, lineY).lineTo(PAGE_MARGIN + 220, lineY).stroke('#999');
  doc.moveTo(PAGE_MARGIN + 280, lineY).lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY).stroke('#999');

  if (trainerName?.trim()) {
    doc.fontSize(8).fillColor('#444').text(trainerName.trim(), PAGE_MARGIN, lineY + 4, { width: 220 });
  }

  doc.y = lineY + 28;
  doc.fontSize(7).fillColor('#888').text(brand.companyName, PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
}

async function renderAttendancePdf(
  render: (doc: PdfDoc, brand: AttendancePdfBrandContext) => void,
): Promise<Buffer> {
  const brand = await loadAttendancePdfBrandContext();
  const doc = createPdfDocument();
  const startY = drawBrandHeader(doc, brand);
  doc.y = startY;
  render(doc, brand);
  return collectPdfBuffer(doc);
}

/** Feuille pré-remplie avec la liste des stagiaires inscrits. */
export async function buildSessionAttendancePdfBuffer(
  input: AttendancePdfInput,
): Promise<{ buffer: Buffer; filename: string }> {
  const safeSlug = input.formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  const filename = `feuille-presence_${safeSlug}_${input.attendanceDate}.pdf`;

  const buffer = await renderAttendancePdf((doc, brand) => {
    drawTitle(
      doc,
      'Feuille de présence',
      'Session de formation — émargement quotidien',
    );

    drawFieldLine(doc, 'Formation', input.formationName);
    drawFieldLine(doc, 'Session', input.sessionLabel);
    drawFieldLine(doc, 'Lieu', input.location);
    drawFieldLine(doc, 'Formateur', input.trainerName);
    drawFieldLine(doc, 'Date', formatDisplayDate(input.attendanceDate));

    doc.moveDown(0.4);
    doc.fontSize(8).fillColor('#555').text(
      'Imprimer en fin de journée, faire signer chaque stagiaire, scanner puis archiver (portail formateur ou CRM).',
      { width: CONTENT_WIDTH },
    );
    doc.moveDown(0.6);
    doc.fillColor('#000');

    drawAttendanceTable(doc, 'filled', input.participants, 0);
    drawFooter(doc, brand, input.trainerName);
  });

  return { buffer, filename };
}

/**
 * Modèle vierge imprimable (sans liste CRM) — secours si la génération automatique échoue.
 * Champs session pré-remplis si fournis, sinon lignes à compléter à la main.
 */
export async function buildBlankSessionAttendancePdfBuffer(
  input: AttendanceBlankPdfInput = {},
): Promise<{ buffer: Buffer; filename: string }> {
  const attendanceDate = input.attendanceDate ?? new Date().toISOString().slice(0, 10);
  const blankRowCount = input.blankRowCount ?? BLANK_ROW_COUNT_DEFAULT;
  const filename = `feuille-presence-vierge_${attendanceDate}.pdf`;

  const buffer = await renderAttendancePdf((doc, brand) => {
    drawTitle(
      doc,
      'Feuille de présence — modèle vierge',
      'À imprimer et compléter manuellement (secours / dépannage)',
    );

    drawFieldLine(doc, 'Formation', input.formationName, { blank: !input.formationName?.trim() });
    drawFieldLine(doc, 'Session', input.sessionLabel, { blank: !input.sessionLabel?.trim() });
    drawFieldLine(doc, 'Lieu', input.location, { blank: !input.location?.trim() });
    drawFieldLine(doc, 'Formateur', input.trainerName, { blank: !input.trainerName?.trim() });
    drawFieldLine(
      doc,
      'Date',
      input.attendanceDate ? formatDisplayDate(input.attendanceDate) : undefined,
      { blank: !input.attendanceDate?.trim() },
    );
    drawFieldLine(doc, 'Horaires', undefined, { blank: true });

    doc.moveDown(0.3);
    doc.fontSize(8).fillColor('#555').text(
      'Compléter à la main les cases ci-dessous. Une ligne par stagiaire. ' +
        'Conserver le document signé et le scanner pour archivage.',
      { width: CONTENT_WIDTH },
    );
    doc.moveDown(0.5);
    doc.fillColor('#000');

    drawAttendanceTable(doc, 'blank', [], blankRowCount);
    drawFooter(doc, brand, input.trainerName);
  });

  return { buffer, filename };
}
