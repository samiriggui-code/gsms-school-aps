/**
 * Télécharge les blocs REUI depuis v1.reui.io et adapte les imports au monorepo lms-crm.
 * Usage: node scripts/install-reui-blocks.mjs statistic-card-1 statistic-card-2 ...
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const REGISTRY_BASE = 'https://v1.reui.io/r';

const BLOCK_GROUPS = {
  'statistic-card': 'cards/statistic-cards',
  'area-chart': 'charts/area-charts',
  'line-chart': 'charts/line-charts',
};

function resolveOutDir(name) {
  for (const [prefix, folder] of Object.entries(BLOCK_GROUPS)) {
    if (name.startsWith(prefix)) {
      return path.join(ROOT, 'components', folder);
    }
  }
  return path.join(ROOT, 'components', 'reui', name);
}

function transformSource(content, blockName) {
  let out = content
    .replaceAll("@/registry/default/ui/", '@/components/ui/')
    .replaceAll('@/registry/default/', '@/components/');

  const exportName = blockName
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');

  if (/export default function/.test(out)) {
    out = out.replace(/export default function (\w+)/, `export function ${exportName}`);
  } else if (!out.includes(`export function ${exportName}`)) {
    out = `'use client';\n\n${out}\nexport { ${exportName} };\n`;
  }

  if (!out.includes("'use client'")) {
    out = `'use client';\n\n${out}`;
  }

  return out;
}

async function fetchBlock(name) {
  const url = `${REGISTRY_BASE}/${name}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

async function installBlock(name) {
  const json = await fetchBlock(name);
  const file = json.files?.[0];
  if (!file?.content) throw new Error(`Pas de fichier dans ${name}`);

  const outDir = resolveOutDir(name);
  await fs.mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `${name}.tsx`);
  const source = transformSource(file.content, name);
  await fs.writeFile(outPath, source, 'utf8');
  console.log(`OK ${name} -> ${path.relative(ROOT, outPath)}`);
}

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error('Usage: node scripts/install-reui-blocks.mjs <block-name> ...');
  process.exit(1);
}

for (const name of names) {
  try {
    await installBlock(name);
  } catch (e) {
    console.error(`FAIL ${name}:`, e.message);
    process.exitCode = 1;
  }
}
