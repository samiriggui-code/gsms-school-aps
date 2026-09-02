/**
 * One-shot migration: apps/lms-crm/components/ui → packages/ui (@repo/ui)
 * Run from repo root: node scripts/migrate-repo-ui.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const APP = path.join(ROOT, 'apps', 'lms-crm');
const SRC_UI = path.join(APP, 'components', 'ui');
const PKG = path.join(ROOT, 'packages', 'ui');
const PKG_SRC = path.join(PKG, 'src');

function walkFiles(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, acc);
    else if (/\.(tsx?|ts)$/.test(entry.name)) acc.push(full);
  }
  return acc;
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function resolveUiImport(fromFile, importPath) {
  if (importPath === '@/lib/utils') {
    return path.relative(path.dirname(fromFile), path.join(PKG_SRC, 'lib', 'utils.ts')).replace(/\\/g, '/');
  }
  if (importPath === '@/hooks/use-copy-to-clipboard') {
    return path
      .relative(path.dirname(fromFile), path.join(PKG_SRC, 'hooks', 'use-copy-to-clipboard.ts'))
      .replace(/\\/g, '/');
  }
  if (importPath.startsWith('@/components/ui/')) {
    const sub = importPath.slice('@/components/ui/'.length);
    let target = path.join(PKG_SRC, sub);
    if (fs.existsSync(`${target}.tsx`)) target = `${target}.tsx`;
    else if (fs.existsSync(`${target}.ts`)) target = `${target}.ts`;
    else if (fs.existsSync(path.join(target, 'index.ts'))) target = path.join(target, 'index.ts');
    else if (!path.extname(target)) target = `${target}.tsx`;
    let rel = path.relative(path.dirname(fromFile), target).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel.replace(/\.tsx?$/, '');
  }
  if (importPath === '@/components/ui/calendar') {
    const target = path.join(PKG_SRC, 'calendar.tsx');
    let rel = path.relative(path.dirname(fromFile), target).replace(/\\/g, '/');
    if (!rel.startsWith('.')) rel = `./${rel}`;
    return rel.replace(/\.tsx?$/, '');
  }
  return null;
}

function rewritePackageImports(filePath, content) {
  return content.replace(
    /from\s+(['"])(@\/(?:lib\/utils|hooks\/use-copy-to-clipboard|components\/ui(?:\/[^'"]+)?))\1/g,
    (match, quote, importPath) => {
      const resolved = resolveUiImport(filePath, importPath);
      if (!resolved) return match;
      return `from ${quote}${resolved}${quote}`;
    },
  );
}

function buildExportsMap() {
  const exports = {
    './lib/utils': './src/lib/utils.ts',
    './hooks/use-copy-to-clipboard': './src/hooks/use-copy-to-clipboard.ts',
  };
  for (const file of walkFiles(PKG_SRC)) {
    const rel = path.relative(PKG_SRC, file).replace(/\\/g, '/');
    const noExt = rel.replace(/\.tsx?$/, '');
    const key = `./${noExt}`;
    if (key === './lib/utils' || key === './hooks/use-copy-to-clipboard') continue;
    // calendar.tsx wins over calendar/ folder for bare ./calendar
    if (noExt === 'calendar' && fs.existsSync(path.join(PKG_SRC, 'calendar.tsx'))) {
      exports['./calendar'] = './src/calendar.tsx';
      continue;
    }
    exports[key] = `./src/${rel}`;
  }
  return exports;
}

function scanExternalDeps(files) {
  const deps = new Set();
  const depRe = /from\s+['"]([^./][^'"]*)['"]/g;
  const peer = new Set(['react', 'react-dom', 'react/jsx-runtime']);
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = depRe.exec(content)) !== null) {
      const pkg = m[1].startsWith('@') ? m[1].split('/').slice(0, 2).join('/') : m[1].split('/')[0];
      if (!peer.has(pkg) && !pkg.startsWith('@/')) deps.add(pkg);
    }
  }
  return [...deps].sort();
}

function codemodAppFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  const next = content.replace(
    /from\s+(['"])@\/components\/ui\/([^'"]+)\1/g,
    (_m, quote, sub) => `from ${quote}@repo/ui/${sub}${quote}`,
  );
  if (next !== content) {
    fs.writeFileSync(filePath, next, 'utf8');
    return true;
  }
  return false;
}

// --- main ---
console.log('1. Copy components/ui → packages/ui/src');
if (fs.existsSync(PKG_SRC)) fs.rmSync(PKG_SRC, { recursive: true, force: true });
fs.mkdirSync(PKG_SRC, { recursive: true });
copyDir(SRC_UI, PKG_SRC);

console.log('2. Add lib/utils + hook');
fs.mkdirSync(path.join(PKG_SRC, 'lib'), { recursive: true });
fs.mkdirSync(path.join(PKG_SRC, 'hooks'), { recursive: true });
fs.copyFileSync(path.join(APP, 'lib', 'utils.ts'), path.join(PKG_SRC, 'lib', 'utils.ts'));
fs.copyFileSync(
  path.join(APP, 'hooks', 'use-copy-to-clipboard.ts'),
  path.join(PKG_SRC, 'hooks', 'use-copy-to-clipboard.ts'),
);

console.log('3. Rewrite internal package imports');
const pkgFiles = walkFiles(PKG_SRC);
for (const file of pkgFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const next = rewritePackageImports(file, content);
  if (next !== content) fs.writeFileSync(file, next, 'utf8');
}

console.log('4. Write package.json + tsconfig');
const externalDeps = scanExternalDeps(pkgFiles);
const lmsPkg = JSON.parse(fs.readFileSync(path.join(APP, 'package.json'), 'utf8'));
const uiDependencies = {};
for (const name of externalDeps) {
  if (lmsPkg.dependencies?.[name]) uiDependencies[name] = lmsPkg.dependencies[name];
  else if (lmsPkg.devDependencies?.[name]) uiDependencies[name] = lmsPkg.devDependencies[name];
  else console.warn(`  warn: no version for ${name} in @lms-crm`);
}

const exportsMap = buildExportsMap();
const packageJson = {
  name: '@repo/ui',
  version: '0.1.0',
  private: true,
  sideEffects: false,
  exports: exportsMap,
  peerDependencies: {
    react: '^19.0.0',
    'react-dom': '^19.0.0',
  },
  dependencies: uiDependencies,
};
fs.mkdirSync(PKG, { recursive: true });
fs.writeFileSync(path.join(PKG, 'package.json'), `${JSON.stringify(packageJson, null, 2)}\n`);

fs.writeFileSync(
  path.join(PKG, 'tsconfig.json'),
  `${JSON.stringify(
    {
      compilerOptions: {
        target: 'ES2017',
        lib: ['dom', 'dom.iterable', 'esnext'],
        module: 'esnext',
        moduleResolution: 'bundler',
        jsx: 'react-jsx',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        isolatedModules: true,
        esModuleInterop: true,
      },
      include: ['src/**/*'],
    },
    null,
    2,
  )}\n`,
);

console.log('5. Codemod app imports @/components/ui → @repo/ui');
let codemodCount = 0;
const appFiles = walkFiles(APP).filter(
  (f) => !f.includes(`${path.sep}components${path.sep}ui${path.sep}`) && !f.endsWith(`${path.sep}components${path.sep}ui`),
);
for (const file of appFiles) {
  if (codemodAppFile(file)) codemodCount += 1;
}
console.log(`   updated ${codemodCount} files`);

console.log('6. Update lib/utils.ts re-export');
fs.writeFileSync(
  path.join(APP, 'lib', 'utils.ts'),
  `export { cn } from '@repo/ui/lib/utils';\n`,
);

console.log('7. Add @repo/ui to lms-crm dependencies');
if (!lmsPkg.dependencies['@repo/ui']) {
  lmsPkg.dependencies['@repo/ui'] = 'workspace:*';
  fs.writeFileSync(path.join(APP, 'package.json'), `${JSON.stringify(lmsPkg, null, 2)}\n`);
}

console.log('8. Remove old components/ui');
fs.rmSync(SRC_UI, { recursive: true, force: true });

console.log('Done. External deps:', externalDeps.join(', '));
