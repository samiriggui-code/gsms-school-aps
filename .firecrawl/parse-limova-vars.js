const fs = require('fs');
const t = fs.readFileSync(
  'C:/Users/samir/.cursor/projects/c-laragon-www-gsms-school/agent-tools/38d5c6a5-7307-40fc-8eb0-407c53c95522.txt',
  'utf8',
);
const h = JSON.parse(t).rawHtml || '';
const root = h.match(/:root\{[^}]+\}/)?.[0] || h.match(/:root,\s*\.dark\{[^}]+\}/)?.[0] || '';
const vars = [...root.matchAll(/--([a-z-]+):\s*([^;]+)/g)].map((m) => `${m[1]}: ${m[2]}`);
console.log('ROOT snippet length', root.length);
console.log(vars.slice(0, 30).join('\n'));
