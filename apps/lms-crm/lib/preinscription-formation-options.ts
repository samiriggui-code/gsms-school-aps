import { CATALOG_SLUG, habilitationCatalogSlug, ssiapCatalogSlug, sstCatalogSlug } from '@/lib/catalog-formation-slugs';

export type PreinscriptionFormationOption = {
  slug: string;
  label: string;
  group: string;
};

/** Options alignées sur les slugs CRM (`Formation.slug`). */
export const PREINSCRIPTION_FORMATION_OPTIONS: PreinscriptionFormationOption[] = [
  { group: 'Sécurité privée', slug: CATALOG_SLUG.TFP_APS, label: 'TFP APS — Agent de prévention et de sécurité' },
  { group: 'Sécurité privée', slug: CATALOG_SLUG.MAC_APS, label: 'MAC APS — Maintien des compétences APS' },
  { group: 'Sécurité privée', slug: CATALOG_SLUG.OVT, label: 'OVT — Opérateur vidéoprotection / télésurveillance' },
  { group: 'Sécurité privée', slug: CATALOG_SLUG.MAC_OVT, label: 'MAC OVT — Maintien des compétences OVT' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(1, 'initial'), label: 'SSIAP 1 — Formation initiale' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(1, 'recyclage'), label: 'SSIAP 1 — Recyclage (MAC)' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(1, 'ran'), label: 'SSIAP 1 — Remise à niveau (RAN)' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(2, 'initial'), label: 'SSIAP 2 — Formation initiale' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(2, 'recyclage'), label: 'SSIAP 2 — Recyclage (MAC)' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(2, 'ran'), label: 'SSIAP 2 — Remise à niveau (RAN)' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(3, 'initial'), label: 'SSIAP 3 — Formation initiale' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(3, 'recyclage'), label: 'SSIAP 3 — Recyclage (MAC)' },
  { group: 'Incendie (SSIAP)', slug: ssiapCatalogSlug(3, 'ran'), label: 'SSIAP 3 — Remise à niveau (RAN)' },
  { group: 'Secourisme (SST)', slug: sstCatalogSlug('SST Initial'), label: 'SST — Formation initiale' },
  { group: 'Secourisme (SST)', slug: sstCatalogSlug('MAC SST'), label: 'MAC SST — Recyclage' },
  { group: 'Secourisme (SST)', slug: sstCatalogSlug('STU'), label: 'STU — Secourisme tactique' },
  {
    group: 'Habilitation électrique',
    slug: habilitationCatalogSlug('H0/B0'),
    label: 'Habilitation électrique H0/B0 — Non-électricien',
  },
  {
    group: 'Habilitation électrique',
    slug: habilitationCatalogSlug('BS / BE Manoeuvre'),
    label: 'Habilitation BS / BE — Manœuvres',
  },
  { group: 'Habilitation électrique', slug: habilitationCatalogSlug('BR'), label: "Habilitation BR — Chargé d'intervention" },
];

export function preinscriptionLabelForSlug(slug: string): string {
  return PREINSCRIPTION_FORMATION_OPTIONS.find((o) => o.slug === slug)?.label ?? slug;
}

/** Valeur Select session : période à préciser avec l'école (sans id CRM). */
export const PREINSCRIPTION_SESSION_FLEXIBLE = '__session_flexible__';
