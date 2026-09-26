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

const allTs = [
  ...walk(path.join(root, 'app')),
  ...walk(path.join(root, 'components')),
  ...walk(path.join(root, 'hooks')),
  ...walk(path.join(root, 'lib')),
  ...walk(path.join(root, 'providers')),
  ...walk(path.join(root, 'config')),
];

function rel(f) {
  return path.relative(root, f).replace(/\\/g, '/');
}

function isRoutePage(f) {
  return /[/\\]page\.(tsx|ts)$/.test(f);
}
function isRouteLayout(f) {
  return /[/\\]layout\.(tsx|ts)$/.test(f);
}
function isRouteEntry(f) {
  return /[/\\](page|layout|loading|template|error|route)\.(tsx|ts)$/.test(f);
}

function isStubPage(f) {
  if (!isRoutePage(f)) return false;
  if (!f.includes('(protected)')) return false;
  try {
    return fs.readFileSync(f, 'utf8').includes('QualiopiDevStubPage');
  } catch {
    return false;
  }
}

function resolveImport(fromFile, spec) {
  let target;
  if (spec.startsWith('@/')) target = path.join(root, spec.slice(2));
  else if (spec.startsWith('.')) target = path.resolve(path.dirname(fromFile), spec);
  else return null;
  const cands = [
    target,
    target + '.ts',
    target + '.tsx',
    target + '.js',
    target + '.jsx',
    path.join(target, 'index.ts'),
    path.join(target, 'index.tsx'),
  ];
  for (const c of cands) {
    if (fs.existsSync(c) && fs.statSync(c).isFile()) return c;
  }
  return null;
}

const fromRe = /from\s+['"]([^'"]+)['"]/g;
const dynRe = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const graph = new Map();
const reverse = new Map();
for (const f of allTs) {
  const src = fs.readFileSync(f, 'utf8');
  const deps = new Set();
  let m;
  fromRe.lastIndex = 0;
  while ((m = fromRe.exec(src))) {
    const r = resolveImport(f, m[1]);
    if (r) deps.add(r);
  }
  dynRe.lastIndex = 0;
  while ((m = dynRe.exec(src))) {
    const r = resolveImport(f, m[1]);
    if (r) deps.add(r);
  }
  graph.set(f, [...deps]);
  for (const d of deps) {
    if (!reverse.has(d)) reverse.set(d, new Set());
    reverse.get(d).add(f);
  }
}

const liveAppPrefixes = [
  'app/formateur/',
  'app/mon-dossier/',
  'app/(site)/',
  'app/docs/',
  'app/apprendre/',
  'app/e-formation/',
  'app/formation/',
  'app/export/',
  'app/reports/',
  'app/auth/',
  'app/api/',
  'app/components/', // demo1 shell partials
];

const seeds = new Set();
for (const f of allTs) {
  const r = rel(f);
  if (r === 'app/layout.tsx' || r === 'app/providers.tsx' || r === 'app/not-found.tsx') {
    seeds.add(f);
    continue;
  }
  // Stub CRM pages (only pull Qualiopi stub tree)
  if (isStubPage(f)) {
    seeds.add(f);
    continue;
  }
  // Live protected route pages (cartographie-front)
  if (r.includes('(protected)/') && isRoutePage(f) && !isStubPage(f)) {
    seeds.add(f);
    continue;
  }
  // Protected layouts always mount
  if (r.includes('(protected)/') && isRouteLayout(f)) {
    seeds.add(f);
    continue;
  }
  // Live app route entries
  if (liveAppPrefixes.some((p) => r.startsWith(p)) && isRouteEntry(f)) {
    seeds.add(f);
  }
}

const reachable = new Set();
const q = [...seeds];
while (q.length) {
  const cur = q.pop();
  if (reachable.has(cur)) continue;
  reachable.add(cur);
  for (const d of graph.get(cur) || []) {
    if (!reachable.has(d)) q.push(d);
  }
}

function isLiveSurface(r) {
  return (
    liveAppPrefixes.some((p) => r.startsWith(p)) ||
    r.startsWith('components/instructor/') ||
    r.startsWith('components/portal/') ||
    r.startsWith('components/workspace-settings/') ||
    r.startsWith('components/eve/') ||
    r.startsWith('components/auth/') ||
    r.startsWith('components/reports/') ||
    r.startsWith('components/notifications/') ||
    r.startsWith('components/official-documents/') ||
    r.startsWith('components/crm/') ||
    r.startsWith('components/common/') ||
    r === 'app/layout.tsx'
  );
}

function liveImportersOf(file) {
  const out = [];
  const seen = new Set();
  const qq = [...(reverse.get(file) || [])];
  while (qq.length) {
    const cur = qq.pop();
    if (seen.has(cur)) continue;
    seen.add(cur);
    const r = rel(cur);
    if (reachable.has(cur) && isLiveSurface(r)) out.push(r);
    // also walk up if importer is itself only used by live
    if (reachable.has(cur)) {
      for (const up of reverse.get(cur) || []) qq.push(up);
    }
  }
  return [...new Set(out)];
}

const stubPages = allTs.filter(isStubPage).map(rel);
const liveProtectedPages = allTs
  .filter((f) => rel(f).includes('(protected)/') && isRoutePage(f) && !isStubPage(f))
  .map(rel);

console.log(
  JSON.stringify(
    {
      files: allTs.length,
      seeds: seeds.size,
      reachable: reachable.size,
      stubPages: stubPages.length,
      liveProtectedPages,
    },
    null,
    2,
  ),
);

// --- Protected component dirs ---
const protCompRoots = [];
function findCompDirs(d) {
  if (!fs.existsSync(d)) return;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const p = path.join(d, e.name);
    if (e.name === 'components') protCompRoots.push(p);
    else findCompDirs(p);
  }
}
findCompDirs(path.join(root, 'app/(protected)'));

const hubNameRe =
  /(menu-cards|welcome-callout|security-highlights|section-.*-stats|section-.*-welcome|section-.*-security|section-.*-menu|stats-dynamic|module-menu)/i;

function classifyDir(dir) {
  const r = rel(dir);
  const files = walk(dir);
  const parts = r.split('/');
  const after = parts.slice(2);
  const idx = after.indexOf('components');
  // section=1, module=2, leaf>=3
  const hubFiles = files.filter((f) => hubNameRe.test(path.basename(f)));
  const isSectionOrModule = idx >= 1 && idx <= 2;
  const keepHub =
    isSectionOrModule ||
    hubNameRe.test(r) ||
    (idx <= 2 && hubFiles.length > 0);
  // For leaf dirs, hub-named files alone do NOT keep the whole dir
  const reachFiles = files.filter((f) => reachable.has(f));
  const liveHits = [];
  for (const f of files) {
    const imps = liveImportersOf(f);
    if (imps.length) liveHits.push({ file: rel(f), imps: imps.slice(0, 8) });
  }
  return {
    rel: r,
    level: idx,
    keepHub,
    reachCount: reachFiles.length,
    fileCount: files.length,
    liveHits,
    reach: reachFiles.length > 0,
  };
}

const results = protCompRoots.map(classifyDir);

console.log('\n=== KEEP — reachable from live entry (layout/instructor/portal/export/…) ===');
for (const r of results.filter((x) => x.reach).sort((a, b) => a.rel.localeCompare(b.rel))) {
  console.log(`KEEP-LIVE level=${r.level} files=${r.fileCount} reach=${r.reachCount} ${r.rel}`);
  for (const h of r.liveHits.slice(0, 5)) {
    console.log(`  via ${h.file} <- ${h.imps.join(', ')}`);
  }
}

console.log('\n=== KEEP — section/module hub (orphan OK) ===');
for (const r of results
  .filter((x) => !x.reach && x.keepHub)
  .sort((a, b) => a.rel.localeCompare(b.rel))) {
  console.log(`KEEP-HUB level=${r.level} files=${r.fileCount} ${r.rel}`);
}

console.log('\n=== DELETE — leaf orphan component dirs ===');
const deletable = results
  .filter((x) => !x.reach && !x.keepHub && x.level >= 3)
  .sort((a, b) => a.rel.localeCompare(b.rel));
for (const r of deletable) {
  console.log(`DELETE dir files=${r.fileCount} ${r.rel}`);
}

console.log('\n=== REVIEW — empty or odd ===');
for (const r of results.filter((x) => x.fileCount === 0 || (!x.reach && !x.keepHub && x.level <= 2))) {
  console.log(`REVIEW level=${r.level} files=${r.fileCount} reach=${r.reach} ${r.rel}`);
}

// Orphan sibling content (not under components/) still next to stubs
console.log('\n=== DELETE — orphan feature content files (not reachable, not hubs) ===');
const orphanContent = [];
for (const f of allTs) {
  const r = rel(f);
  if (!r.includes('app/(protected)/')) continue;
  if (isRoutePage(f) || isRouteLayout(f)) continue;
  if (reachable.has(f)) continue;
  // skip if under a KEEP-HUB or KEEP-LIVE dir
  const parentComp = results.find((d) => r.startsWith(d.rel + '/'));
  if (parentComp && (parentComp.reach || parentComp.keepHub)) continue;
  // skip hooks/lib colocalized? include feature UI patterns
  if (
    /components\//.test(r) ||
    /-(sheet|form|datagrid|dialog|page|content)\.(tsx|ts)$/i.test(path.basename(f)) ||
    /(create|add|edit|detail).*?\.(tsx|ts)$/i.test(path.basename(f))
  ) {
    orphanContent.push(r);
  }
}
// Only list orphans NOT already covered by DELETE dirs
for (const r of orphanContent.sort()) {
  const covered = deletable.some((d) => r.startsWith(d.rel + '/'));
  if (!covered) console.log(`DELETE file ${r}`);
}

// Top-level component dirs
console.log('\n=== Top-level components/* verdict ===');
const topDirs = fs
  .readdirSync(path.join(root, 'components'), { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const forcedKeep = new Set([
  'crm',
  'common',
  'instructor',
  'portal',
  'workspace-settings',
  'eve',
  'auth',
  'reports',
]);

for (const name of topDirs) {
  const dir = path.join(root, 'components', name);
  const files = walk(dir);
  const reachFiles = files.filter((f) => reachable.has(f));
  const liveImps = new Set();
  for (const f of files) {
    for (const im of liveImportersOf(f)) liveImps.add(im);
    // also direct reverse from reachable live
    for (const from of reverse.get(f) || []) {
      if (reachable.has(from)) liveImps.add(rel(from));
    }
  }
  // CSS-only usage for keenicons
  let cssKeep = false;
  if (name === 'keenicons') {
    for (const f of allTs) {
      const src = fs.readFileSync(f, 'utf8');
      if (src.includes('@/components/keenicons')) {
        cssKeep = true;
        liveImps.add(rel(f) + ' (css/import)');
      }
    }
  }
  let verdict;
  if (forcedKeep.has(name)) verdict = 'KEEP (policy)';
  else if (reachFiles.length > 0 || cssKeep) verdict = 'KEEP (live)';
  else verdict = 'DELETE-CANDIDATE';
  console.log(
    JSON.stringify({
      dir: `components/${name}`,
      files: files.length,
      reachable: reachFiles.length,
      sampleLiveImporters: [...liveImps].slice(0, 12),
      verdict,
    }),
  );
}

// Loose root components used only by orphans?
console.log('\n=== Loose components/*.tsx live check (sample of Metronic leftovers) ===');
const looseSuspects = [
  'category-form-sheet.tsx',
  'create-shipping-label-sheet.tsx',
  'customer-details-sheet.tsx',
  'customer-form-sheet.tsx',
  'product-details-analytics-sheet.tsx',
  'product-form-image-upload.tsx',
  'product-form-variants.tsx',
  'product-info-sheet.tsx',
  'user-details-sheet.tsx',
];
for (const name of looseSuspects) {
  const f = path.join(root, 'components', name);
  if (!fs.existsSync(f)) {
    console.log(`MISSING components/${name}`);
    continue;
  }
  console.log(
    `${reachable.has(f) ? 'KEEP' : 'DELETE-CANDIDATE'} components/${name} importers=${[
      ...(reverse.get(f) || []),
    ]
      .map(rel)
      .slice(0, 8)
      .join('|')}`,
  );
}

// Landing kit KEEP
console.log('\n=== Landing kit (KEEP) ===');
for (const name of [
  'hero.tsx',
  'features.tsx',
  'faq.tsx',
  'footer.tsx',
  'contact.tsx',
  'pricing.tsx',
  'testimonials.tsx',
  'how-it-works.tsx',
  'trainers.tsx',
  'trusted-brands.tsx',
  'call-to-action.tsx',
  'logo.tsx',
  'central-preinscription-sheet.tsx',
  'cgv-sheet.tsx',
]) {
  const f = path.join(root, 'components', name);
  if (!fs.existsSync(f)) {
    console.log(`MISSING ${name}`);
    continue;
  }
  console.log(`${reachable.has(f) ? 'REACH' : 'ORPHAN?'} components/${name}`);
}
