import { mapCatalogOfferToApiRow } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_map-rows';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
  type FormationVitrineTrack,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { normalizeFundingBlocks } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-offer-template-helpers';

export type CmsCatalogFormationRow = {
  id: string;
  formationId: string;
  name: string;
  slug: string;
  track: FormationVitrineTrack;
  trackLabel: string;
  parcoursSpecialite: string;
  parcoursLabel: string;
  tag: string;
  duration: string;
  formationStatus: string;
  catalogStatus: string;
  landingVisible: boolean;
  priceFrom: number | null;
  currency: string;
  priceLabel: string;
  nextSessionLabel: string | null;
  sessionsCount: number;
  fundingSummary: string;
  featured: boolean;
  updatedAt: string;
  editPath: string;
};

export function formatCatalogPrice(priceFrom: number | null, currency: string): string {
  if (priceFrom == null || Number.isNaN(priceFrom)) return '—';
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency || 'EUR',
      maximumFractionDigits: 0,
    }).format(priceFrom);
  } catch {
    return `${priceFrom} ${currency || 'EUR'}`;
  }
}

export function summarizeFundingBlocks(value: unknown): string {
  const rows = normalizeFundingBlocks(value);
  const labels = rows
    .map((r) => (typeof r.label === 'string' ? r.label.trim() : ''))
    .filter(Boolean);
  if (!labels.length) return '—';
  return labels.slice(0, 3).join(' · ');
}

export function serializeCmsCatalogRow(
  offer: Parameters<typeof mapCatalogOfferToApiRow>[0],
  formationStatus: string,
  sessionsCount: number,
): CmsCatalogFormationRow {
  const mapped = mapCatalogOfferToApiRow(offer);
  const landingVisible =
    mapped.status === 'ACTIVE' && String(formationStatus).toUpperCase() === 'ACTIVE';

  return {
    id: mapped.id,
    formationId: mapped.formationId,
    name: mapped.name,
    slug: mapped.slug,
    track: mapped.track,
    trackLabel: FORMATION_TRACK_LABELS[mapped.track] ?? mapped.track,
    parcoursSpecialite: mapped.parcoursSpecialite,
    parcoursLabel:
      FORMATION_PARCOURS_LABELS[mapped.parcoursSpecialite] ?? mapped.parcoursSpecialite,
    tag: mapped.tag,
    duration: mapped.duration,
    formationStatus,
    catalogStatus: mapped.status,
    landingVisible,
    priceFrom: mapped.priceFrom,
    currency: mapped.currency,
    priceLabel: formatCatalogPrice(mapped.priceFrom, mapped.currency),
    nextSessionLabel: mapped.nextSessionLabel?.trim() || null,
    sessionsCount,
    fundingSummary: summarizeFundingBlocks(mapped.fundingBlocks),
    featured: mapped.featured,
    updatedAt: new Date().toISOString(),
    editPath: `/gestion-academique/vie-scolaire/formations?formationId=${mapped.formationId}`,
  };
}

export const CMS_CATALOG_TRACK_ORDER: FormationVitrineTrack[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];
