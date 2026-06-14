export type VenueRoomUsageKind =
  | 'formation'
  | 'reunion_info'
  | 'reunion_personnel'
  | 'autre';

function normalizeHaystack(parts: Array<string | null | undefined>): string {
  return parts
    .filter((v): v is string => Boolean(v && String(v).trim()))
    .join(' ')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

/** Distingue formation, réunion d'information stagiaires, réunion personnel, autre. */
export function classifyVenueRoomUsage(input: {
  sessionKind?: string | null;
  sessionSubtitle?: string | null;
  dateDisplayLabel?: string | null;
  location?: string | null;
  formationName?: string | null;
}): VenueRoomUsageKind {
  const hay = normalizeHaystack([
    input.formationName,
    input.sessionSubtitle,
    input.dateDisplayLabel,
    input.location,
  ]);

  if (input.sessionKind === 'OTHER') {
    if (
      hay.includes('personnel') ||
      hay.includes('equipe') ||
      hay.includes('staff') ||
      hay.includes('professeur') ||
      hay.includes('formateur')
    ) {
      return 'reunion_personnel';
    }
    if (
      hay.includes('information') ||
      hay.includes('stagiaire') ||
      hay.includes('candidat') ||
      hay.includes('portes ouvertes') ||
      hay.includes('decouverte') ||
      hay.includes('futur')
    ) {
      return 'reunion_info';
    }
    return 'autre';
  }

  if (hay.includes('reunion')) {
    if (hay.includes('personnel') || hay.includes('equipe') || hay.includes('staff')) {
      return 'reunion_personnel';
    }
    return 'reunion_info';
  }

  return 'formation';
}

export function venueUsageLabelFr(kind: VenueRoomUsageKind): string {
  switch (kind) {
    case 'formation':
      return 'Formation';
    case 'reunion_info':
      return "Réunion d'information";
    case 'reunion_personnel':
      return 'Réunion du personnel';
    default:
      return 'Autre événement';
  }
}
