import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

export function normalizeSessionEquipmentIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((x): x is string => typeof x === 'string' && /^[0-9a-f-]{36}$/i.test(x));
}

function intervalsOverlap(a1: Date, a2: Date, b1: Date, b2: Date): boolean {
  return a1.getTime() <= b2.getTime() && b1.getTime() <= a2.getTime();
}

export type EquipmentConflictInfo = {
  sessionId: string;
  formationName: string;
  dateDisplayLabel: string;
};

export function findEquipmentConflicts(
  equipmentId: string,
  sessions: FormationSessionApiRow[],
  draftRange: { start: Date; end: Date } | null,
  excludeSessionId: string | null,
): EquipmentConflictInfo[] {
  if (!draftRange) return [];
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const hits: EquipmentConflictInfo[] = [];
  for (const s of sessionList) {
    if (excludeSessionId && s.id === excludeSessionId) continue;
    const ids = normalizeSessionEquipmentIds(s.reservedEquipmentIds);
    if (!ids.includes(equipmentId)) continue;
    if (!s.startDate || !s.endDate) continue;
    if (
      intervalsOverlap(draftRange.start, draftRange.end, new Date(s.startDate), new Date(s.endDate))
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

const STATUS_ORDER: Record<string, number> = {
  AVAILABLE: 0,
  IN_USE: 1,
  MAINTENANCE: 2,
  OUT_OF_SERVICE: 3,
};

export function equipmentInventoryLabel(status: string): string {
  switch (status) {
    case 'AVAILABLE':
      return 'Disponible (stock)';
    case 'IN_USE':
      return 'En utilisation';
    case 'MAINTENANCE':
      return 'Maintenance';
    case 'OUT_OF_SERVICE':
      return 'Hors service';
    default:
      return status;
  }
}

export type EquipmentPickRowModel = {
  id: string;
  label: string;
  serialNumber: string;
  status: string;
  statusRank: number;
  conflictHint: string | null;
  isSelectableInventory: boolean;
  sortAvailabilityRank: number;
};

export function buildEquipmentPickRows(
  inventory: { id: string; label: string; serialNumber: string; status: string }[],
  sessions: FormationSessionApiRow[],
  draftRange: { start: Date; end: Date } | null,
  excludeSessionId: string | null,
  selectedIds: Set<string>,
): EquipmentPickRowModel[] {
  const sessionList = Array.isArray(sessions) ? sessions : [];
  const rows = inventory.map((eq) => {
    const conflicts = findEquipmentConflicts(eq.id, sessionList, draftRange, excludeSessionId);
    const conflictHint =
      conflicts.length > 0
        ? conflicts
            .map((c) => `${c.formationName} (${c.dateDisplayLabel})`)
            .slice(0, 2)
            .join(' · ') + (conflicts.length > 2 ? ` (+${conflicts.length - 2})` : '')
        : null;
    const hasConflict = Boolean(conflictHint);
    const statusRank = STATUS_ORDER[eq.status] ?? 99;
    const isSelectableInventory = eq.status === 'AVAILABLE';

    let sortAvailabilityRank = 2;
    if (!draftRange) sortAvailabilityRank = 2;
    else if (hasConflict) sortAvailabilityRank = 1;
    else if (!isSelectableInventory) sortAvailabilityRank = 1;
    else sortAvailabilityRank = 0;

    return {
      id: eq.id,
      label: eq.label,
      serialNumber: eq.serialNumber,
      status: eq.status,
      statusRank,
      conflictHint,
      isSelectableInventory,
      sortAvailabilityRank,
    };
  });

  rows.sort((a, b) => {
    const selA = selectedIds.has(a.id) ? 0 : 1;
    const selB = selectedIds.has(b.id) ? 0 : 1;
    if (selA !== selB) return selA - selB;
    if (a.sortAvailabilityRank !== b.sortAvailabilityRank) return a.sortAvailabilityRank - b.sortAvailabilityRank;
    if (a.statusRank !== b.statusRank) return a.statusRank - b.statusRank;
    return a.label.localeCompare(b.label, 'fr', { sensitivity: 'base' });
  });

  return rows;
}
