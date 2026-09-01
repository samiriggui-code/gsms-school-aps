import PDFDocument from 'pdfkit';
import { loadAttendancePdfBrandContext } from '@/lib/instructor/attendance-pdf-brand';
import { FINANCE_DOC_THEME as T } from './finance-document-theme';
import type { BpfAggregates } from './bpf-aggregates';

type Brand = Awaited<ReturnType<typeof loadAttendancePdfBrandContext>>;

const MARGIN = 48;
const WIDTH = 500;

function euro(n: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function issuerLegalLine(brand: Brand): string | null {
  const parts = [
    brand.siret ? `SIRET ${brand.siret}` : null,
    brand.ndaNumber ? `NDA ${brand.ndaNumber}` : null,
    brand.qualiopiRef ? `Qualiopi ${brand.qualiopiRef}` : null,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : null;
}

/**
 * PDF synthèse BPF (OF-07) — structure logique proche Cerfa 10443
 * (identité OF + agrégats exercice + ventilation financeurs + méthodologie).
 * Pas un remplissage pixel-perfect du formulaire Cerfa officiel (pas de blank PDF en repo).
 */
export async function buildBpfCerfaPdfBuffer(
  aggregates: BpfAggregates,
): Promise<{ buffer: Buffer; filename: string }> {
  const brand = await loadAttendancePdfBrandContext();
  const doc = new PDFDocument({ size: 'A4', margin: MARGIN });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  doc.rect(MARGIN, MARGIN - 8, WIDTH, 4).fill(T.primary);

  let y = MARGIN + 8;
  doc.font('Helvetica-Bold').fontSize(14).fillColor(T.text);
  doc.text('Bilan pédagogique et financier (synthèse)', MARGIN, y, { width: WIDTH });
  y = doc.y + 4;
  doc.font('Helvetica').fontSize(9).fillColor(T.textMuted);
  doc.text(
    `Exercice ${aggregates.year} — ${aggregates.periodStart} → ${aggregates.periodEnd}`,
    MARGIN,
    y,
    { width: WIDTH },
  );
  y = doc.y + 10;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Organisme de formation', MARGIN, y);
  y = doc.y + 4;
  doc.font('Helvetica-Bold').fontSize(11).fillColor(T.text).text(brand.companyName, MARGIN, y);
  y = doc.y + 3;
  doc.font('Helvetica').fontSize(8.5).fillColor(T.textMuted);
  for (const line of [brand.addressLine, issuerLegalLine(brand)].filter(Boolean)) {
    doc.text(String(line), MARGIN, y, { width: WIDTH });
    y = doc.y + 2;
  }
  y += 10;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Indicateurs agrégés', MARGIN, y);
  y = doc.y + 6;

  const kpis: [string, string][] = [
    ['Stagiaires distincts', String(aggregates.stagiairesCount)],
    ['Sessions', String(aggregates.sessionsCount)],
    ['Heures catalogue', String(aggregates.hoursCatalog)],
    ['Heures émargées (proxy)', String(aggregates.hoursAttendedProxy)],
    ['Dossiers FundingCase', String(aggregates.fundingCasesCount)],
    ['Montant demandé', euro(aggregates.amountRequested)],
    ['Montant accordé', euro(aggregates.amountApproved)],
  ];

  for (const [label, value] of kpis) {
    doc.font('Helvetica').fontSize(9).fillColor(T.textMuted).text(label, MARGIN, y, { width: 280 });
    doc.font('Helvetica-Bold').fillColor(T.text).text(value, MARGIN + 290, y, { width: 210, align: 'right' });
    y = Math.max(doc.y, y) + 8;
  }
  y += 6;

  const { cerfa } = aggregates;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Cadre C — Produits (HT)', MARGIN, y);
  y = doc.y + 6;
  for (const row of cerfa.cadreC) {
    if (row.amountHt <= 0) continue;
    doc.font('Helvetica').fontSize(8.5).fillColor(T.textMuted).text(row.label, MARGIN, y, { width: 320 });
    doc.font('Helvetica-Bold').fillColor(T.text).text(euro(row.amountHt), MARGIN + 330, y, { width: 170, align: 'right' });
    y = Math.max(doc.y, y) + 8;
  }
  if (!cerfa.cadreC.some((r) => r.amountHt > 0)) {
    doc.font('Helvetica').fontSize(9).fillColor(T.textMuted).text('Aucun produit post-approbation sur l’exercice.', MARGIN, y);
    y = doc.y + 10;
  }
  y += 4;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Cadre E — Formateurs', MARGIN, y);
  y = doc.y + 4;
  doc.font('Helvetica').fontSize(8.5).fillColor(T.textBody);
  doc.text(
    `Internes : ${cerfa.cadreE.internalTrainers} · Externes : ${cerfa.cadreE.externalTrainers} · Heures pédagogiques (proxy) : ${cerfa.cadreE.pedagogicalHoursProxy} h`,
    MARGIN,
    y,
    { width: WIDTH },
  );
  y = doc.y + 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Cadre F — Stagiaires', MARGIN, y);
  y = doc.y + 6;
  for (const row of cerfa.cadreF.byAudience) {
    if (row.trainees === 0 && row.hours === 0) continue;
    doc.font('Helvetica').fontSize(8.5).fillColor(T.textBody);
    doc.text(`${row.label} — ${row.trainees} stagiaire(s), ${row.hours} h`, MARGIN, y, { width: WIDTH });
    y = doc.y + 4;
  }
  doc.text(
    `Présentiel ${cerfa.cadreF.hoursPresentiel} h · Distanciel ${cerfa.cadreF.hoursDistanciel} h · Apprentis ${cerfa.cadreF.apprentices}`,
    MARGIN,
    y,
    { width: WIDTH },
  );
  y = doc.y + 12;

  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Ventilation par type financeur (technique)', MARGIN, y);
  y = doc.y + 6;

  if (aggregates.byFunderType.length === 0) {
    doc.font('Helvetica').fontSize(9).fillColor(T.textMuted).text('Aucun FundingCase sur l’exercice.', MARGIN, y);
    y = doc.y + 10;
  } else {
    doc.font('Helvetica-Bold').fontSize(8).fillColor(T.text);
    doc.text('Type', MARGIN, y, { width: 160 });
    doc.text('Dossiers', MARGIN + 170, y, { width: 60, align: 'right' });
    doc.text('Demandé', MARGIN + 240, y, { width: 120, align: 'right' });
    doc.text('Accordé', MARGIN + 370, y, { width: 130, align: 'right' });
    y += 12;
    doc.moveTo(MARGIN, y).lineTo(MARGIN + WIDTH, y).stroke(T.border);
    y += 6;

    for (const row of aggregates.byFunderType) {
      if (y > 720) {
        doc.addPage();
        y = MARGIN;
      }
      doc.font('Helvetica').fontSize(8.5).fillColor(T.textBody);
      doc.text(row.funderType, MARGIN, y, { width: 160 });
      doc.text(String(row.cases), MARGIN + 170, y, { width: 60, align: 'right' });
      doc.text(euro(row.requested), MARGIN + 240, y, { width: 120, align: 'right' });
      doc.text(euro(row.approved), MARGIN + 370, y, { width: 130, align: 'right' });
      y += 14;
    }
    y += 8;
  }

  if (aggregates.controls.length > 0) {
    if (y > 680) {
      doc.addPage();
      y = MARGIN;
    }
    doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Contrôles', MARGIN, y);
    y = doc.y + 4;
    for (const c of aggregates.controls) {
      doc.font('Helvetica').fontSize(8).fillColor(T.textBody);
      doc.text(`[${c.severity}] ${c.code} — ${c.message}`, MARGIN, y, { width: WIDTH });
      y = doc.y + 4;
    }
    y += 6;
  }

  if (y > 640) {
    doc.addPage();
    y = MARGIN;
  }
  doc.font('Helvetica-Bold').fontSize(10).fillColor(T.primary).text('Méthodologie', MARGIN, y);
  y = doc.y + 4;
  for (const line of aggregates.methodology) {
    doc.font('Helvetica').fontSize(7.5).fillColor(T.textMuted).text(`• ${line}`, MARGIN, y, { width: WIDTH });
    y = doc.y + 3;
  }

  y += 12;
  doc.font('Helvetica').fontSize(7).fillColor(T.textLight);
  doc.text(
    'Document de synthèse interne — agrégats déterministes GSMS. Ne remplace pas le dépôt Cerfa 10443 officiel si exigé par l’administration.',
    MARGIN,
    Math.min(y, 780),
    { width: WIDTH, align: 'center' },
  );

  doc.end();
  return {
    buffer: await done,
    filename: `bpf-synthese-${aggregates.year}.pdf`,
  };
}
