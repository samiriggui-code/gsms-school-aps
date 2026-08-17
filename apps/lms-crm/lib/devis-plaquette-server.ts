import { prisma } from '@/lib/prisma';
import { FinanceDevisStatus } from '@repo/database';
import { toAbsoluteUrl } from '@/lib/helpers';
import { listPlaquetteMessagesForDevis } from '@/lib/devis-plaquette-messages-query';
import { serializeCatalogOfferMerged, serializeFormationDetail } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_serialize';
import { buildFormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationCatalogMergedDetail } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formation-detail-query';
import { DEVIS_STATUS_LABEL_FR } from '@/app/(protected)/administration-facturation/finance/devis/constants/status-labels';
import type {
  PlaquetteClientNeedRow,
  PlaquetteIssuer,
  PlaquetteMessageRow,
  PlaquettePayload,
  PlaquetteTimelineEvent,
} from '@/lib/devis-plaquette-types';

const SNAPSHOT_LABELS: Record<string, string> = {
  company: 'Raison sociale',
  companySiret: 'SIRET',
  companySiren: 'SIREN',
  siret: 'SIRET',
  siren: 'SIREN',
  deliveryMode: 'Mode de prestation / livraison',
  preferredDates: 'Période souhaitée',
  fundingHint: 'Financement envisagé',
  traineesExpected: 'Stagiaires prévus',
  address: 'Adresse',
  postalCode: 'Code postal',
  city: 'Ville',
  country: 'Pays',
  vatNumber: 'N° TVA intracommunautaire',
  email: 'E-mail',
  phone: 'Téléphone',
  contactName: 'Contact',
  contactFirstName: 'Prénom du contact',
  contactLastName: 'Nom du contact',
  billingAddress: 'Adresse de facturation',
  shippingAddress: 'Adresse de livraison',
};

function labelForSnapshotKey(key: string): string {
  return SNAPSHOT_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function decimalNum(d: unknown): number {
  if (d == null) return 0;
  return typeof d === 'object' && d !== null && 'toNumber' in d
    ? (d as { toNumber: () => number }).toNumber()
    : Number(d);
}

function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  const u = url.trim();
  if (/^https?:\/\//i.test(u) || u.startsWith('data:')) return u;
  return toAbsoluteUrl(u);
}

function formatMoney(n: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(n);
}

function snapshotRows(snap: unknown): PlaquetteClientNeedRow[] {
  if (!snap || typeof snap !== 'object' || Array.isArray(snap)) return [];
  const o = snap as Record<string, unknown>;
  const out: PlaquetteClientNeedRow[] = [];
  for (const [key, value] of Object.entries(o)) {
    if (value === null || value === undefined || value === '') continue;
    if (typeof value === 'object') continue;
    const s = String(value).trim();
    if (!s) continue;
    out.push({ label: labelForSnapshotKey(key), value: s });
  }
  return out;
}

function buildTimeline(row: {
  referenceCode: string;
  status: FinanceDevisStatus;
  createdAt: Date;
  updatedAt: Date;
  validUntil: Date | null;
}): PlaquetteTimelineEvent[] {
  const events: PlaquetteTimelineEvent[] = [
    {
      id: 'created',
      kind: 'milestone',
      title: 'Création du devis',
      atIso: row.createdAt.toISOString(),
      body: `Référence ${row.referenceCode}.`,
    },
    {
      id: 'updated',
      kind: 'milestone',
      title: 'Dernière mise à jour',
      atIso: row.updatedAt.toISOString(),
      body: 'Synthèse commerciale ou lignes actualisées.',
    },
  ];

  if (row.validUntil) {
    events.push({
      id: 'valid',
      kind: 'milestone',
      title: 'Validité commerciale',
      atIso: row.validUntil.toISOString(),
      body: 'Date indicative limite pour réponse ou signature.',
    });
  }

  if (row.status === FinanceDevisStatus.SENT) {
    events.push({
      id: 'sent',
      kind: 'exchange',
      title: 'Proposition transmise',
      atIso: row.updatedAt.toISOString(),
      body: 'Un e-mail récapitulatif a été envoyé au contact (horodatage approximatif).',
      highlight: true,
    });
  }

  if (row.status === FinanceDevisStatus.ACCEPTED) {
    events.push({
      id: 'accepted',
      kind: 'milestone',
      title: 'Devis accepté',
      atIso: row.updatedAt.toISOString(),
      body: 'Statut enregistré côté organisme de formation.',
      highlight: true,
    });
  } else if (row.status === FinanceDevisStatus.REJECTED) {
    events.push({
      id: 'rejected',
      kind: 'milestone',
      title: 'Devis refusé',
      atIso: row.updatedAt.toISOString(),
      body: 'Statut enregistré côté organisme de formation.',
    });
  } else if (row.status === FinanceDevisStatus.EXPIRED) {
    events.push({
      id: 'expired',
      kind: 'milestone',
      title: 'Devis expiré',
      atIso: row.updatedAt.toISOString(),
      body: 'La proposition n’est plus considérée comme valable.',
    });
  }

  return [...events].sort((a, b) => new Date(a.atIso).getTime() - new Date(b.atIso).getTime());
}

export async function getDevisPlaquetteData(
  devisId: string,
  opts?: { forPublicViewer?: boolean },
): Promise<PlaquettePayload | null> {
  const row = await prisma.financeDevis.findUnique({
    where: { id: devisId },
    include: {
      formation: true,
      lead: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          notes: true,
          source: true,
        },
      },
      formationSession: { select: { dateDisplayLabel: true, location: true } },
    },
  });

  if (!row?.formation) return null;

  const offer = await prisma.formationCatalogOffer.findUnique({
    where: { formationId: row.formation.id },
  });

  const merged = offer
    ? serializeCatalogOfferMerged(offer, row.formation as Parameters<typeof serializeCatalogOfferMerged>[1])
    : serializeFormationDetail(row.formation as Parameters<typeof serializeFormationDetail>[0]);

  const detailLike = merged as unknown as FormationCatalogMergedDetail;
  const viewModelBase = buildFormationSheetViewModel(detailLike, null);

  const totalTtc = decimalNum(row.totalTtc);
  const subHt = decimalNum(row.subtotalHt);
  const priceFromForm = decimalNum(row.formation.priceFrom);
  const formCur = row.formation.currency?.trim() || row.currency;

  let priceLine = viewModelBase.billingStrip.price;
  if (totalTtc > 0) {
    priceLine = `${formatMoney(totalTtc, row.currency)} TTC (montant du devis)`;
  } else if (subHt > 0) {
    priceLine = `${formatMoney(subHt, row.currency)} HT (devis)`;
  } else if (priceFromForm > 0) {
    priceLine = `${formatMoney(priceFromForm, formCur)} (tarif catalogue indicatif)`;
  } else if (Number.isFinite(Number(row.formation.priceFrom)) && priceFromForm === 0) {
    priceLine = 'Sur devis — à confirmer avec le commercial';
  }

  const viewModel = {
    ...viewModelBase,
    billingStrip: { ...viewModelBase.billingStrip, price: priceLine },
  };

  const issuer: PlaquetteIssuer = {
    name:
      process.env.NEXT_PUBLIC_ORG_DISPLAY_NAME?.trim() ||
      row.formation.providerName?.trim() ||
      'Organisme de formation',
    logoUrl: resolveMediaUrl(row.formation.logoUrl),
    email: row.formation.providerEmail?.trim() || null,
    phone: row.formation.providerPhone?.trim() || null,
    address: row.formation.providerAddress?.trim() || null,
  };

  const msgRows = await listPlaquetteMessagesForDevis(devisId, { order: 'asc', take: 200 });
  const plaquetteMessages: PlaquetteMessageRow[] = msgRows.map((m) => ({
    id: m.id,
    authorKind: m.authorKind,
    body: m.body,
    authorLabel: m.authorLabel,
    createdAt: m.createdAt.toISOString(),
  }));

  const clientNeeds = snapshotRows(row.clientSnapshot);
  const timeline = buildTimeline(row);

  const rawLines = Array.isArray(row.lines) ? (row.lines as Record<string, unknown>[]) : [];
  const devisLines = rawLines.map((l) => ({
    label: typeof l.label === 'string' ? l.label : 'Ligne',
    quantity: Number(l.quantity ?? 1) || 1,
    unitPriceHt: decimalNum(l.unitPriceHt),
    vatRate: Number(l.vatRate ?? 20) || 0,
  }));

  const lead =
    row.lead && opts?.forPublicViewer
      ? {
          ...row.lead,
          notes: null,
          source: null,
        }
      : row.lead;

  return {
    devis: {
      id: row.id,
      referenceCode: row.referenceCode,
      title: row.title,
      status: row.status,
      statusLabel: DEVIS_STATUS_LABEL_FR[row.status] ?? row.status,
      currency: row.currency,
      validUntil: row.validUntil?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      subtotalHt: decimalNum(row.subtotalHt),
      vatTotal: decimalNum(row.vatTotal),
      totalTtc: decimalNum(row.totalTtc),
      lines: devisLines,
    },
    lead,
    formationSession: row.formationSession,
    formation: { id: row.formation.id, name: row.formation.name, slug: row.formation.slug },
    issuer,
    hasCatalogOffer: Boolean(offer),
    viewModel,
    clientNeeds,
    timeline,
    plaquetteMessages,
  };
}
