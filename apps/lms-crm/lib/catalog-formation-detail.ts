import type { Prisma, PrismaClient } from '@repo/database';
import { mapCatalogOfferToApiRow } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_map-rows';
import { serializeCatalogOfferMerged } from '@/app/api/sections/gestion-academique/vie-scolaire/formations/_serialize';
import {
  buildFormationSheetViewModel,
  type FormationSheetViewModel,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import type { FormationCatalogMergedDetail } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formation-detail-query';
import { numDecimal } from '@/lib/decimal-coerce';
import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';
import { effectiveCatalogParcours } from '@/lib/effective-catalog-formation';
import { nextSessionLabelForFormation } from '@/lib/formation-session-dates';

export const catalogFormationDetailSelect = {
  id: true,
  slug: true,
  name: true,
  description: true,
  track: true,
  tag: true,
  duration: true,
  modules: true,
  outcomes: true,
  featured: true,
  parcoursSpecialite: true,
  catalogProgramConfig: true,
  priceFrom: true,
  traineesMin: true,
  traineesMax: true,
  currency: true,
  fundingBlocks: true,
  prerequisitesTable: true,
  logoUrl: true,
  providerName: true,
  providerEmail: true,
  providerPhone: true,
  providerAddress: true,
  nextSessionLabel: true,
  cpfEligible: true,
  qualiopiCertified: true,
  presentationTitle: true,
  longDescription: true,
  presentationBullets: true,
  programModules: true,
  certificationSteps: true,
  complementaryDetails: true,
  fundingChannels: true,
  unitsCount: true,
  volumeHoursLabel: true,
  theoryPercent: true,
  practicePercent: true,
  minAgeLabel: true,
  frenchLevel: true,
  authorizationSummary: true,
  criminalRecordRequirement: true,
  rncpUrl: true,
  hoursMin: true,
  hoursMax: true,
  successRate: true,
} satisfies Prisma.FormationSelect;

function formatPrice(amount: number | null, currencyRaw: string | null | undefined): string {
  if (amount == null) return '';
  const currency = (currencyRaw || 'EUR').toUpperCase();
  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${Math.round(amount)} €`;
  }
}

function hoursLabel(row: {
  volumeHoursLabel: string | null;
  hoursMin: number | null;
  hoursMax: number | null;
  duration: string;
}): string {
  const v = row.volumeHoursLabel?.trim();
  if (v) return v.includes('h') || /\d/.test(v) ? v : `${v}h`;
  if (row.hoursMin != null && row.hoursMax != null) return `${row.hoursMin}-${row.hoursMax}h`;
  if (row.hoursMin != null) return `${row.hoursMin}h minimum`;
  return row.duration?.trim() || '';
}

function traineesLabel(min: number | null, max: number | null): string {
  if (min != null && max != null) return `${min}-${max}`;
  if (min != null) return `${min}+`;
  if (max != null) return `≤${max}`;
  return '';
}

function effectiveCatalogPrice(
  priceFromOverride: unknown,
  priceFrom: unknown,
): number | null {
  if (priceFromOverride != null && priceFromOverride !== '') {
    return numDecimal(priceFromOverride);
  }
  return numDecimal(priceFrom);
}

export type PublicCatalogFormationDetail = {
  formation: {
    id: string;
    name: string;
    slug: string;
    track: string;
    tag: string;
    duration: string;
    parcoursSpecialite: string;
    nextSessionLabel: string | null;
  };
  catalogInactive: boolean;
  requiresQuote: boolean;
  stats: {
    hoursDisplay: string;
    traineesDisplay: string;
    priceAmountText: string;
    priceFormatted: string;
    successDisplay: string;
    currency: string;
  };
  sheet: FormationSheetViewModel;
};

export async function buildPublicCatalogFormationDetail(
  prisma: PrismaClient,
  slug: string,
): Promise<PublicCatalogFormationDetail | null> {
  const formation = await prisma.formation.findFirst({
    where: { slug, status: 'ACTIVE' },
    select: catalogFormationDetailSelect,
  });
  if (!formation) return null;

  const offer = await prisma.formationCatalogOffer.findUnique({
    where: { formationId: formation.id },
  });

  if (!offer || offer.catalogStatus !== 'ACTIVE') {
    return null;
  }

  const merged = serializeCatalogOfferMerged(offer, formation);
  const listRow = mapCatalogOfferToApiRow({ ...offer, formation });
  const sheet = buildFormationSheetViewModel(merged as FormationCatalogMergedDetail, listRow);

  const priceAmountOnly = effectiveCatalogPrice(offer.priceFromOverride, formation.priceFrom);
  const currency = offer.currencyOverride ?? formation.currency ?? 'EUR';
  const parcoursEffective = effectiveCatalogParcours(
    formation.parcoursSpecialite,
    offer.parcoursSpecialiteOverride,
  );
  const effTrainees = effectiveTraineesBandForFormationScalars({
    traineesMin: formation.traineesMin,
    traineesMax: formation.traineesMax,
    duration: formation.duration,
    track: formation.track,
  });

  const computedNext = await nextSessionLabelForFormation(prisma, formation.id);

  return {
    formation: {
      id: formation.id,
      name: formation.name,
      slug: formation.slug,
      track: formation.track,
      tag: formation.tag,
      duration: formation.duration,
      parcoursSpecialite: parcoursEffective,
      nextSessionLabel: computedNext ?? formation.nextSessionLabel ?? null,
    },
    catalogInactive: false,
    requiresQuote: priceAmountOnly == null,
    stats: {
      hoursDisplay: hoursLabel(formation),
      traineesDisplay: traineesLabel(effTrainees.traineesMin, effTrainees.traineesMax),
      priceAmountText: priceAmountOnly != null ? String(Math.round(priceAmountOnly)) : '',
      priceFormatted: formatPrice(priceAmountOnly, currency),
      successDisplay:
        formation.successRate != null && numDecimal(formation.successRate) != null
          ? `${Math.round(numDecimal(formation.successRate)!)}%`
          : '',
      currency,
    },
    sheet,
  };
}
