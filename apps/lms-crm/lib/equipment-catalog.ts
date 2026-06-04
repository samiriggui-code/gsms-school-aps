/** Siège unique — entrepôt de l'école (affichage catalogue / stock). */
export const EQUIPMENT_HEADQUARTERS_SITE_NAME = 'Siège — Campus Principal Paris';

const LEGACY_UNIT_SUFFIX = /-(USE|MNT)$/i;
const UNIT_INDEX_SUFFIX = /-(\d{3})$/;

export function isLegacyEquipmentClone(serialNumber: string): boolean {
  return LEGACY_UNIT_SUFFIX.test(serialNumber);
}

export function extractUnitIndex(serialNumber: string): number | null {
  const match = serialNumber.match(UNIT_INDEX_SUFFIX);
  if (!match) return null;
  const n = Number.parseInt(match[1], 10);
  return Number.isFinite(n) ? n : null;
}

export function getCatalogBaseSerial(serialNumber: string): string {
  return serialNumber
    .replace(UNIT_INDEX_SUFFIX, '')
    .replace(LEGACY_UNIT_SUFFIX, '');
}

export function formatEquipmentUnitReference(serialNumber: string, fallbackLabel?: string): string {
  const ref = serialNumber?.trim();
  if (ref) return ref;
  return fallbackLabel?.trim() || '—';
}

export function formatEquipmentUnitLabel(label: string, serialNumber: string): string {
  return formatEquipmentUnitReference(serialNumber, label);
}

export type EquipmentStatusKey = 'AVAILABLE' | 'IN_USE' | 'MAINTENANCE' | 'OUT_OF_SERVICE';

export function defaultStatusForUnitIndex(index: number): EquipmentStatusKey {
  const cycle: EquipmentStatusKey[] = ['AVAILABLE', 'IN_USE', 'MAINTENANCE'];
  return cycle[(index - 1) % cycle.length] ?? 'AVAILABLE';
}

export function buildUnitSerialNumber(baseSerial: string, index: number): string {
  const base = getCatalogBaseSerial(baseSerial.trim());
  return `${base}-${String(index).padStart(3, '0')}`;
}
