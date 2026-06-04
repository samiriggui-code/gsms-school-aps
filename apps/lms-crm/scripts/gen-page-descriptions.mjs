import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    if (f.name === 'node_modules' || f.name === '.next') continue;
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p, out);
    else if (f.name === 'page.tsx' || f.name.endsWith('-page.tsx')) out.push(p);
  }
  return out;
}

function routeFromFile(file) {
  const rel = path.relative(path.join(root, 'app'), file).replace(/\\/g, '/');
  const parts = rel.split('/');
  const filtered = [];
  for (const part of parts) {
    if (part.startsWith('(') && part.endsWith(')')) continue;
    if (part === 'page.tsx' || part.endsWith('-page.tsx')) break;
    filtered.push(part);
  }
  return '/' + filtered.join('/');
}

const entries = {};
for (const file of walk(path.join(root, 'app'))) {
  const c = fs.readFileSync(file, 'utf8');
  if (!c.includes('ToolbarTitle')) continue;
  const tm = c.match(/<ToolbarTitle>([^<]+)<\/ToolbarTitle>/);
  if (!tm) continue;
  const dm = c.match(/<ToolbarDescription>\s*([\s\S]*?)\s*<\/ToolbarDescription>/);
  const url = routeFromFile(file);
  const key = url.replace(/^\//, '').replace(/\//g, '.');
  entries[key] = {
    title: tm[1].trim(),
    description: dm ? dm[1].replace(/\s+/g, ' ').trim() : '',
  };
}

const enMap = {}; // copy FR for now, translate common patterns
for (const [key, v] of Object.entries(entries)) {
  enMap[key] = {
    title: v.title, // will be overridden by menu EN where same
    description: v.description,
  };
}

const frDesc = {};
const enDesc = {};
for (const [key, v] of Object.entries(entries)) {
  frDesc[key] = v.description;
  enDesc[key] = v.description;
}

const out = `/** Page toolbar descriptions keyed by route (gestion-ressources.rh.collaborateurs). */
export const PAGE_DESCRIPTIONS_FR: Record<string, string> = ${JSON.stringify(frDesc, null, 2)};

export const PAGE_DESCRIPTIONS_EN: Record<string, string> = ${JSON.stringify(enDesc, null, 2)};
`;

fs.writeFileSync(path.join(root, 'i18n/page-descriptions.ts'), out);
console.log('Generated', Object.keys(entries).length, 'page descriptions');
