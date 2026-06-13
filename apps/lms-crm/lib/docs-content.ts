import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { prepareDocsMarkdown, type PreparedDocsContent } from '@/lib/docs-markdown';

function resolveDocsRoot(): string {
  const candidates = [
    join(process.cwd(), 'content', 'docs'),
    join(process.cwd(), 'apps', 'lms-crm', 'content', 'docs'),
  ];
  for (const root of candidates) {
    if (existsSync(join(root, 'docs.json'))) return root;
  }
  return candidates[0];
}

const DOCS_ROOT = resolveDocsRoot();

export function resolveDocsMdxPath(slugParts: string[]): string | null {
  const slug = slugParts.join('/');
  const candidates = [`${slug}.mdx`];
  for (const rel of candidates) {
    const full = join(DOCS_ROOT, rel);
    if (existsSync(full)) return full;
  }
  return null;
}

export function readDocsMdx(slugParts: string[]): string | null {
  const path = resolveDocsMdxPath(slugParts);
  if (!path) return null;
  return readFileSync(path, 'utf8');
}

export function readPreparedDocs(slugParts: string[]): PreparedDocsContent | null {
  const raw = readDocsMdx(slugParts);
  if (!raw) return null;
  return prepareDocsMarkdown(raw);
}

export { slugToTitle, resolveDocsLocale } from '@/lib/docs-navigation';
export type { DocsLocale, DocsNavGroup } from '@/lib/docs-types';
export { getDocsNavigation } from '@/lib/docs-navigation';
