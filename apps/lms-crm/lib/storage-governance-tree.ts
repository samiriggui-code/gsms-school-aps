export type GovernanceTreeNode = {
  prefix: string;
  label: string;
  /** Libellé nominatif (remplace l’UUID dans l’UI). */
  displayLabel?: string;
  entityId?: string | null;
  entityKind?: string | null;
  fileCount: number;
  isSocle: boolean;
  depth: number;
  parentPrefix: string | null;
  hasChildren: boolean;
};

/** Nœuds visibles dans l’explorateur (racines + enfants des dossiers dépliés). */
export function visibleTreeNodes(
  nodes: GovernanceTreeNode[],
  expanded: Set<string>,
): GovernanceTreeNode[] {
  return nodes.filter((node) => {
    if (node.depth === 1) return true;
    if (!node.parentPrefix) return true;
    let current: string | null = node.parentPrefix;
    while (current) {
      if (!expanded.has(current)) return false;
      const parent = nodes.find((n) => n.prefix === current);
      current = parent?.parentPrefix ?? null;
    }
    return true;
  });
}
