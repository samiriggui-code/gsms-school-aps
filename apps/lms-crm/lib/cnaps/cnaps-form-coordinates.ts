/** Coordonnées pdf-lib (origine bas-gauche, A4 ≈ 595×842). Pages indexées à 0. */
export type CnapsPoint = { page: number; x: number; y: number };

export type CnapsTextField = CnapsPoint & { maxWidth?: number; size?: number };

/** Cases à cocher — extraites du modèle CNAPS fév. 2026 (PyMuPDF). */
export const CNAPS_CHECKBOXES = {
  requestPrealable: { page: 1, x: 252, y: 405 },
  requestProvisoire: { page: 1, x: 317, y: 405 },
  civilityMadame: { page: 1, x: 40.5, y: 238.5 },
  civilityMonsieur: { page: 1, x: 107.7, y: 238.5 },
  authorizeContact: { page: 2, x: 56.8, y: 560.5 },
  activityGardiennageSimple: { page: 3, x: 56.8, y: 728.4 },
  activityGardiennageCatD: { page: 3, x: 56.8, y: 697.7 },
  activityGardiennageCatBD: { page: 3, x: 56.8, y: 666.9 },
  activityTelesurveillance: { page: 3, x: 56.8, y: 636.2 },
  activityVideoprotection: { page: 3, x: 56.8, y: 568.7 },
  formationInitiale: { page: 5, x: 56.8, y: 742.3 },
  formationMac: { page: 5, x: 56.8, y: 714.5 },
  formationAjoutChien: { page: 5, x: 56.8, y: 686.8 },
  formationVae: { page: 5, x: 56.8, y: 659.1 },
  identityCniRectoVerso: { page: 5, x: 56.8, y: 408.8 },
} as const satisfies Record<string, CnapsPoint>;

/**
 * Traits du formulaire officiel (underscores PyMuPDF, baseline y = pageHeight - y1 + 7).
 * Le modèle 2026 n'a pas de champs séparés prénom / naissance / tél / mail.
 */
export const CNAPS_TEXT_FIELDS = {
  /** Nom de naissance — trait gauche page 2 PDF. */
  nom: { page: 1, x: 208, y: 242.4, maxWidth: 213, size: 9 },
  /** Nom d'usage — trait droit (souvent vide / mariage). */
  usageName: { page: 1, x: 485, y: 242.4, maxWidth: 108, size: 8.5 },
  /** Adresse candidat complète (rue + CP + commune). */
  address: { page: 2, x: 57, y: 845.4, maxWidth: 478, size: 8.5 },
  schoolName: { page: 3, x: 248, y: 276.8, maxWidth: 346, size: 8.5 },
  schoolSiret: { page: 3, x: 373, y: 221.2, maxWidth: 222, size: 8.5 },
  schoolCnapsAuth: { page: 3, x: 452, y: 182, maxWidth: 147, size: 8.5 },
  schoolAddress: { page: 3, x: 95, y: 103.5, maxWidth: 444, size: 8.5 },
  schoolPostalCode: { page: 4, x: 78, y: 845.4, maxWidth: 125, size: 8.5 },
  schoolCity: { page: 4, x: 251, y: 845.4, maxWidth: 268, size: 8.5 },
  formationLabel: { page: 5, x: 143, y: 634.8, maxWidth: 412, size: 8.5 },
} as const satisfies Record<string, CnapsTextField>;
