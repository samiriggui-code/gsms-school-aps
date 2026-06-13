const fs = require('fs');
const t = fs.readFileSync(
  'C:/Users/samir/.cursor/projects/c-laragon-www-gsms-school/agent-tools/38d5c6a5-7307-40fc-8eb0-407c53c95522.txt',
  'utf8',
);
const h = JSON.parse(t).rawHtml || '';
const classes = [...h.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(/\s+/));
const interesting = classes.filter((c) =>
  /^(text-|bg-|rounded|border|shadow|gradient|from-|to-|via-|backdrop|ring-)/.test(c),
);
const counts = {};
for (const c of interesting) counts[c] = (counts[c] || 0) + 1;
const top = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 60)
  .map(([k, v]) => `${v}x ${k}`);
console.log(top.join('\n'));
