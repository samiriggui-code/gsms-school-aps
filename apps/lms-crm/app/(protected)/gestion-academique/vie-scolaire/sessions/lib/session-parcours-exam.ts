import type { FormationParcoursSpecialite } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import type { FormationSessionApiRow } from '../types/formation-session-api-row';

/** Libellé unique pour l’examen lié au parcours Initial (pas de 2ᵉ case « avec examen » à part). */
export const EXAMEN_FINAL_BADGE_LABEL = 'Examen en fin de formation';

/** Parcours Initial → sanctionné par un examen en fin de parcours. MAC / RAN / Autre → pas ce dispositif. */
export function formationParcoursHasExamenFinal(parcours: FormationParcoursSpecialite): boolean {
  return parcours === 'INITIAL';
}

/**
 * Valeur `sessionKind` alignée sur le parcours de la formation :
 * - Initial → `WITH_EXAM` (examen = dimension du parcours initial, non dissociée)
 * - MAC, RAN, Autre → `INITIAL` (valeur historique côté enum = session hors parcours initial certifiant)
 */
export function sessionKindDerivedFromFormationParcours(
  parcours: FormationParcoursSpecialite,
): FormationSessionApiRow['sessionKind'] {
  return formationParcoursHasExamenFinal(parcours) ? 'WITH_EXAM' : 'INITIAL';
}

const PARCOURS_SEARCH: Record<FormationParcoursSpecialite, string> = {
  INITIAL: 'initial',
  MAC: 'mac',
  RAN: 'ran',
  AUTRE: 'autre',
};

/** Filtre / recherche texte : mots-clés liés à l’examen selon le parcours. */
export function sessionExamenSearchBlob(row: FormationSessionApiRow): string {
  return formationParcoursHasExamenFinal(row.formationParcours)
    ? `${EXAMEN_FINAL_BADGE_LABEL} examen`
    : `${PARCOURS_SEARCH[row.formationParcours]} sans examen certifiant`;
}
