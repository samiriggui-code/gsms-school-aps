import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

function intervalsOverlap(a1: Date, a2: Date, b1: Date, b2: Date): boolean {
  return a1.getTime() <= b2.getTime() && b1.getTime() <= a2.getTime();
}

export type VenueRoomConflictInfo = {
  sessionId: string;
  formationName: string;
  dateDisplayLabel: string;
};

export function findVenueRoomConflicts(
  venueRoomId: string,
  sessions: FormationSessionApiRow[],
  draftRange: { start: Date; end: Date } | null,
  excludeSessionId: string | null,
): VenueRoomConflictInfo[] {
  if (!draftRange || !venueRoomId) return [];
  const hits: VenueRoomConflictInfo[] = [];
  for (const s of sessions) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    if ((s.venueRoomId ?? null) !== venueRoomId) continue;
    if (!s.startDate || !s.endDate) continue;
    if (
      intervalsOverlap(
        draftRange.start,
        draftRange.end,
        new Date(s.startDate),
        new Date(s.endDate),
      )
    ) {
      hits.push({
        sessionId: s.id,
        formationName: s.formationName,
        dateDisplayLabel: s.dateDisplayLabel || '—',
      });
    }
  }
  return hits;
}

/**
 * Indexe les chevauchements pour toutes les salles en une passe sur `sessions`
 * (évite O(nb salles × nb sessions) à chaque rendu).
 */
export function indexVenueRoomConflictsForRange(
  sessions: FormationSessionApiRow[],
  draftRange: { start: Date; end: Date },
  excludeSessionId: string | null,
): Map<string, VenueRoomConflictInfo[]> {
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const byRoom = new Map<string, VenueRoomConflictInfo[]>();
  for (const s of sessionList) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    const roomId = s.venueRoomId;
    if (!roomId || !s.startDate || !s.endDate) continue;
    if (
      !intervalsOverlap(
        draftRange.start,
        draftRange.end,
        new Date(s.startDate),
        new Date(s.endDate),
      )
    ) {
      continue;
    }
    const hit: VenueRoomConflictInfo = {
      sessionId: s.id,
      formationName: s.formationName,
      dateDisplayLabel: s.dateDisplayLabel || '—',
    };
    const list = byRoom.get(roomId);
    if (list) list.push(hit);
    else byRoom.set(roomId, [hit]);
  }
  return byRoom;
}
