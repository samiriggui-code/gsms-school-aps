/** Parcours effectif catalogue : override offre sinon fiche référence. */
export function effectiveCatalogParcours(
  parcoursSpecialite: string,
  parcoursSpecialiteOverride: string | null | undefined,
): string {
  if (parcoursSpecialiteOverride != null && String(parcoursSpecialiteOverride).trim() !== '') {
    return String(parcoursSpecialiteOverride);
  }
  return parcoursSpecialite;
}
