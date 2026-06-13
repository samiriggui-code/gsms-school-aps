import {
  serializeCatalogOfferMerged,
  serializeFormationDetail,
} from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_serialize';

type FormationSerializeRow = Parameters<typeof serializeFormationDetail>[0];
import type { FormationOverviewMetrics } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/sheets/customer/components/statistics1';
import { buildFormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationCatalogApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';

type FormationWithOffer = Record<string, unknown> & {
  id: string;
  catalogOffer?: {
    id: string;
    catalogStatus: string;
    priceFromOverride: unknown;
    currencyOverride: string | null;
    parcoursSpecialiteOverride: string | null;
    fundingBlocksOverride: unknown;
    fundingChannelsOverride: unknown;
    prerequisitesTableOverride: unknown;
  } | null;
};

function asRecord(raw: unknown): Record<string, unknown> {
  return raw != null && typeof raw === 'object' && !Array.isArray(raw)
    ? (raw as Record<string, unknown>)
    : {};
}

export function buildPortalFormationSheetModel(
  formation: FormationWithOffer | null | undefined,
): FormationSheetViewModel | null {
  if (!formation) return null;

  const row = formation as unknown as FormationSerializeRow;
  const offer = formation.catalogOffer;
  const merged = offer ? serializeCatalogOfferMerged(offer, row) : serializeFormationDetail(row);

  const listRow = {
    ...merged,
    ...row,
    id: offer?.id ?? formation.id,
    formationId: formation.id,
    catalogProgramConfig: row.catalogProgramConfig ?? {},
    status: offer?.catalogStatus ?? 'ACTIVE',
    fundingBlocks: merged.fundingBlocks ?? row.fundingBlocks ?? [],
    prerequisitesTable: merged.prerequisitesTable ?? row.prerequisitesTable ?? [],
  } as unknown as FormationCatalogApiRow;

  return buildFormationSheetViewModel(undefined, listRow);
}

export function buildPortalFormationOverviewMetrics(
  formation: FormationWithOffer | null | undefined,
): FormationOverviewMetrics | null {
  if (!formation) return null;

  const row = formation as unknown as FormationSerializeRow;
  const offer = formation.catalogOffer;
  const merged = offer ? serializeCatalogOfferMerged(offer, row) : serializeFormationDetail(row);

  const band = effectiveTraineesBandForFormationScalars({
    traineesMin: merged.traineesMin,
    traineesMax: merged.traineesMax,
    duration: merged.duration,
    track: merged.track,
  });

  const priceAmount =
    merged.priceFrom != null ? Number(merged.priceFrom as number | string) : null;

  const successRate =
    merged.successRate != null ? Number(merged.successRate as number | string) : null;

  return {
    durationDisplay: typeof merged.duration === 'string' ? merged.duration : '—',
    traineeCapacityDisplay: `${band.traineesMin}-${band.traineesMax}`,
    priceAmount: Number.isFinite(priceAmount) ? priceAmount : null,
    priceCurrency: typeof merged.currency === 'string' ? merged.currency : 'EUR',
    successRateDisplay:
      successRate != null && Number.isFinite(successRate) ? `${successRate}%` : undefined,
  };
}

export function extractFundingModeFromCandidature(
  notes: string | null | undefined,
  metadata: unknown,
): string | null {
  const meta = asRecord(metadata);
  const fromMeta = typeof meta.fundingMode === 'string' ? meta.fundingMode.trim() : '';
  if (fromMeta) return fromMeta;

  if (!notes) return null;
  const match = notes.match(/Mode de financement souhaité:\s*(.+)/i);
  return match?.[1]?.trim() ?? null;
}

const DOSSIER_PHASE_STATUSES = new Set([
  'SUBMITTED',
  'MISSING_DOCUMENTS',
  'VALIDATION_PENDING',
]);

export function resolveDossierSubmittedAt(input: {
  status: string;
  metadata: unknown;
  updatedAt: Date;
  cnapsSubmittedAt: Date | null;
  validatedAt: Date | null;
}): Date | null {
  const meta = asRecord(input.metadata);
  const fromMeta =
    (typeof meta.submittedAt === 'string' && meta.submittedAt) ||
    (typeof meta.dossierSubmittedAt === 'string' && meta.dossierSubmittedAt);
  if (fromMeta) {
    const d = new Date(fromMeta);
    if (!Number.isNaN(d.getTime())) return d;
  }

  if (input.status === 'DRAFT') return null;

  if (DOSSIER_PHASE_STATUSES.has(input.status)) {
    return input.updatedAt;
  }

  if (input.cnapsSubmittedAt) return input.cnapsSubmittedAt;
  if (input.validatedAt) return input.validatedAt;

  return input.updatedAt;
}
