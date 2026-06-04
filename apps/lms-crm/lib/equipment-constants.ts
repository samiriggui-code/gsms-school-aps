/** Types techniques d'équipement — source unique CRM + seed. */
export const EQUIPMENT_TYPE_VALUES = [
  'SECOURISME',
  'INCENDIE',
  'MANNEQUIN_PEDAGOGIQUE',
  'EPI',
  'SECURITE_PRIVEE',
  'INFORMATIQUE',
  'MOBILIER',
  'AUTRE',
] as const;

export type EquipmentTypeValue = (typeof EQUIPMENT_TYPE_VALUES)[number];

export const EQUIPMENT_TYPE_LABELS: Record<EquipmentTypeValue, string> = {
  SECOURISME: 'Secourisme',
  INCENDIE: 'Incendie',
  MANNEQUIN_PEDAGOGIQUE: 'Mannequin pédagogique',
  EPI: 'EPI',
  SECURITE_PRIVEE: 'Sécurité privée',
  INFORMATIQUE: 'Informatique',
  MOBILIER: 'Mobilier',
  AUTRE: 'Autre',
};

export function getEquipmentTypeLabel(type: string | null | undefined): string {
  if (!type) return 'Non renseigné';
  return EQUIPMENT_TYPE_LABELS[type as EquipmentTypeValue] ?? type;
}

/** Anciennes valeurs UI → types canoniques (seed / filtres). */
export const LEGACY_EQUIPMENT_TYPE_MAP: Record<string, EquipmentTypeValue> = {
  DEFIBRILLATEUR: 'SECOURISME',
  EXTINCTEUR: 'INCENDIE',
};

export function normalizeEquipmentType(type: string | null | undefined): EquipmentTypeValue {
  if (!type) return 'AUTRE';
  if (EQUIPMENT_TYPE_VALUES.includes(type as EquipmentTypeValue)) {
    return type as EquipmentTypeValue;
  }
  return LEGACY_EQUIPMENT_TYPE_MAP[type] ?? 'AUTRE';
}

export const PEDAGOGIC_DOMAIN_VALUES = [
  'secourisme',
  'incendie',
  'securite-privee',
  'tertiaire',
  'transversal',
] as const;

export type PedagogicDomainValue = (typeof PEDAGOGIC_DOMAIN_VALUES)[number];

export const PEDAGOGIC_DOMAIN_LABELS: Record<PedagogicDomainValue, string> = {
  secourisme: 'Secourisme',
  incendie: 'Incendie',
  'securite-privee': 'Sécurité privée',
  tertiaire: 'Tertiaire',
  transversal: 'Transversal',
};

export function getPedagogicDomainLabel(domain: string | null | undefined): string {
  if (!domain) return 'Non renseigné';
  return PEDAGOGIC_DOMAIN_LABELS[domain as PedagogicDomainValue] ?? domain;
}
