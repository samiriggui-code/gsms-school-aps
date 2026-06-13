const fs = require('fs');
const h = JSON.parse(
  fs.readFileSync(
    'C:/Users/samir/.cursor/projects/c-laragon-www-gsms-school/agent-tools/38d5c6a5-7307-40fc-8eb0-407c53c95522.txt',
    'utf8',
  ),
).rawHtml;

for (const tag of ['h1', 'h2', 'h3', 'p', 'button']) {
  const classes = [...h.matchAll(new RegExp(`<${tag}[^>]*class="([^"]*)"`, 'g'))].map((m) => m[1]);
  const uniq = [...new Set(classes)].slice(0, 5);
  console.log(`\n=== ${tag.toUpperCase()} ===`);
  uniq.forEach((c) => console.log(c));
}

const counts = {};
for (const m of h.matchAll(/font-(medium|semibold|bold|normal|extrabold)/g)) {
  counts[m[0]] = (counts[m[0]] || 0) + 1;
}
console.log('\n=== FONT WEIGHT COUNTS ===', counts);

const tracking = {};
for (const m of h.matchAll(/tracking-[a-z]+/g)) {
  tracking[m[0]] = (tracking[m[0]] || 0) + 1;
}
console.log('\n=== TRACKING ===', tracking);

const leading = {};
for (const m of h.matchAll(/leading-[a-z0-9.]+/g)) {
  leading[m[0]] = (leading[m[0]] || 0) + 1;
}
console.log('\n=== LEADING ===', Object.entries(leading).sort((a,b)=>b[1]-a[1]).slice(0,10));
