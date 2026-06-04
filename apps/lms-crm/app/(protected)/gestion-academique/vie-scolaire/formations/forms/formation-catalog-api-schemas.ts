import { z } from 'zod';

export const formationTrackSchema = z.enum([
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
]);

export const formationParcoursSchema = z.enum(['INITIAL', 'MAC', 'RAN', 'AUTRE']);

export const formationLifecycleSchema = z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']);

/** Ajouter une fiche référence déjà en base au catalogue école (`FormationCatalogOffer`). */
export const FormationCatalogOfferCreateSchema = z.object({
  formationId: z.string().uuid(),
  catalogStatus: formationLifecycleSchema.optional(),
  priceFrom: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(8).optional().nullable(),
  parcoursSpecialite: formationParcoursSchema.optional(),
  fundingBlocks: z.any().optional().nullable(),
  fundingChannels: z.any().optional().nullable(),
  prerequisitesTable: z.any().optional().nullable(),
});

export type FormationCatalogOfferCreateInput = z.infer<typeof FormationCatalogOfferCreateSchema>;

/** Mise à jour catalogue : statut / surcharges uniquement (pas la fiche référence). */
export const FormationCatalogOfferPatchSchema = z.object({
  catalogStatus: formationLifecycleSchema.optional(),
  priceFrom: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(8).optional().nullable(),
  parcoursSpecialite: formationParcoursSchema.optional().nullable(),
  fundingBlocks: z.any().optional().nullable(),
  fundingChannels: z.any().optional().nullable(),
  prerequisitesTable: z.any().optional().nullable(),
});

export type FormationCatalogOfferPatchInput = z.infer<typeof FormationCatalogOfferPatchSchema>;

/** Formulaire édition sheet (champs autorisés côté client). */
export const FormationOfferEditFormSchema = z.object({
  catalogStatus: formationLifecycleSchema,
  priceFrom: z.number().nonnegative().nullable().optional(),
  currency: z.string().max(8).optional().nullable(),
  parcoursSpecialite: formationParcoursSchema,
});

export type FormationOfferEditFormValues = z.infer<typeof FormationOfferEditFormSchema>;
