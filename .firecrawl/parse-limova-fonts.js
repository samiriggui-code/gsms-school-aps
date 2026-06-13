const fs = require('fs');
const t = fs.readFileSync(
  'C:/Users/samir/.cursor/projects/c-laragon-www-gsms-school/agent-tools/38d5c6a5-7307-40fc-8eb0-407c53c95522.txt',
  'utf8',
);
const h = JSON.parse(t).rawHtml || '';

const patterns = [
  ['google fonts', /fonts\.(googleapis|gstatic)\.com[^"'\s>]*/g],
  ['font-face', /@font-face\s*\{[^}]+\}/g],
  ['fontFamily inline', /fontFamily["']?\s*:\s*["'][^"']+["']/g],
  ['font-family inline', /font-family:\s*[^;}"']+/g],
  ['font-sans class', /font-sans/g],
  ['antialiased', /antialiased/g],
  ['tracking-', /tracking-[a-z0-9]+/g],
  ['font-weight classes', /font-(thin|extralight|light|normal|medium|semibold|bold|extrabold|black)/g],
  ['letter-spacing css', /letter-spacing:\s*[^;]+/g],
];

const out = {};
for (const [name, re] of patterns) {
  out[name] = [...new Set([...h.matchAll(re)].map((m) => m[0]))].slice(0, 20);
}

// body/html classes
const body = h.match(/<body[^>]*>/)?.[0] || '';
const html = h.match(/<html[^>]*>/)?.[0] || '';
out.bodyTag = body;
out.htmlTag = html;

// h1 sample classes
const h1s = [...h.matchAll(/<h1[^>]*class="([^"]*)"[^>]*>/g)].map((m) => m[1]);
out.h1Classes = h1s.slice(0, 3);

// sample style blocks mentioning font
const styleBlocks = h.match(/<style[^>]*>[\s\S]*?<\/style>/g) || [];
out.fontInStyles = styleBlocks
  .filter((s) => /font/i.test(s))
  .map((s) => s.slice(0, 500))
  .slice(0, 3);

console.log(JSON.stringify(out, null, 2));
