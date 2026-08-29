/**
 * Connecteur EDOF catalogue — constantes & défauts documentés (P0).
 * Transport: XML_FILE + MANUAL_PORTAL (pas d'API). XSD: lheo_import_fichier_xml_optimise_v5r2.
 * Encoding fichier : **ISO-8859-1** (déclaré par le XSD et l'exemple officiel).
 *
 * Les codes LHEO ci-dessous sont des **défauts explicites** faute de champs GSMS —
 * chaque usage doit être listé dans `gaps` (severityité defaulted).
 */

export const LHEO_NS = 'https://www.of.moncompteformation.gouv.fr';

/** parcours-de-formation : 1 = formation entière (exemple officiel). */
export const DEFAULT_PARCOURS_DE_FORMATION = '1';

/** objectif-general-formation : 2 = certification (exemple officiel RNCP). */
export const DEFAULT_OBJECTIF_GENERAL = '2';

/** niveau-entree-obligatoire : 0 = non (exemple). */
export const DEFAULT_NIVEAU_ENTREE = '0';

/** modalites-entrees-sorties : 0 = entrées/sorties à dates fixes (exemple). */
export const DEFAULT_MODALITES_ENTREES_SORTIES = '0';

/** acces-handicapes : 0 = non renseigné / non accessible (à affiner). */
export const DEFAULT_ACCES_HANDICAPES = '0';

/** langue-formation */
export const DEFAULT_LANGUE = 'FR';

/** etat-recrutement : 1 = ouvert (exemple). */
export const DEFAULT_ETAT_RECRUTEMENT = '1';

/** code-perimetre-recrutement : 4 = région (exemple). */
export const DEFAULT_PERIMETRE_RECRUTEMENT = '4';

export type EdofGapSeverity = 'blocking' | 'defaulted' | 'missing_optional';

export type EdofGap = {
  severity: EdofGapSeverity;
  formationId?: string;
  formationSlug?: string;
  sessionId?: string;
  field: string;
  lheoPath: string;
  message: string;
  defaultUsed?: string;
};
