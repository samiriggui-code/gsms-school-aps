import PDFDocument from 'pdfkit';
import type { AttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { loadAttendancePdfBrandContext, loadImageBuffer } from '@/lib/instructor/attendance-pdf-brand';
import type { EmargementReportData } from '@/lib/suivi-formations/emargement-report-types';
import { formatEmargementDateFr } from '@/lib/suivi-formations/emargement-report-types';

type PdfDoc = InstanceType<typeof PDFDocument>;

export type AttendancePdfParticipant = {
  index: number;
  name: string;
  email: string;
  /** Buffer image optionnel (avatar stagiaire). */
  avatarBuffer?: Buffer | null;
};

export type AttendancePdfInput = {
  formationName: string;
  sessionLabel: string;
  location: string;
  trainerName: string;
  attendanceDate: string;
  /** Matin | Après-midi */
  slotLabel?: string;
  participants: AttendancePdfParticipant[];
};

export type AttendanceBlankPdfInput = {
  formationName?: string;
  sessionLabel?: string;
  location?: string;
  trainerName?: string;
  attendanceDate?: string;
  slotLabel?: string;
  /** Nombre de lignes vides à imprimer (défaut 18). */
  blankRowCount?: number;
};

const PAGE_MARGIN = 36;
/** A4 paysage : 842 − 2×marge */
const CONTENT_WIDTH = 770;
const PAGE_BOTTOM_Y = 520;
const BLANK_ROW_COUNT_DEFAULT = 14;

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
  return new PDFDocument({ size: 'A4', margin: PAGE_MARGIN, layout: 'landscape' });
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
  let headerBottom = topY + 48;

  if (brand.logoBuffer) {
    try {
      doc.image(brand.logoBuffer, PAGE_MARGIN, topY, { fit: [130, 44] });
    } catch {
      doc.fontSize(13).text(brand.companyName, PAGE_MARGIN, topY);
    }
  } else {
    doc.fontSize(13).text(brand.companyName, PAGE_MARGIN, topY);
  }

  const infoX = 190;
  const infoW = CONTENT_WIDTH - 150;
  doc.fontSize(8).fillColor('#333');
  doc.text(brand.companyName, infoX, topY, { width: infoW });
  let infoY = doc.y + 2;
  if (brand.addressLine) {
    doc.text(brand.addressLine, infoX, infoY, { width: infoW });
    infoY = doc.y + 2;
  }
  const legalBits = [
    brand.siret ? `SIRET : ${brand.siret}` : null,
    brand.ndaNumber ? `NDA : ${brand.ndaNumber}` : null,
    brand.qualiopiRef ? `Qualiopi : ${brand.qualiopiRef}` : null,
  ].filter(Boolean);
  if (legalBits.length) {
    doc.text(legalBits.join('  ·  '), infoX, infoY, { width: infoW });
    infoY = doc.y + 2;
  }
  const contactBits = [brand.phone, brand.email, brand.website].filter(Boolean);
  if (contactBits.length) {
    doc.text(contactBits.join('  ·  '), infoX, infoY, { width: infoW });
    infoY = doc.y + 2;
  }

  if (brand.qualiopiLogoBuffer) {
    try {
      doc.image(brand.qualiopiLogoBuffer, PAGE_MARGIN + CONTENT_WIDTH - 78, topY, { fit: [72, 34] });
      headerBottom = Math.max(headerBottom, topY + 38);
    } catch {
      /* ignore */
    }
  }

  headerBottom = Math.max(headerBottom, infoY + 4);
  doc.moveTo(PAGE_MARGIN, headerBottom).lineTo(PAGE_MARGIN + CONTENT_WIDTH, headerBottom).stroke('#bbb');
  return headerBottom + 8;
}

function drawTitle(doc: PdfDoc, title: string, subtitle?: string) {
  doc.fontSize(12).fillColor('#111').text(title, PAGE_MARGIN, doc.y, {
    width: CONTENT_WIDTH,
    align: 'center',
  });
  if (subtitle) {
    doc.moveDown(0.2);
    doc.fontSize(8).fillColor('#555').text(subtitle, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
  }
  doc.moveDown(0.45);
  doc.fillColor('#000');
}

function drawFieldLine(
  doc: PdfDoc,
  label: string,
  value: string | undefined,
  opts?: { blank?: boolean },
) {
  const y = doc.y;
  doc.fontSize(8).fillColor('#333').text(`${label} :`, PAGE_MARGIN, y, { continued: false });
  const lineX = PAGE_MARGIN + 88;
  const lineW = CONTENT_WIDTH - 88;

  if (opts?.blank || !value?.trim()) {
    doc
      .moveTo(lineX, y + 9)
      .lineTo(lineX + lineW, y + 9)
      .stroke('#999');
    doc.y = y + 14;
  } else {
    doc.fontSize(8).fillColor('#000').text(value.trim(), lineX, y, { width: lineW });
    doc.y = Math.max(doc.y, y + 12);
  }
}

function drawMetaGrid(doc: PdfDoc, rows: Array<{ label: string; value: string }>) {
  const colW = CONTENT_WIDTH / 2 - 8;
  let y = doc.y;
  for (let i = 0; i < rows.length; i += 2) {
    const left = rows[i];
    const right = rows[i + 1];
    doc.fontSize(7).fillColor('#666').text(left.label, PAGE_MARGIN, y, { width: colW });
    doc.fontSize(8).fillColor('#000').text(left.value, PAGE_MARGIN, doc.y + 1, { width: colW });
    const leftBottom = doc.y;
    if (right) {
      doc.fontSize(7).fillColor('#666').text(right.label, PAGE_MARGIN + colW + 16, y, { width: colW });
      doc.fontSize(8).fillColor('#000').text(right.value, PAGE_MARGIN + colW + 16, doc.y + 1, { width: colW });
    }
    y = Math.max(leftBottom, doc.y) + 6;
    doc.y = y;
  }
  doc.moveDown(0.2);
}

type AttendanceTableMode = 'filled' | 'blank';

function drawParticipantAvatar(doc: PdfDoc, buffer: Buffer | null | undefined, x: number, y: number, size: number) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  const r = size / 2 - 1;
  doc.circle(cx, cy, r).stroke('#ccc');
  if (!buffer) return;
  try {
    doc.save();
    doc.circle(cx, cy, r).clip();
    doc.image(buffer, x, y, { width: size, height: size });
    doc.restore();
  } catch {
    doc.restore();
  }
}

function drawAttendanceTable(
  doc: PdfDoc,
  mode: AttendanceTableMode,
  participants: AttendancePdfParticipant[],
  blankRowCount: number,
) {
  const colX = [PAGE_MARGIN, PAGE_MARGIN + 26, PAGE_MARGIN + 68, PAGE_MARGIN + 310, PAGE_MARGIN + 530] as const;
  const colW = [22, 36, 238, 216, CONTENT_WIDTH - 490] as const;
  const headers = ['#', '', 'Nom et prénom', mode === 'blank' ? 'Observations' : 'Email', 'Signature'];
  const rowHeight = 32;

  let y = doc.y;
  doc.fontSize(7).fillColor('#333');
  headers.forEach((h, i) => {
    if (i === 1) return;
    doc.text(h, colX[i], y, { width: colW[i], align: i === 4 ? 'center' : 'left' });
  });
  y += 12;
  doc.moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, y).stroke('#999');
  y += 5;

  doc.fontSize(8).fillColor('#000');

  const rowCount = mode === 'blank' ? blankRowCount : Math.max(participants.length, 1);

  for (let i = 0; i < rowCount; i += 1) {
    if (y > PAGE_BOTTOM_Y) {
      doc.addPage({ layout: 'landscape', size: 'A4', margin: PAGE_MARGIN });
      y = PAGE_MARGIN + 6;
    }

    const p = participants[i];
    doc.text(String(i + 1), colX[0], y + 10, { width: colW[0] });

    if (mode === 'filled' && p) {
      drawParticipantAvatar(doc, p.avatarBuffer, colX[1], y + 4, colW[1]);
      doc.fontSize(8).text(p.name, colX[2], y + 10, { width: colW[2] });
      doc.fontSize(7).fillColor('#444').text(p.email, colX[3], y + 10, { width: colW[3] });
      doc.fillColor('#000');
    } else if (mode === 'blank') {
      doc.rect(colX[2], y + 4, colW[2], rowHeight - 8).stroke('#ccc');
      doc.rect(colX[3], y + 4, colW[3], rowHeight - 8).stroke('#ccc');
    } else {
      doc.text('Aucun stagiaire inscrit', colX[2], y + 10, { width: colW[2] });
    }

    doc.rect(colX[4], y + 4, colW[4], rowHeight - 8).stroke('#bbb');
    y += rowHeight;
  }

  doc.y = y + 8;
}

function drawFooter(doc: PdfDoc, brand: AttendancePdfBrandContext, trainerName?: string) {
  doc.fontSize(7).fillColor('#666');
  doc.text(
    'Document de présence — à conserver 3 ans minimum (Code du travail, art. L.6353-1). ' +
      'Format paysage recommandé pour l’impression.',
    PAGE_MARGIN,
    doc.y,
    { width: CONTENT_WIDTH },
  );
  doc.moveDown(0.5);

  const sigY = doc.y;
  doc.fontSize(8).fillColor('#333').text('Formateur', PAGE_MARGIN, sigY);
  doc.text('Cachet / signature organisme', PAGE_MARGIN + 360, sigY);
  doc.moveDown(0.25);
  const lineY = doc.y + 16;
  doc.moveTo(PAGE_MARGIN, lineY).lineTo(PAGE_MARGIN + 300, lineY).stroke('#999');
  doc.moveTo(PAGE_MARGIN + 360, lineY).lineTo(PAGE_MARGIN + CONTENT_WIDTH, lineY).stroke('#999');

  if (trainerName?.trim()) {
    doc.fontSize(8).fillColor('#444').text(trainerName.trim(), PAGE_MARGIN, lineY + 3, { width: 300 });
  }

  doc.y = lineY + 22;
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

/** Feuille pré-remplie — alignée sur le composant RhEmargementSessionReport (A4 paysage). */
export async function buildEmargementReportPdfBuffer(
  data: EmargementReportData,
  avatarBuffers: (Buffer | null)[],
): Promise<{ buffer: Buffer; filename: string }> {
  const safeSlug = data.formationName.replace(/[^\w\-]+/g, '-').slice(0, 40);
  const slotSlug = data.slotLabel.replace(/\s+/g, '-').toLowerCase();
  const filename = `feuille-presence_${safeSlug}_${data.attendanceDate}_${slotSlug}.pdf`;

  const brand = await loadAttendancePdfBrandContext();
  if (data.brand?.logoUrl) {
    const logoFromPayload = await loadImageBuffer(data.brand.logoUrl);
    if (logoFromPayload) brand.logoBuffer = logoFromPayload;
  }
  if (data.brand?.companyName) brand.companyName = data.brand.companyName;

  const hasStatus = data.participants.some((p) => p.statusLabel?.trim());

  const buffer = await renderAttendancePdf((doc) => {
    doc.fontSize(11).fillColor('#111').text('Feuille de présence', PAGE_MARGIN, doc.y, {
      width: CONTENT_WIDTH,
      align: 'center',
    });
    doc.fontSize(8).fillColor('#555').text(
      `Session de formation — émargement ${data.slotLabel.toLowerCase()}`,
      { width: CONTENT_WIDTH, align: 'center' },
    );
    doc.moveDown(0.5);
    doc.fillColor('#000');

    const kpiW = CONTENT_WIDTH / 4 - 4;
    const kpiY = doc.y;
    const kpis = [
      { label: 'Durée formation', value: data.formationDuration?.trim() || '—', hint: 'Réf. catalogue' },
      { label: 'Stagiaires confirmés', value: String(data.participantCount ?? data.participants.length), hint: data.capacityLabel ?? '' },
      { label: 'Lieu / salle', value: data.location, hint: data.roomFloor ? `Étage ${data.roomFloor}` : '' },
      { label: 'Date du jour', value: formatEmargementDateFr(data.attendanceDate), hint: '' },
    ];
    kpis.forEach((kpi, i) => {
      const x = PAGE_MARGIN + i * (kpiW + 5);
      doc.roundedRect(x, kpiY, kpiW, 42, 3).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#64748b').fontSize(6).text(kpi.label.toUpperCase(), x + 6, kpiY + 6, { width: kpiW - 10 });
      doc.fillColor('#0f172a').fontSize(8).text(kpi.value, x + 6, kpiY + 16, { width: kpiW - 10 });
      if (kpi.hint) {
        doc.fillColor('#64748b').fontSize(6).text(kpi.hint, x + 6, kpiY + 30, { width: kpiW - 10 });
      }
    });
    doc.y = kpiY + 50;

    drawMetaGrid(doc, [
      { label: 'Formation', value: data.formationName },
      { label: 'Session', value: data.sessionLabel },
      { label: 'Formateur', value: data.trainerName },
      { label: 'Créneau', value: data.slotLabel },
    ]);

    if (data.journalNotes?.trim()) {
      doc.moveDown(0.15);
      doc.fontSize(7).fillColor('#92400e').text(`Notes journal — ${data.slotLabel.toLowerCase()}`, PAGE_MARGIN);
      doc.fontSize(8).fillColor('#1e293b').text(data.journalNotes.trim(), PAGE_MARGIN, doc.y + 2, {
        width: CONTENT_WIDTH,
      });
      doc.moveDown(0.25);
    }

    const colX = hasStatus
      ? ([PAGE_MARGIN, PAGE_MARGIN + 22, PAGE_MARGIN + 58, PAGE_MARGIN + 250, PAGE_MARGIN + 430, PAGE_MARGIN + 510] as const)
      : ([PAGE_MARGIN, PAGE_MARGIN + 22, PAGE_MARGIN + 58, PAGE_MARGIN + 280, PAGE_MARGIN + 530] as const);
    const colW = hasStatus
      ? ([18, 32, 188, 176, 76, CONTENT_WIDTH - 482] as const)
      : ([18, 32, 218, 246, CONTENT_WIDTH - 498] as const);
    const headers = hasStatus
      ? ['#', '', 'Nom et prénom', 'Email', 'Statut', 'Signature']
      : ['#', '', 'Nom et prénom', 'Email', 'Signature'];
    const rowHeight = 32;
    let y = doc.y;

    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 14).fill('#1e293b');
    doc.fillColor('#fff').fontSize(7);
    headers.forEach((h, i) => {
      if (i === 1) return;
      doc.text(h, colX[i], y + 3, { width: colW[i], align: i === headers.length - 1 ? 'center' : 'left' });
    });
    y += 16;
    doc.fillColor('#000').fontSize(8);

    const rows = data.participants.length ? data.participants : [];
    if (rows.length === 0) {
      doc.fontSize(8).fillColor('#64748b').text('Aucun stagiaire confirmé pour cette session.', PAGE_MARGIN, y + 8, {
        width: CONTENT_WIDTH,
        align: 'center',
      });
      y += 28;
    } else {
      for (let i = 0; i < rows.length; i += 1) {
        if (y > PAGE_BOTTOM_Y) {
          doc.addPage({ layout: 'landscape', size: 'A4', margin: PAGE_MARGIN });
          y = PAGE_MARGIN + 6;
        }
        const p = rows[i];
        if (i % 2 === 1) {
          doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, rowHeight).fill('#f8fafc');
          doc.fillColor('#000');
        }
        doc.fillColor('#475569').fontSize(8).text(String(p.index), colX[0], y + 10, { width: colW[0] });
        drawParticipantAvatar(doc, avatarBuffers[i] ?? null, colX[1], y + 4, colW[1]);
        doc.fillColor('#0f172a').fontSize(8).text(p.name, colX[2], y + 10, { width: colW[2] });
        doc.fillColor('#475569').fontSize(7).text(p.email, colX[3], y + 10, { width: colW[3] });
        if (hasStatus) {
          const statusX = colX[4]!;
          const sigX = colX[5]!;
          const statusW = colW[4]!;
          const sigW = colW[5]!;
          doc.fillColor('#334155').fontSize(7).text(p.statusLabel ?? '—', statusX, y + 10, { width: statusW });
          doc.rect(sigX, y + 4, sigW, rowHeight - 8).stroke('#cbd5e1');
        } else {
          const sigX = colX[4]!;
          const sigW = colW[4]!;
          doc.rect(sigX, y + 4, sigW, rowHeight - 8).stroke('#cbd5e1');
        }
        doc.fillColor('#000');
        y += rowHeight;
      }
    }

    doc.y = y + 6;
    drawFooter(doc, brand, data.trainerName);
  });

  return { buffer, filename };
}

/** Feuille pré-remplie avec la liste des stagiaires inscrits (A4 paysage). */
export async function buildSessionAttendancePdfBuffer(
  input: AttendancePdfInput,
): Promise<{ buffer: Buffer; filename: string }> {
  const data: EmargementReportData = {
    formationName: input.formationName,
    sessionLabel: input.sessionLabel,
    location: input.location,
    trainerName: input.trainerName,
    attendanceDate: input.attendanceDate,
    slotLabel: input.slotLabel ?? '—',
    participantCount: input.participants.length,
    participants: input.participants.map((p) => ({
      index: p.index,
      name: p.name,
      email: p.email,
    })),
  };
  const avatarBuffers = input.participants.map((p) => p.avatarBuffer ?? null);
  return buildEmargementReportPdfBuffer(data, avatarBuffers);
}

/**
 * Modèle vierge imprimable (sans liste CRM) — secours si la génération automatique échoue.
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
    drawFieldLine(doc, 'Créneau', input.slotLabel, { blank: !input.slotLabel?.trim() });

    doc.moveDown(0.25);
    doc.fontSize(7).fillColor('#555').text(
      'Compléter à la main les cases ci-dessous. Une ligne par stagiaire.',
      { width: CONTENT_WIDTH },
    );
    doc.moveDown(0.35);
    doc.fillColor('#000');

    drawAttendanceTable(doc, 'blank', [], blankRowCount);
    drawFooter(doc, brand, input.trainerName);
  });

  return { buffer, filename };
}
