import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

let cachedMonorepoRoot: string | null = null;

function getMonorepoRoot(): string {
  if (cachedMonorepoRoot) return cachedMonorepoRoot;

  const fromEnv = process.env.EMAIL_MONOREPO_ROOT?.trim();
  if (fromEnv) {
    cachedMonorepoRoot = path.resolve(fromEnv);
    return path.resolve(fromEnv);
  }

  const tryRoot = (root: string) => {
    const normalized = path.resolve(root);
    const marker = path.join(normalized, 'packages', 'emails', 'package.json');
    if (existsSync(marker)) {
      cachedMonorepoRoot = normalized;
      return true;
    }
    return false;
  };

  try {
    const metaUrl = (import.meta as { url?: string }).url;
    if (metaUrl) {
      const fromMeta = path.resolve(path.dirname(fileURLToPath(metaUrl)), '../../..');
      if (tryRoot(fromMeta)) return cachedMonorepoRoot!;
    }
  } catch {
    // React Email CLI
  }

  const cwd = process.cwd();
  if (tryRoot(path.resolve(cwd, '../..'))) return cachedMonorepoRoot!;
  if (tryRoot(cwd)) return cachedMonorepoRoot!;

  cachedMonorepoRoot = path.resolve(cwd, '../..');
  return cachedMonorepoRoot!;
}

function fileToDataUri(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === '.svg'
      ? 'image/svg+xml'
      : ext === '.png'
        ? 'image/png'
        : ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : 'image/png';
  return `data:${mime};base64,${readFileSync(filePath).toString('base64')}`;
}

/** Résolution FS — preview / CLI uniquement. */
export function readMonorepoAssetAsDataUri(candidates: string[]): string | null {
  const root = getMonorepoRoot();
  for (const rel of candidates) {
    const full = path.join(root, rel);
    if (existsSync(full)) return fileToDataUri(full);
  }
  return null;
}
