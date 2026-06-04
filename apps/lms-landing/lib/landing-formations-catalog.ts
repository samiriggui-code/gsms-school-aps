export type LandingFormationCategory =
  | 'surete'
  | 'incendie'
  | 'habilitation'
  | 'sst'
  | 'entreprise'
  | 'autres';

export type LandingFormationCatalogEntry = {
  id: string;
  category: LandingFormationCategory;
  featured?: boolean;
};

/** Données structurelles — textes via i18n `landing.pricing.formations.{id}`. */
export const LANDING_FORMATIONS_CATALOG: LandingFormationCatalogEntry[] = [
  { id: 'tfp-aps', category: 'surete' },
  { id: 'mac-aps', category: 'surete' },
  { id: 'asra-d', category: 'surete' },
  { id: 'ovt', category: 'surete' },
  { id: 'mac-ovt', category: 'surete' },
  { id: 'asc-cynophile', category: 'surete' },
  { id: 'h0-b0', category: 'habilitation' },
  { id: 'bs-be-manoeuvre', category: 'habilitation' },
  { id: 'br', category: 'habilitation' },
  { id: 'ssiap-1-initial', category: 'incendie' },
  { id: 'ssiap-1-recyclage', category: 'incendie' },
  { id: 'ssiap-1-ran', category: 'incendie' },
  { id: 'ssiap-2-initial', category: 'incendie' },
  { id: 'ssiap-2-recyclage', category: 'incendie' },
  { id: 'ssiap-2-ran', category: 'incendie' },
  { id: 'ssiap-3-initial', category: 'incendie' },
  { id: 'ssiap-3-recyclage', category: 'incendie' },
  { id: 'ssiap-3-ran', category: 'incendie' },
  { id: 'sst-initial', category: 'sst' },
  { id: 'mac-sst', category: 'sst' },
  { id: 'stu', category: 'sst' },
  { id: 'sst-entreprise', category: 'sst' },
  { id: 'guide-file', category: 'entreprise' },
  { id: 'ari', category: 'entreprise' },
  { id: 'manipulation-extincteur', category: 'entreprise' },
  { id: 'esi', category: 'entreprise' },
  { id: 'ssi', category: 'entreprise' },
  { id: 'cssi', category: 'entreprise' },
  { id: 'evacuation-incendie', category: 'entreprise' },
  { id: 'epi', category: 'entreprise' },
  { id: 'commission-securite', category: 'autres' },
  { id: 'intra-entreprise', category: 'autres' },
];

export const LANDING_FORMATION_SORT_ORDER: Partial<Record<LandingFormationCategory, string[]>> = {
  incendie: [
    'ssiap-1-initial',
    'ssiap-1-recyclage',
    'ssiap-1-ran',
    'ssiap-2-initial',
    'ssiap-2-recyclage',
    'ssiap-2-ran',
    'ssiap-3-initial',
    'ssiap-3-recyclage',
    'ssiap-3-ran',
  ],
  habilitation: ['h0-b0', 'bs-be-manoeuvre', 'br'],
  sst: ['sst-initial', 'mac-sst', 'stu', 'sst-entreprise'],
};
