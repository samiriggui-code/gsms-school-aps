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

let changed = 0;
for (const file of walk(path.join(root, 'app'))) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('<ToolbarTitle>') || c.includes('usePageToolbarMeta')) continue;
  if (c.includes('parametres/settings')) continue;

  const route = routeFromFile(file);

  if (!c.includes('usePageToolbarMeta')) {
    if (c.includes('export default function')) {
      c = c.replace(
        /export default function (\w+)\([^)]*\) \{/,
        (m) =>
          `${m}\n  const { title, description } = usePageToolbarMeta('${route}');`,
      );
    } else if (c.match(/export default function Page\(\) \{/)) {
      c = c.replace(
        'export default function Page() {',
        `export default function Page() {\n  const { title, description } = usePageToolbarMeta('${route}');`,
      );
    } else if (c.match(/export default function \w+Page\(\) \{/)) {
      c = c.replace(
        /export default function (\w+Page)\(\) \{/,
        `export default function $1() {\n  const { title, description } = usePageToolbarMeta('${route}');`,
      );
    }
  }

  if (!c.includes('usePageToolbarMeta')) {
    c = c.replace(
      /(\) => \{\n)(\s*const \[)/,
      `$1  const { title, description } = usePageToolbarMeta('${route}');\n$2`,
    );
  }

  if (!c.includes("from '@/components/common/translated-toolbar'")) {
    c = c.replace(
      /from '@\/components\/common\/toolbar';/,
      `from '@/components/common/toolbar';\nimport { usePageToolbarMeta } from '@/components/common/translated-toolbar';`,
    );
  }

  c = c.replace(/<ToolbarTitle>[^<]+<\/ToolbarTitle>/g, '<ToolbarTitle>{title}</ToolbarTitle>');
  c = c.replace(
    /<ToolbarDescription>\s*[\s\S]*?\s*<\/ToolbarDescription>/g,
    '<ToolbarDescription>{description}</ToolbarDescription>',
  );

  fs.writeFileSync(file, c);
  changed++;
  console.log('Updated', file.replace(root, ''));
}

console.log('Done:', changed, 'files');
