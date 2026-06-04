import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, files);
    } else if (entry.name.endsWith('.tsx')) {
      files.push(full);
    }
  }
  return files;
}

let fixed = 0;
for (const file of [...walk(path.join(root, 'app')), ...walk(path.join(root, 'components'))]) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("useTranslation")) continue;
  if (!content.includes("t('") && !content.includes('t("')) continue;
  if (content.includes('useTranslation()')) {
    if (
      /const\s*\{\s*t[^}]*\}\s*=\s*useTranslation\(\)/.test(content)
    ) {
      continue;
    }
  }

  const arrowIdx = content.search(/\)\s*=>\s*\{/);
  if (arrowIdx === -1) continue;

  const insertAt = content.indexOf('{', arrowIdx) + 1;
  content = `${content.slice(0, insertAt)}\n  const { t } = useTranslation();${content.slice(insertAt)}`;
  fs.writeFileSync(file, content);
  fixed++;
  console.log('fixed', path.relative(root, file));
}

console.log(`Fixed ${fixed} files.`);
