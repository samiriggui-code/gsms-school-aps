/** Clé / libellé catalogue — stockés dans Equipment.metadata + Equipment.label */

export function readCatalogMeta(metadata: unknown): {
  catalogKey: string;
  catalogLabel: string;
} {
  const m =
    metadata && typeof metadata === 'object' && !Array.isArray(metadata)
      ? (metadata as Record<string, unknown>)
      : {};
  return {
    catalogKey: String(m.catalogKey ?? '').trim(),
    catalogLabel: String(m.catalogLabel ?? '').trim(),
  };
}

export function getEquipmentCatalogKey(metadata: unknown, fallbackLabel: string): string {
  const { catalogKey } = readCatalogMeta(metadata);
  return catalogKey || fallbackLabel;
}

export function getEquipmentCatalogLabel(metadata: unknown, fallbackLabel: string): string {
  const { catalogLabel } = readCatalogMeta(metadata);
  return catalogLabel || fallbackLabel;
}
