import type { CatalogProgramOpen } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import type { FormationCatalogApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/types/catalog-api';
import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';

/** Une seule fiche CRM quel que soit l’historique DB (`catalogProgramConfig` ancien genre SSIAP / MAC…). */
const CRM_CATALOG_PROGRAM_SHEET: CatalogProgramOpen = { sheet: 'customer' };

function resolveCatalogProgramConfig(): CatalogProgramOpen {
  return CRM_CATALOG_PROGRAM_SHEET;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string');
}

function numDecimal(value: unknown): number | null {
  if (value == null || value === '') return null;
  const n = Number(value as number | string);
  return Number.isFinite(n) ? n : null;
}

type FormationSlice = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  track: string;
  tag: string;
  duration: string;
  modules: unknown;
  outcomes: unknown;
  featured: boolean;
  parcoursSpecialite: string;
  catalogProgramConfig: unknown;
  priceFrom: unknown;
  traineesMin: unknown;
  traineesMax: unknown;
  currency: string;
  fundingBlocks: unknown;
  prerequisitesTable: unknown;
  logoUrl?: string | null;
  providerName?: string | null;
  providerEmail?: string | null;
  providerPhone?: string | null;
  providerAddress?: string | null;
  nextSessionLabel?: string | null;
  cpfEligible?: boolean;
  qualiopiCertified?: boolean;
  presentationTitle?: string | null;
  longDescription?: string | null;
  presentationBullets?: unknown;
  programModules?: unknown;
  certificationSteps?: unknown;
  complementaryDetails?: unknown;
  fundingChannels?: unknown;
  unitsCount?: number | null;
  volumeHoursLabel?: string | null;
  theoryPercent?: number | null;
  practicePercent?: number | null;
  minAgeLabel?: string | null;
  frenchLevel?: string | null;
  authorizationSummary?: string | null;
  criminalRecordRequirement?: string | null;
  rncpUrl?: string | null;
};

/** Liste catalogue CRM depuis une offre + sa fiche référence. */
export function mapCatalogOfferToApiRow(offer: {
  id: string;
  catalogStatus: string;
  priceFromOverride: unknown;
  currencyOverride: string | null;
  parcoursSpecialiteOverride: string | null;
  fundingBlocksOverride: unknown;
  fundingChannelsOverride: unknown;
  prerequisitesTableOverride: unknown;
  formation: FormationSlice;
}): FormationCatalogApiRow {
  const f = offer.formation;
  const config = resolveCatalogProgramConfig();

  const price =
    offer.priceFromOverride != null && offer.priceFromOverride !== ''
      ? numDecimal(offer.priceFromOverride)
      : numDecimal(f.priceFrom);

  const currency =
    offer.currencyOverride != null && offer.currencyOverride !== ''
      ? offer.currencyOverride
      : f.currency;

  return {
    id: offer.id,
    formationId: f.id,
    slug: f.slug,
    name: f.name,
    track: f.track as FormationCatalogApiRow['track'],
    tag: f.tag,
    duration: f.duration,
    description: f.description ?? '',
    modules: asStringArray(f.modules),
    outcomes: asStringArray(f.outcomes),
    featured: f.featured,
    parcoursSpecialite:
      offer.parcoursSpecialiteOverride != null && offer.parcoursSpecialiteOverride !== ''
        ? (offer.parcoursSpecialiteOverride as FormationCatalogApiRow['parcoursSpecialite'])
        : (f.parcoursSpecialite as FormationCatalogApiRow['parcoursSpecialite']),
    catalogProgramConfig: config,
    status: offer.catalogStatus as FormationCatalogApiRow['status'],
    priceFrom: price,
    currency,
    ...(() => {
      const effT = effectiveTraineesBandForFormationScalars({
        traineesMin: f.traineesMin,
        traineesMax: f.traineesMax,
        duration: f.duration,
        track: f.track,
      });
      return {
        traineesMin: effT.traineesMin,
        traineesMax: effT.traineesMax,
      };
    })(),
    fundingBlocks:
      offer.fundingBlocksOverride !== undefined && offer.fundingBlocksOverride !== null
        ? offer.fundingBlocksOverride
        : f.fundingBlocks,
    prerequisitesTable:
      offer.prerequisitesTableOverride !== undefined && offer.prerequisitesTableOverride !== null
        ? offer.prerequisitesTableOverride
        : f.prerequisitesTable,
    logoUrl: f.logoUrl ?? null,
    providerName: f.providerName ?? null,
    providerEmail: f.providerEmail ?? null,
    providerPhone: f.providerPhone ?? null,
    providerAddress: f.providerAddress ?? null,
    nextSessionLabel: f.nextSessionLabel ?? null,
    cpfEligible: f.cpfEligible,
    qualiopiCertified: f.qualiopiCertified,
    presentationTitle: f.presentationTitle ?? null,
    longDescription: f.longDescription ?? null,
    presentationBullets: f.presentationBullets ?? [],
    programModules: f.programModules ?? [],
    certificationSteps: f.certificationSteps ?? [],
    complementaryDetails: f.complementaryDetails ?? {},
    fundingChannels: f.fundingChannels ?? [],
    unitsCount: f.unitsCount ?? null,
    volumeHoursLabel: f.volumeHoursLabel ?? null,
    theoryPercent: f.theoryPercent ?? null,
    practicePercent: f.practicePercent ?? null,
    minAgeLabel: f.minAgeLabel ?? null,
    frenchLevel: f.frenchLevel ?? null,
    authorizationSummary: f.authorizationSummary ?? null,
    criminalRecordRequirement: f.criminalRecordRequirement ?? null,
    rncpUrl: f.rncpUrl ?? null,
  };
}
