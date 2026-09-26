import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(d, acc = []) {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === '.next') continue;
      walk(p, acc);
    } else if (/\.(tsx?|jsx?)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function rel(f) {
  return path.relative(root, f).replace(/\\/g, '/');
}

const all = [...walk(path.join(root, 'app')), ...walk(path.join(root, 'components')), ...walk(path.join(root, 'hooks')), ...walk(path.join(root, 'lib'))];
const fromRe = /from\s+['"]([^'"]+)['"]/g;

function resolve(from, spec) {
  let t;
  if (spec.startsWith('@/')) t = path.join(root, spec.slice(2));
  else if (spec.startsWith('.')) t = path.resolve(path.dirname(from), spec);
  else return null;
  for (const c of [t, t + '.ts', t + '.tsx', path.join(t, 'index.ts'), path.join(t, 'index.tsx')]) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

const reverse = new Map();
for (const f of all) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  fromRe.lastIndex = 0;
  while ((m = fromRe.exec(src))) {
    const r = resolve(f, m[1]);
    if (!r) continue;
    if (!reverse.has(r)) reverse.set(r, new Set());
    reverse.get(r).add(f);
  }
}

const liveRe =
  /(^app\/formateur\/|^app\/mon-dossier\/|^app\/\(site\)\/|^app\/export\/|^app\/docs\/|^app\/apprendre\/|^app\/e-formation\/|^app\/formation\/|^app\/reports\/|^components\/instructor\/|^components\/portal\/|^components\/official-documents\/|^components\/notifications\/|^components\/workspace-settings\/|^components\/eve\/|^components\/auth\/|^components\/reports\/|^app\/components\/)/;

function hasLiveImporter(file, seen = new Set()) {
  if (seen.has(file)) return null;
  seen.add(file);
  for (const from of reverse.get(file) || []) {
    const r = rel(from);
    if (liveRe.test(r)) return r;
    // layouts under protected that are not stubs still count
    if (/\/layout\.(tsx|ts)$/.test(r) && r.includes('(protected)/')) return r;
    // recurse through non-live intermediaries (e.g. official-documents already live)
    const hit = hasLiveImporter(from, seen);
    if (hit) return hit;
  }
  return null;
}

const dirs = [
  'app/(protected)/gestion-academique/vie-scolaire/etudiants/components',
  'app/(protected)/gestion-academique/vie-scolaire/formations/components',
  'app/(protected)/gestion-academique/vie-scolaire/sessions/components',
  'app/(protected)/gestion-ressources/rh/collaborateurs/components',
  'app/(protected)/gestion-ressources/rh/formateurs/components',
  'app/(protected)/gestion-ressources/compagnie/documents/components',
  'app/(protected)/securite-configuration/acces/users/[id]/components',
  'app/(protected)/securite-configuration/parametres/settings/components',
  'app/(protected)/account/notifications/components',
  'app/(protected)/securite-configuration/components',
];

for (const d of dirs) {
  console.log('\n## ' + d);
  const files = walk(path.join(root, d));
  let keep = 0,
    orphan = 0;
  for (const f of files.sort()) {
    const hit = hasLiveImporter(f);
    if (hit) {
      keep++;
      console.log('KEEP  ' + rel(f) + '  <- ' + hit);
    } else {
      orphan++;
      console.log('ORPHAN ' + rel(f));
    }
  }
  console.log(`# summary keep=${keep} orphan=${orphan}`);
}

// orphan hooks under leaf features (parent page stubbed, not used by live)
console.log('\n## orphan hooks under stubbed leaves');
const hookFiles = walk(path.join(root, 'app/(protected)')).filter((f) =>
  /[/\\]hooks[/\\]/.test(f),
);
for (const f of hookFiles.sort()) {
  const hit = hasLiveImporter(f);
  if (!hit) console.log('ORPHAN ' + rel(f));
}

// components/users file-level
console.log('\n## components/users file-level');
for (const f of walk(path.join(root, 'components/users')).sort()) {
  const hit = hasLiveImporter(f);
  console.log((hit ? 'KEEP  ' : 'ORPHAN ') + rel(f) + (hit ? '  <- ' + hit : ''));
}

// components/iam
console.log('\n## components/iam');
for (const f of walk(path.join(root, 'components/iam')).sort()) {
  const hit = hasLiveImporter(f);
  console.log((hit ? 'KEEP  ' : 'ORPHAN ') + rel(f) + (hit ? '  <- ' + hit : ''));
}

// sheet-shared unused files
console.log('\n## components/sheet-shared');
for (const f of walk(path.join(root, 'components/sheet-shared')).sort()) {
  const hit = hasLiveImporter(f);
  console.log((hit ? 'KEEP  ' : 'ORPHAN ') + rel(f) + (hit ? '  <- ' + hit : ''));
}

// governance
console.log('\n## components/governance');
for (const f of walk(path.join(root, 'components/governance')).sort()) {
  const hit = hasLiveImporter(f);
  console.log((hit ? 'KEEP  ' : 'ORPHAN ') + rel(f) + (hit ? '  <- ' + hit : ''));
}
