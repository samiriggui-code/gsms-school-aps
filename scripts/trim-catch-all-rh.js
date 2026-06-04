const fs = require('fs');
const p = 'apps/lms-crm/app/api/sections/gestion-ressources/[...path]/route.ts';
let s = fs.readFileSync(p, 'utf8');
const start = "  if (joined === '__removed_etudiants_stats__'";
const end = "  if (joined === 'rh/candidatures' && request.method === 'POST')";
const i = s.indexOf(start);
const j = s.indexOf(end);
if (i < 0 || j < 0) {
  console.error('markers not found', i, j);
  process.exit(1);
}
s =
  s.slice(0, i) +
  '  // (extrait vers rh/etudiants, rh/candidathub, rh/candidatures)\\n\\n' +
  s.slice(j);
fs.writeFileSync(p, s);
console.log('removed bytes', j - i);
