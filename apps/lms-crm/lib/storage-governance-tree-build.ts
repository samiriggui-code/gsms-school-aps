import { STORAGE_SOCLE_PREFIXES } from '@repo/storage/constants';
import type { GovernanceTreeNode } from './storage-governance-tree';

/** Compte les fichiers par préfixe de dossier (clé S3 sans le nom de fichier). */
export function buildStorageTreeFromKeys(storageKeys: string[]): GovernanceTreeNode[] {
  const directCounts = new Map<string, number>();
  const allPrefixes = new Set<string>();

  for (const rawKey of storageKeys) {
    const parts = rawKey.split('/').filter(Boolean);
    if (parts.length <= 1) continue;
    const filePrefix = parts.slice(0, -1).join('/');
    directCounts.set(filePrefix, (directCounts.get(filePrefix) ?? 0) + 1);

    const segments = filePrefix.split('/');
    for (let depth = 1; depth <= segments.length; depth++) {
      allPrefixes.add(segments.slice(0, depth).join('/'));
    }
  }

  const socleSet = new Set<string>(STORAGE_SOCLE_PREFIXES);
  const prefixes = [...allPrefixes].sort();

  return prefixes
    .map((prefix) => {
    const segments = prefix.split('/');
    const depth = segments.length;
    const parentParts = [...segments];
    parentParts.pop();
    const parentPrefix = parentParts.length ? parentParts.join('/') : null;
    const hasChildren = prefixes.some(
      (p) => p !== prefix && p.startsWith(`${prefix}/`) && p.split('/').length === depth + 1,
    );

    let fileCount = directCounts.get(prefix) ?? 0;
    if (fileCount === 0) {
      for (const [key, count] of directCounts) {
        if (key.startsWith(`${prefix}/`)) fileCount += count;
      }
    }

    return {
      prefix,
      label: segments[segments.length - 1] ?? prefix,
      fileCount,
      isSocle: socleSet.has(prefix),
      depth,
      parentPrefix,
      hasChildren,
    };
  })
    .filter((node) => node.fileCount > 0);
}
