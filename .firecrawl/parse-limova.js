const fs = require('fs');
const t = fs.readFileSync(
  'C:/Users/samir/.cursor/projects/c-laragon-www-gsms-school/agent-tools/38d5c6a5-7307-40fc-8eb0-407c53c95522.txt',
  'utf8',
);
const j = JSON.parse(t);
const h = j.rawHtml || '';
const google = [...new Set([...h.matchAll(/fonts\.googleapis\.com[^"']+/g)].map((m) => m[0]))];
const ff = [...new Set([...h.matchAll(/font-family:([^;"']+)/g)].map((m) => m[1].trim()))].slice(0, 25);
const hsl = [...new Set([...h.matchAll(/hsl\([^)]+\)/g)].map((m) => m[0]))].slice(0, 30);
const hex = [...new Set([...h.matchAll(/#[0-9a-fA-F]{3,8}/g)].map((m) => m[0]))].slice(0, 40);
console.log(JSON.stringify({ google, ff, hsl: hsl.slice(0, 15), hex: hex.slice(0, 25) }, null, 2));
