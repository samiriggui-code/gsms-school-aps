import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TEMPLATE_FILENAME = 'cnaps-form-template.pdf';

/** Chemins possibles selon cwd (monorepo root vs apps/lms-crm) et bundler Next. */
export function resolveCnapsTemplatePath(): string {
  const cwd = process.cwd();
  const moduleDir = path.dirname(fileURLToPath(import.meta.url));

  const candidates = [
    path.join(moduleDir, 'assets', TEMPLATE_FILENAME),
    path.join(cwd, 'lib', 'cnaps', 'assets', TEMPLATE_FILENAME),
    path.join(cwd, 'apps', 'lms-crm', 'lib', 'cnaps', 'assets', TEMPLATE_FILENAME),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  throw new Error('CNAPS_TEMPLATE_MISSING');
}
