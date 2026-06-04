/** Valeur `Lead.source` pour les demandes de devis landing → CRM (filtrage liste). */
export const LANDING_QUOTE_LEAD_SOURCE = 'Landing demande de devis' as const;

/** Valeur `Lead.source` pour les préinscriptions landing (création Lead + Candidature). */
export const LANDING_PREINSCRIPTION_LEAD_SOURCE = 'Landing preinscription centralisee' as const;

/** Sources landing à afficher dans le CRM Marketing / formulaires leads. */
export const LANDING_LEAD_SOURCES = [
  LANDING_QUOTE_LEAD_SOURCE,
  LANDING_PREINSCRIPTION_LEAD_SOURCE,
] as const;
