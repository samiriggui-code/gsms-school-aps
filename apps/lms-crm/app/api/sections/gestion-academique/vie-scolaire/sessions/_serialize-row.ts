import { numDecimal } from '@/lib/decimal-coerce';
import { effectiveCatalogParcours } from '@/lib/effective-catalog-formation';
import { isSessionExpired } from '@/lib/formation-session-dates';
import type { FormationSession, Formation, User } from '@repo/database';
import type { FormationSessionVitrineOverview } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { sessionKindDerivedFromFormationParcours } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';
import { prisma } from '@/lib/prisma';

type TrainerBrief = Pick<User, 'id' | 'name' | 'email' | 'avatar'>;

type FormationSliceForSession = Pick<
  Formation,
  | 'id'
  | 'slug'
  | 'name'
  | 'track'
  | 'parcoursSpecialite'
  | 'tag'
  | 'duration'
  | 'description'
  | 'presentationTitle'
  | 'longDescription'
  | 'logoUrl'
  | 'cpfEligible'
  | 'presentationBullets'
  | 'complementaryDetails'
  | 'rncpUrl'
  | 'deliveryMode'
  | 'providerName'
  | 'providerEmail'
  | 'providerPhone'
  | 'providerAddress'
  | 'nextSessionLabel'
  | 'priceFrom'
  | 'currency'
  | 'successRate'
> & {
  catalogOffer: {
    priceFromOverride: unknown;
    currencyOverride: string | null;
    parcoursSpecialiteOverride: string | null;
  } | null;
};

type ComplementaryDetailsJson = {
  commercialShortName?: unknown;
  contentVersion?: unknown;
  deliveryModeLabel?: unknown;
  targetAudience?: { title?: unknown; subtitle?: unknown; value?: unknown };
  prerequisitesSummary?: { title?: unknown; subtitle?: unknown; value?: unknown };
  certificationSummary?: { badgeLabel?: unknown; outcomeLabel?: unknown };
  progressAxisLabels?: unknown;
};

function nonEmptyStr(v: unknown): string | null {
  return typeof v === 'string' && v.trim() !== '' ? v.trim() : null;
}

function parsePresentationBullets(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseComplementaryDetails(value: unknown): ComplementaryDetailsJson {
  if (value == null || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as ComplementaryDetailsJson;
}

function formatContentVersionLabel(raw: string | null): string | null {
  if (!raw) return null;
  if (/^version\s/i.test(raw)) return raw;
  return `Version ${raw}`;
}

function parseProgressAxes(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((x): x is string => typeof x === 'string')
    .map((s) => s.trim())
    .filter(Boolean);
}

const FORMATION_DELIVERY_LABELS: Record<string, string> = {
  PRESENTIEL: 'En présentiel',
  DISTANCIEL: 'À distance',
  MIXTE: 'Mixte',
  ENTREPRISE_SUR_SITE: 'En entreprise',
};

function deliveryModeLabelFallback(mode: string | null | undefined): string | null {
  if (mode == null || mode === '') return null;
  return FORMATION_DELIVERY_LABELS[mode] ?? null;
}

function vitrineOverviewFromFormation(f: FormationSliceForSession): FormationSessionVitrineOverview {
  const cd = parseComplementaryDetails(f.complementaryDetails);
  const presentationTitle = nonEmptyStr(f.presentationTitle) ?? f.name;
  const presentationBody =
    nonEmptyStr(f.longDescription) ?? nonEmptyStr(f.description) ?? '';
  const bullets = parsePresentationBullets(f.presentationBullets);
  const shortLabel = nonEmptyStr(cd.commercialShortName) ?? f.name;
  const rawVersion = nonEmptyStr(cd.contentVersion);
  const contentVersionLabel = formatContentVersionLabel(rawVersion);
  const deliveryModeLabel =
    nonEmptyStr(cd.deliveryModeLabel) ?? deliveryModeLabelFallback(f.deliveryMode);

  const audienceValue =
    nonEmptyStr(cd.targetAudience?.value) ??
    (presentationBody ? presentationBody.slice(0, 280) : '—');
  const prereqValue =
    nonEmptyStr(cd.prerequisitesSummary?.value) ??
    "Voir la fiche formation pour le détail des prérequis.";

  return {
    logoUrl: nonEmptyStr(f.logoUrl),
    presentationTitle,
    presentationBody,
    bullets,
    cpfEligible: Boolean(f.cpfEligible),
    rncpUrl: nonEmptyStr(f.rncpUrl),
    shortLabel,
    contentVersionLabel,
    deliveryModeLabel,
    audience: {
      title: nonEmptyStr(cd.targetAudience?.title) ?? 'Public concerné',
      subtitle: nonEmptyStr(cd.targetAudience?.subtitle) ?? 'Bénéficiaires',
      value: audienceValue,
    },
    prerequisites: {
      title: nonEmptyStr(cd.prerequisitesSummary?.title) ?? 'Prérequis',
      subtitle: nonEmptyStr(cd.prerequisitesSummary?.subtitle) ?? "Conditions d'accès",
      value: prereqValue,
    },
    certification: {
      badgeLabel: nonEmptyStr(cd.certificationSummary?.badgeLabel) ?? (f.tag || 'Référentiel'),
      outcomeLabel: nonEmptyStr(cd.certificationSummary?.outcomeLabel) ?? f.name,
    },
    progressAxes: parseProgressAxes(cd.progressAxisLabels),
  };
}

/** Même logique que `mapCatalogOfferToApiRow` : override offre sinon fiche référence. */
function effectiveCatalogPriceAndCurrency(f: FormationSliceForSession): {
  priceFrom: number | null;
  currency: string;
} {
  const offer = f.catalogOffer;
  const priceFrom =
    offer?.priceFromOverride != null && offer.priceFromOverride !== ''
      ? numDecimal(offer.priceFromOverride)
      : numDecimal(f.priceFrom);
  const currency =
    offer?.currencyOverride != null && offer.currencyOverride.trim() !== ''
      ? offer.currencyOverride.trim()
      : f.currency?.trim() || 'EUR';
  return { priceFrom, currency };
}

function formationSuccessRateDisplay(f: FormationSliceForSession): number | null {
  return numDecimal(f.successRate);
}

function effectiveParcoursForSessionFormation(f: FormationSliceForSession): string {
  return effectiveCatalogParcours(
    f.parcoursSpecialite,
    f.catalogOffer?.parcoursSpecialiteOverride ?? null,
  );
}

export type SessionRowPayload = FormationSession & {
  formation: FormationSliceForSession;
  participants: { user: Pick<User, 'id' | 'name' | 'email' | 'avatar'> }[];
  venueRoom?: { id: string; name: string; imageUrl: string | null } | null;
  examVenueRoom?: {
    id: string;
    name: string;
    imageUrl: string | null;
    shortCode: string | null;
  } | null;
};

function normalizeEquipmentIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x));
}

async function trainerBriefFor(
  trainerUserId: string | null,
  trainerById?: ReadonlyMap<string, TrainerBrief>,
): Promise<TrainerBrief | null> {
  if (!trainerUserId) return null;
  if (trainerById) return trainerById.get(trainerUserId) ?? null;
  return prisma.user.findUnique({
    where: { id: trainerUserId },
    select: { id: true, name: true, email: true, avatar: true },
  });
}

export async function serializeFormationSessionRows(rows: SessionRowPayload[]) {
  const ids = Array.from(
    new Set(
      rows
        .map((r) => r.trainerUserId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const trainers =
    ids.length === 0
      ? []
      : await prisma.user.findMany({
          where: { id: { in: ids } },
          select: { id: true, name: true, email: true, avatar: true },
        });
  const map = new Map<string, TrainerBrief>(trainers.map((t) => [t.id, t]));
  return Promise.all(rows.map((r) => serializeFormationSessionRow(r, map)));
}

export async function serializeFormationSessionRow(
  row: SessionRowPayload,
  trainerById?: ReadonlyMap<string, TrainerBrief>,
) {
  async function loadEquipmentRows(ids: string[]) {
    if (ids.length === 0) return [];
    const equipRows = await prisma.equipment.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        label: true,
        serialNumber: true,
        type: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        assignedSite: { select: { id: true, name: true } },
      },
      orderBy: { label: 'asc' },
    });
    return equipRows.map((e) => ({
      id: e.id,
      label: e.label,
      serialNumber: e.serialNumber,
      type: e.type,
      status: e.status,
      createdAt: e.createdAt.toISOString(),
      updatedAt: e.updatedAt.toISOString(),
      assignedSite: e.assignedSite,
    }));
  }

  const equipmentIds = normalizeEquipmentIds(row.reservedEquipmentIds);
  const examEquipmentIds = normalizeEquipmentIds(row.examReservedEquipmentIds);
  const reservedEquipment = await loadEquipmentRows(equipmentIds);
  const examReservedEquipment = await loadEquipmentRows(examEquipmentIds);

  const trainer = await trainerBriefFor(row.trainerUserId, trainerById);
  const { priceFrom: catalogPriceFrom, currency: catalogPriceCurrency } = effectiveCatalogPriceAndCurrency(
    row.formation,
  );
  const formationSuccessRate = formationSuccessRateDisplay(row.formation);
  const formationParcoursEffective = effectiveParcoursForSessionFormation(row.formation);

  const sessionKindResolved =
    row.sessionKind === 'OTHER'
      ? ('OTHER' as const)
      : sessionKindDerivedFromFormationParcours(formationParcoursEffective);

  return {
    id: row.id,
    formationId: row.formationId,
    formationSlug: row.formation.slug,
    formationName: row.formation.name,
    formationTrack: row.formation.track,
    formationParcours: formationParcoursEffective,
    formationTag: row.formation.tag,
    formationDuration: row.formation.duration,
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    registrationClosesAt: row.registrationClosesAt?.toISOString() ?? null,
    examDate: row.examDate?.toISOString() ?? null,
    examVenueRoomId: row.examVenueRoomId ?? null,
    examVenueRoom: row.examVenueRoom
      ? {
          id: row.examVenueRoom.id,
          name: row.examVenueRoom.name,
          imageUrl: row.examVenueRoom.imageUrl ?? null,
          shortCode: row.examVenueRoom.shortCode ?? null,
        }
      : null,
    examReservedEquipmentIds: examEquipmentIds,
    examReservedEquipment,
    traineesMin: row.traineesMin,
    traineesMax: row.traineesMax,
    trainerUserId: row.trainerUserId,
    trainerName: trainer?.name ?? null,
    trainerEmail: trainer?.email ?? null,
    trainerAvatar: trainer?.avatar ?? null,
    venueRoomId: row.venueRoomId ?? null,
    venueRoom: row.venueRoom
      ? {
          id: row.venueRoom.id,
          name: row.venueRoom.name,
          imageUrl: row.venueRoom.imageUrl ?? null,
        }
      : null,
    reservedEquipmentIds: equipmentIds,
    reservedEquipment,
    dateDisplayLabel: row.dateDisplayLabel,
    location: row.location,
    sessionKind: sessionKindResolved,
    venueBrandPrefix: row.venueBrandPrefix,
    sessionSubtitle: row.sessionSubtitle,
    sortOrder: row.sortOrder,
    bookingEnabled: row.bookingEnabled,
    bookingUrl: row.bookingUrl,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    participants: row.participants.map((p) => ({
      userId: p.user.id,
      name: p.user.name,
      email: p.user.email,
      avatar: p.user.avatar ?? null,
    })),
    catalogPriceFrom,
    catalogPriceCurrency,
    formationSuccessRate,
    formationVitrineOverview: vitrineOverviewFromFormation(row.formation),
    formationProviderName: nonEmptyStr(row.formation.providerName),
    formationProviderEmail: nonEmptyStr(row.formation.providerEmail),
    formationProviderPhone: nonEmptyStr(row.formation.providerPhone),
    formationProviderAddress: nonEmptyStr(row.formation.providerAddress),
    formationNextSessionLabel: nonEmptyStr(row.formation.nextSessionLabel),
    isExpired: isSessionExpired(row.endDate, row.startDate),
  };
}
