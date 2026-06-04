/**
 * Copie les avatars Metronic depuis lms-crm vers lms-landing/public (hero + formateurs).
 * Idempotent — à lancer après clone si les PNG manquent.
 */
import { cpSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const landingRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(landingRoot, '../lms-crm/public/media/avatars');
const dest = join(landingRoot, 'public/media/avatars');

if (!existsSync(src)) {
  console.warn('[sync-media] Source introuvable:', src);
  process.exit(0);
}

mkdirSync(dest, { recursive: true });

for (const name of readdirSync(src)) {
  if (/^300-\d+\.png$/i.test(name) || name === 'blank.png') {
    cpSync(join(src, name), join(dest, name), { force: true });
  }
}

console.log('[sync-media] Avatars copiés vers', dest);
