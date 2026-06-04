import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const REPLACEMENTS = [
  {
    from: /Chargement des indicateurs\.{3}|Chargement des indicateurs…/g,
    to: "{t('sectionLanding.loadingIndicators')}",
  },
  {
    from: /toast\.error\('Erreur de chargement des indicateurs'\)/g,
    to: "toast.error(t('sectionLanding.loadError'))",
  },
  {
    from: /throw new Error\('Erreur de chargement des indicateurs'\)/g,
    to: "throw new Error(t('sectionLanding.loadError'))",
  },
  {
    from: />\s*Exporter\s*</g,
    to: ">{t('common.actions.export')}<",
  },
  {
    from: /<Download className="size-4" \/> Exporter/g,
    to: '<Download className="size-4" /> {t(\'common.actions.export\')}',
  },
  {
    from: />Exporter la selection</g,
    to: ">{t('common.actions.exportSelection')}<",
  },
  {
    from: />Exporter la sélection</g,
    to: ">{t('common.actions.exportSelection')}<",
  },
  {
    from: />Ajouter un collaborateur</g,
    to: ">{t('common.actions.addCollaborator')}<",
  },
  {
    from: />Ajouter un formateur</g,
    to: ">{t('common.actions.addTrainer')}<",
  },
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next') continue;
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function ensureUseTranslation(content, filePath) {
  if (content.includes("useTranslation")) return content;
  if (!content.includes("'use client'") && !content.includes('"use client"')) return content;

  let next = content;
  if (next.includes("from '@/hooks/useTranslation'")) {
    // import exists but hook unused — still add const { t }
  } else {
    const importLine = "import { useTranslation } from '@/hooks/useTranslation';\n";
    const clientMatch = next.match(/^(['"])use client\1;\s*\n/m);
    if (clientMatch) {
      next = next.replace(clientMatch[0], clientMatch[0] + importLine);
    } else {
      next = importLine + next;
    }
  }

  const fnMatch = next.match(
    /export default function (\w+)\([^)]*\)\s*\{|export function (\w+)\([^)]*\)\s*\{|const (\w+) = \(\) => \{/,
  );
  if (!fnMatch) {
    console.warn('skip hook inject:', filePath);
    return next;
  }

  const hookLine = "  const { t } = useTranslation();\n";
  if (next.includes('const { t } = useTranslation()')) return next;

  if (fnMatch[1]) {
    next = next.replace(
      new RegExp(`export default function ${fnMatch[1]}\\([^)]*\\)\\s*\\{`),
      `$&\n${hookLine}`,
    );
  } else if (fnMatch[2]) {
    next = next.replace(
      new RegExp(`export function ${fnMatch[2]}\\([^)]*\\)\\s*\\{`),
      `$&\n${hookLine}`,
    );
  } else if (fnMatch[3]) {
    next = next.replace(
      new RegExp(`const ${fnMatch[3]} = \\(\\) => \\{`),
      `$&\n${hookLine}`,
    );
  }

  return next;
}

let changed = 0;
for (const file of walk(path.join(root, 'app'))) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }

  if (content !== original) {
    content = ensureUseTranslation(content, file);
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated', path.relative(root, file));
  }
}

// components folder lists
for (const file of walk(path.join(root, 'components'))) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  for (const { from, to } of REPLACEMENTS) {
    content = content.replace(from, to);
  }
  if (content !== original) {
    content = ensureUseTranslation(content, file);
    fs.writeFileSync(file, content);
    changed++;
    console.log('updated', path.relative(root, file));
  }
}

console.log(`Done. ${changed} files updated.`);
