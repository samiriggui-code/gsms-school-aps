import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

const REPLACEMENTS = [
  [/title="Collaborateur"/g, "title={t('datagrid.columns.staffMember')}"],
  [/title="Formateur"/g, "title={t('datagrid.columns.trainer')}"],
  [/title="Qualification"/g, "title={t('datagrid.columns.qualification')}"],
  [/title="Catégorie"/g, "title={t('datagrid.columns.category')}"],
  [/title="Catégorie \/ Modèle"/g, "title={t('datagrid.columns.categoryModel')}"],
  [/title="Statut dossier"/g, "title={t('datagrid.columns.fileStatus')}"],
  [/title="Statut"/g, "title={t('datagrid.columns.status')}"],
  [/title="Dernière connexion"/g, "title={t('datagrid.columns.lastLogin')}"],
  [/placeholder="Rechercher un collaborateur\.\.\."/g, "placeholder={t('datagrid.search.staffMember')}"],
  [/placeholder="Rechercher un formateur\.\.\."/g, "placeholder={t('datagrid.search.trainer')}"],
  [/placeholder="Rechercher un candidat…"/g, "placeholder={t('datagrid.search.candidate')}"],
  [/placeholder="Rechercher une absence\.\.\."/g, "placeholder={t('datagrid.search.absence')}"],
  [/placeholder="Rechercher\.\.\."/g, "placeholder={t('datagrid.search.equipment')}"],
  [/placeholder="Rechercher par nom ou e-mail…"/g, "placeholder={t('datagrid.search.byNameOrEmail')}"],
  [/placeholder="Rechercher entreprise, nom, e-mail, téléphone\.\.\."/g, "placeholder={t('datagrid.search.lead')}"],
  [/placeholder="Rechercher un role"/g, "placeholder={t('datagrid.search.role')}"],
  [/placeholder="Rechercher une permission"/g, "placeholder={t('datagrid.search.permission')}"],
  [/placeholder="Rechercher des logs\.\.\."/g, "placeholder={t('datagrid.search.log')}"],
  [/placeholder="Rechercher un devis\.\.\."/g, "placeholder={t('datagrid.search.quote')}"],
  [/placeholder="Rechercher une session, une formation…"/g, "placeholder={t('datagrid.search.session')}"],
  [/placeholder="Rechercher dans le catalogue\.\.\."/g, "placeholder={t('datagrid.search.catalog')}"],
  [/placeholder="Rechercher un partenaire\.\.\."/g, "placeholder={t('datagrid.search.partner')}"],
  [/placeholder="Rechercher une équipe\.\.\."/g, "placeholder={t('datagrid.search.team')}"],
  [/placeholder="Rechercher…"/g, "placeholder={t('datagrid.search.generic')}"],
  [/<AlertTitle>Données synchronisées avec succès<\/AlertTitle>/g, "<AlertTitle>{t('datagrid.syncSuccess')}</AlertTitle>"],
  [/Changer le statut /g, "{t('datagrid.changeStatus')} "],
  [/<Copy className="size-4" \/> Dupliquer/g, '<Copy className="size-4" /> {t(\'datagrid.duplicate\')}'],
  [/<Trash className="size-4" \/> Supprimer/g, '<Trash className="size-4" /> {t(\'datagrid.delete\')}'],
  [/<span className="font-bold uppercase tracking-wider text-\[11px\]">Synchroniser<\/span>/g, '<span className="font-bold uppercase tracking-wider text-[11px]">{t(\'datagrid.sync\')}</span>'],
  [/\n                  Liste\n/g, "\n                  {t('datagrid.listView')}\n"],
  [/\n                  Cartes\n/g, "\n                  {t('datagrid.gridView')}\n"],
  [/viewAllLabel = 'Voir tout'/g, "viewAllLabel={t('datagrid.viewAll')}"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (['node_modules', '.next'].includes(entry.name)) continue;
      walk(full, files);
    } else if (/\.(tsx|ts)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function ensureHook(content) {
  if (!content.includes("'use client'") && !content.includes('"use client"')) return content;
  if (/const\s*\{\s*t[^}]*\}\s*=\s*useTranslation\(\)/.test(content)) return content;

  let next = content;
  if (!next.includes("from '@/hooks/useTranslation'")) {
    const clientMatch = next.match(/^(['"])use client\1;\s*\n/m);
    const importLine = "import { useTranslation } from '@/hooks/useTranslation';\n";
    if (clientMatch) {
      next = next.replace(clientMatch[0], clientMatch[0] + importLine);
    } else {
      next = importLine + next;
    }
  }

  const patterns = [
    /const (\w+) = \(\{[^}]*\}: [^)]+\) => \{/,
    /const (\w+) = \(\) => \{/,
    /export function (\w+)\([^)]*\)\s*\{/,
    /export default function (\w+)\([^)]*\)\s*\{/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(next)) {
      return next.replace(pattern, `$&\n  const { t } = useTranslation();`);
    }
  }
  return next;
}

function fixColumnMemoDeps(content) {
  if (!content.includes("t('datagrid.")) return content;
  return content.replace(
    /(\],\s*\n\s*)\[\],(\s*\n\s*\);)/g,
    (match, before, after, offset, full) => {
      const start = Math.max(0, offset - 2500);
      const chunk = full.slice(start, offset);
      if (!chunk.includes('useMemo') || !chunk.includes('ColumnDef')) return match;
      return `${before}[t],${after}`;
    },
  );
}

let changed = 0;
for (const dir of [path.join(root, 'app'), path.join(root, 'components')]) {
  for (const file of walk(dir)) {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    for (const [from, to] of REPLACEMENTS) {
      content = content.replace(from, to);
    }

    if (content !== original) {
      content = ensureHook(content);
      content = fixColumnMemoDeps(content);
      fs.writeFileSync(file, content);
      changed++;
      console.log('updated', path.relative(root, file));
    }
  }
}

console.log(`Done. ${changed} files updated.`);
