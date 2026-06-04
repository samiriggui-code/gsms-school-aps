import fs from 'fs';
import path from 'path';

const D = String.fromCharCode(100, 105, 118);
const root = path.resolve('app/(protected)');
const files = [
  'gestion-ressources/page.tsx',
  'gestion-academique/page.tsx',
  'communication-contenu/page.tsx',
  'support-qualite/page.tsx',
  'securite-configuration/page.tsx',
  'administration-facturation/page.tsx',
];

const swapRe = new RegExp(
  '(\\n\\s*)<' +
    D +
    ' className="min-w-0 lg:col-span-2">\\s*\\n([\\s\\S]*?)\\n\\s*</' +
    D +
    '>\\s*\\n\\s*<' +
    D +
    ' className="min-w-0 lg:col-span-1">\\s*\\n([\\s\\S]*?)\\n\\s*</' +
    D +
    '>\\s*\\n',
);

for (const rel of files) {
  const filePath = path.join(root, rel);
  const content = fs.readFileSync(filePath, 'utf8');
  const next = content.replace(swapRe, (_, indent, welcomeInner, highlightsInner) => {
    return (
      `${indent}<${D} className="min-w-0 lg:col-span-1">\n` +
      `${highlightsInner}\n` +
      `${indent}</${D}>\n` +
      `${indent}<${D} className="min-w-0 lg:col-span-2">\n` +
      `${welcomeInner}\n` +
      `${indent}</${D}>\n`
    );
  });
  if (next === content) {
    console.error('No match:', rel);
    continue;
  }
  fs.writeFileSync(filePath, next);
  console.log('Updated:', rel);
}
