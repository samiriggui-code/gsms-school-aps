/**
 * Slugs Prisma `Formation.slug` attendus côté CRM pour synchroniser la vitrine landing.
 * À aligner avec les fiches créées dans le CRM (catalogue).
 */
export const CATALOG_SLUG = {
  TFP_APS: 'tfp-aps',
  MAC_APS: 'mac-aps',
  OVT: 'ovt',
  MAC_OVT: 'mac-ovt',
  ASRA_D: 'asra-d',
  /** Titre ASC – agent de sécurité cynophile (maître-chien), niveau III */
  ASC_CYNOPHILE: 'asc-cynophile',
} as const;

export function ssiapCatalogSlug(level: 1 | 2 | 3, type: 'initial' | 'recyclage' | 'ran') {
  return `ssiap-${level}-${type}`;
}

export function sstCatalogSlug(type: string) {
  const map: Record<string, string> = {
    'SST Initial': 'sst-initial',
    'MAC SST': 'mac-sst',
    STU: 'stu',
    'SST Entreprise': 'sst-entreprise',
  };
  return map[type] ?? type.toLowerCase().replace(/\s+/g, '-');
}

export function habilitationCatalogSlug(type: string) {
  const map: Record<string, string> = {
    'H0/B0': 'h0-b0',
    BR: 'br',
    'BS / BE Manoeuvre': 'bs-be-manoeuvre',
  };
  return map[type] ?? type.toLowerCase().replace(/\s+/g, '-');
}

/** Volet Entreprise — aligné sur `FORMATION_VITRINE_CATALOG` / CRM. */
export const ENTREPRISE_TYPE_TO_SLUG: Record<string, string> = {
  'Guide File / Serre File': 'guide-file-serre-file',
  ARI: 'ari',
  'Manipulation Extincteur': 'manipulation-extincteur',
  ESI: 'esi',
  SSI: 'ssi',
  CSSI: 'cssi',
  'Evacuation Incendie': 'evacuation-incendie',
  EPI: 'epi',
};

/** Volet Autres — prestations / conseil sur devis. */
export const AUTRES_TYPE_TO_SLUG: Record<string, string> = {
  'Commission de securite': 'commission-securite',
  'Formation intra-entreprise securite': 'intra-entreprise-securite',
};
