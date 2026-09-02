import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_SRC = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'packages', 'ui', 'src');

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f, acc);
    else if (/\.tsx?$/.test(e.name)) acc.push(f);
  }
  return acc;
}

function toRel(fromFile, targetPath) {
  let rel = path.relative(path.dirname(fromFile), targetPath).replace(/\\/g, '/');
  if (!rel.startsWith('.')) rel = `./${rel}`;
  return rel.replace(/\.tsx?$/, '');
}

function resolveUiImport(fromFile, importPath) {
  if (importPath === '@/lib/utils') {
    return toRel(fromFile, path.join(PKG_SRC, 'lib', 'utils.ts'));
  }
  if (importPath === '@/hooks/use-copy-to-clipboard') {
    return toRel(fromFile, path.join(PKG_SRC, 'hooks', 'use-copy-to-clipboard.ts'));
  }
  if (importPath === '@/components/ui/calendar' || importPath.startsWith('@/components/ui/')) {
    const sub =
      importPath === '@/components/ui/calendar'
        ? 'calendar'
        : importPath.slice('@/components/ui/'.length);
    let target = path.join(PKG_SRC, sub);
    if (fs.existsSync(`${target}.tsx`)) target = `${target}.tsx`;
    else if (fs.existsSync(`${target}.ts`)) target = `${target}.ts`;
    else if (fs.existsSync(path.join(target, 'index.ts'))) target = path.join(target, 'index.ts');
    else target = `${target}.tsx`;
    return toRel(fromFile, target);
  }
  return null;
}

// Fix broken bare imports from first migration pass
const bareFixes = [
  [/from\s+(['"])lib\/utils(?:\.ts)?\1/g, (file, _q) => `from '${toRel(file, path.join(PKG_SRC, 'lib', 'utils.ts'))}'`],
  [
    /from\s+(['"])hooks\/use-copy-to-clipboard(?:\.ts)?\1/g,
    (file, _q) => `from '${toRel(file, path.join(PKG_SRC, 'hooks', 'use-copy-to-clipboard.ts'))}'`,
  ],
];

for (const file of walk(PKG_SRC)) {
  let content = fs.readFileSync(file, 'utf8');
  let next = content.replace(
    /from\s+(['"])(@\/(?:lib\/utils|hooks\/use-copy-to-clipboard|components\/ui(?:\/[^'"]+)?))\1/g,
    (match, quote, importPath) => {
      const resolved = resolveUiImport(file, importPath);
      return resolved ? `from ${quote}${resolved}${quote}` : match;
    },
  );
  for (const [re, replacer] of bareFixes) {
    next = next.replace(re, (_m, quote) => replacer(file, quote));
  }
  if (next !== content) fs.writeFileSync(file, next, 'utf8');
}

console.log('Fixed package internal imports');
