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
  if (content.includes('const { t } = useTranslation()')) continue;
  if (content.includes('const { t, i18n } = useTranslation()')) continue;

  const patterns = [
    /export function (\w+)\([^)]*\)\s*\{/,
    /export default function (\w+)\([^)]*\)\s*\{/,
    /const (\w+) = \(\{[^}]*\}: [^)]+\) => \{/,
    /const (\w+) = \(\) => \{/,
  ];

  let matched = false;
  for (const pattern of patterns) {
    const m = content.match(pattern);
    if (m) {
      content = content.replace(pattern, `$&\n  const { t } = useTranslation();`);
      matched = true;
      break;
    }
  }

  if (matched) {
    fs.writeFileSync(file, content);
    fixed++;
    console.log('fixed', path.relative(root, file));
  }
}

console.log(`Fixed ${fixed} files.`);
