/** Libellé lieu session : salle référencée prioritaire sur le texte libre. */
export function resolveFormationSessionLocation(input: {
  location?: string | null;
  venueRoom?: { name?: string | null; shortCode?: string | null } | null;
}): string {
  const roomName = input.venueRoom?.name?.trim();
  if (roomName) return roomName;
  const shortCode = input.venueRoom?.shortCode?.trim();
  if (shortCode) return `Salle ${shortCode}`;
  const freeText = input.location?.trim();
  if (freeText) return freeText;
  return 'Lieu à préciser';
}

export const SUIVI_DAY_SLOT_LABELS = {
  MORNING: 'Matin',
  EVENING: 'Après-midi',
} as const;
