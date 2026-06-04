import fs from 'node:fs';
import path from 'node:path';

const appRoot = path.join(import.meta.dirname, '../app');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory() && !e.name.startsWith('.') && e.name !== 'node_modules' && e.name !== '.next') {
      walk(p, out);
    } else if (e.isFile() && e.name.endsWith('.tsx')) {
      out.push(p);
    }
  }
  return out;
}

let count = 0;
for (const file of walk(appRoot)) {
  if (file.includes('datagrid-standards.tsx') || file.includes('demo1\\layout.tsx') || file.includes('demo1/layout.tsx')) {
    continue;
  }
  let s = fs.readFileSync(file, 'utf8');
  if (!s.includes('UserManagementSupportSection')) continue;
  const orig = s;
  s = s.replace(/\r?\nimport \{ UserManagementSupportSection \} from[^\r\n]+;?\r?\n/g, '\n');
  s = s.replace(/\r?\nimport \{([^}]*), UserManagementSupportSection \} from([^\r\n]+);?\r?\n/g, '\nimport {$1} from$2\n');
  s = s.replace(/\r?\nimport \{ UserManagementSupportSection, ([^}]+) \} from([^\r\n]+);?\r?\n/g, '\nimport { $1 } from$2\n');
  s = s.replace(/\s*<div className="mt-5 lg:mt-7\.5 pb-8">\s*<UserManagementSupportSection\s*\/>\s*<\/div>\s*/g, '\n');
  s = s.replace(/\s*<UserManagementSupportSection\s*\/>\s*/g, '\n');
  s = s.replace(/\s*<div className="mt-5 lg:mt-7\.5">\s*<\/div>\s*/g, '\n');
  if (s !== orig) {
    fs.writeFileSync(file, s);
    count += 1;
    console.log(path.relative(appRoot, file));
  }
}
console.log(`Fichiers nettoyés: ${count}`);
