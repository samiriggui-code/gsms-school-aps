import { effectiveTraineesBandForFormationScalars } from '@/lib/formation-trainee-band';

/** Enregistrement complet renvoyé par Prisma (Decimal sur les KPI). */
type FormationSerializeRow = {
  priceFrom: unknown;
  successRate: unknown;
  clientSatisfactionRate: unknown;
  currency?: unknown;
  parcoursSpecialite?: unknown;
  fundingBlocks?: unknown;
  fundingChannels?: unknown;
  prerequisitesTable?: unknown;
  duration?: unknown;
  track?: unknown;
  traineesMin?: unknown;
  traineesMax?: unknown;
} & Record<string, unknown>;

/** Sérialise Decimal et champs JSON pour `NextResponse.json`. */
export function serializeFormationDetail(row: FormationSerializeRow) {
  return {
    ...row,
    priceFrom:
      row.priceFrom != null && row.priceFrom !== ''
        ? Number(row.priceFrom as number | string)
        : null,
    successRate:
      row.successRate != null && row.successRate !== ''
        ? Number(row.successRate as number | string)
        : null,
    clientSatisfactionRate:
      row.clientSatisfactionRate != null && row.clientSatisfactionRate !== ''
        ? Number(row.clientSatisfactionRate as number | string)
        : null,
  };
}

type OfferSlice = {
  id: string;
  catalogStatus: string;
  priceFromOverride: unknown;
  currencyOverride: string | null;
  parcoursSpecialiteOverride: string | null;
  fundingBlocksOverride: unknown;
  fundingChannelsOverride: unknown;
  prerequisitesTableOverride: unknown;
};

/** Détail CRM : fiche référence + méta offre + valeurs effectives affichées. */
export function serializeCatalogOfferMerged(offer: OfferSlice, formation: FormationSerializeRow) {
  const base = serializeFormationDetail(formation);
  const effPrice =
    offer.priceFromOverride != null && offer.priceFromOverride !== ''
      ? Number(offer.priceFromOverride as number | string)
      : base.priceFrom;
  const effCurrency =
    offer.currencyOverride != null && offer.currencyOverride !== ''
      ? offer.currencyOverride
      : (base.currency as string);

  const effTrainees = effectiveTraineesBandForFormationScalars({
    traineesMin: formation.traineesMin,
    traineesMax: formation.traineesMax,
    duration: formation.duration,
    track: formation.track,
  });

  return {
    ...base,
    traineesMin: effTrainees.traineesMin,
    traineesMax: effTrainees.traineesMax,
    catalogOfferId: offer.id,
    status: offer.catalogStatus,
    priceFrom: effPrice,
    currency: effCurrency,
    parcoursSpecialite:
      offer.parcoursSpecialiteOverride !== undefined && offer.parcoursSpecialiteOverride !== null
        ? offer.parcoursSpecialiteOverride
        : base.parcoursSpecialite,
    fundingBlocks:
      offer.fundingBlocksOverride !== undefined && offer.fundingBlocksOverride !== null
        ? offer.fundingBlocksOverride
        : base.fundingBlocks,
    fundingChannels:
      offer.fundingChannelsOverride !== undefined && offer.fundingChannelsOverride !== null
        ? offer.fundingChannelsOverride
        : base.fundingChannels,
    prerequisitesTable:
      offer.prerequisitesTableOverride !== undefined && offer.prerequisitesTableOverride !== null
        ? offer.prerequisitesTableOverride
        : base.prerequisitesTable,
  };
}
