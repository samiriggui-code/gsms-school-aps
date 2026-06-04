/** Lignes issues du JSON référentiel `Formation.fundingBlocks` / `.prerequisitesTable`. */

export type FundingBlockRow = Record<string, unknown> & { label?: unknown; info?: unknown };

export type PrerequisiteRow = Record<string, unknown> & {
  item?: unknown;
  detail?: unknown;
  importance?: unknown;
};

export function normalizeFundingBlocks(value: unknown): FundingBlockRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is FundingBlockRow => x !== null && typeof x === 'object');
}

export function normalizePrerequisitesTable(value: unknown): PrerequisiteRow[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is PrerequisiteRow => x !== null && typeof x === 'object');
}

export function fundingOptionKey(index: number): string {
  return `f:${index}`;
}

export function prerequisiteOptionKey(index: number): string {
  return `p:${index}`;
}

function stableFundingSig(r: FundingBlockRow): string {
  return JSON.stringify({ label: r.label ?? null, info: r.info ?? null });
}

function stablePrerequisiteSig(r: PrerequisiteRow): string {
  return JSON.stringify({
    item: r.item ?? null,
    detail: r.detail ?? null,
    importance: r.importance ?? null,
  });
}

/** Déduit les cases cochées à partir du tableau effectif fusionné (offre + référence). */
export function inferFundingKeySelection(reference: FundingBlockRow[], effective: unknown): Set<string> {
  const effRows = normalizeFundingBlocks(effective);
  const effSigs = new Set(effRows.map(stableFundingSig));
  const keys = new Set<string>();
  reference.forEach((row, i) => {
    if (effSigs.has(stableFundingSig(row))) keys.add(fundingOptionKey(i));
  });
  return keys;
}

export function inferPrerequisiteKeySelection(reference: PrerequisiteRow[], effective: unknown): Set<string> {
  const effRows = normalizePrerequisitesTable(effective);
  const effSigs = new Set(effRows.map(stablePrerequisiteSig));
  const keys = new Set<string>();
  reference.forEach((row, i) => {
    if (effSigs.has(stablePrerequisiteSig(row))) keys.add(prerequisiteOptionKey(i));
  });
  return keys;
}

function arraysJsonEqual(a: unknown[], b: unknown[]): boolean {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

/** Création catalogue : pas de surcharge si tout est sélectionné ; [] si rien. */
export function fundingBlocksForCreatePayload(
  reference: FundingBlockRow[],
  selectedKeys: Set<string>,
): FundingBlockRow[] | undefined {
  if (reference.length === 0) return undefined;
  const filtered = reference.filter((_, i) => selectedKeys.has(fundingOptionKey(i)));
  if (selectedKeys.size === 0) return [];
  if (selectedKeys.size === reference.length && arraysJsonEqual(filtered, reference)) return undefined;
  return filtered;
}

export function prerequisitesTableForCreatePayload(
  reference: PrerequisiteRow[],
  selectedKeys: Set<string>,
): PrerequisiteRow[] | undefined {
  if (reference.length === 0) return undefined;
  const filtered = reference.filter((_, i) => selectedKeys.has(prerequisiteOptionKey(i)));
  if (selectedKeys.size === 0) return [];
  if (selectedKeys.size === reference.length && arraysJsonEqual(filtered, reference)) return undefined;
  return filtered;
}

/** Mise à jour offre : null réinitialise la surcharge (reprend la fiche référence). */
export function fundingBlocksForPatchPayload(
  reference: FundingBlockRow[],
  selectedKeys: Set<string>,
): FundingBlockRow[] | null {
  if (reference.length === 0) return null;
  const filtered = reference.filter((_, i) => selectedKeys.has(fundingOptionKey(i)));
  if (selectedKeys.size === 0) return [];
  if (selectedKeys.size === reference.length && arraysJsonEqual(filtered, reference)) return null;
  return filtered;
}

export function prerequisitesTableForPatchPayload(
  reference: PrerequisiteRow[],
  selectedKeys: Set<string>,
): PrerequisiteRow[] | null {
  if (reference.length === 0) return null;
  const filtered = reference.filter((_, i) => selectedKeys.has(prerequisiteOptionKey(i)));
  if (selectedKeys.size === 0) return [];
  if (selectedKeys.size === reference.length && arraysJsonEqual(filtered, reference)) return null;
  return filtered;
}

export function setsEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  return Array.from(a).every((x) => b.has(x));
}
