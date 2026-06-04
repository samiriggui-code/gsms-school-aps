import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/(protected)');
const borderClass =
  'h-full border border-dashed border-border bg-card shadow-xs rounded-xl';

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('compliance-alerts.tsx')) acc.push(p);
  }
  return acc;
}

for (const file of walk(root)) {
  let c = fs.readFileSync(file, 'utf8');
  if (!c.includes('border-none shadow-none bg-muted/5') && !c.includes('MODULE_LANDING_ALERTS_CARD_CLASS')) {
    if (c.includes('<Card className="h-full">') && file.includes('compliance-alerts')) {
      c = c.replace('<Card className="h-full">', `<Card className="${borderClass}">`);
    }
  }
  c = c.replace(
    'h-full border-none shadow-none bg-muted/5',
    borderClass,
  );
  if (!c.includes('MODULE_LANDING_ALERTS_CARD_CLASS')) {
    c = c.replace(
      `className="${borderClass}"`,
      'className={MODULE_LANDING_ALERTS_CARD_CLASS}',
    );
    const marker = "'use client';\n";
    const idx = c.indexOf(marker);
    if (idx >= 0) {
      c =
        c.slice(0, idx + marker.length) +
        "import { MODULE_LANDING_ALERTS_CARD_CLASS } from '@/components/common/module-landing-panel-styles';\n" +
        c.slice(idx + marker.length);
    }
  }
  if (c.includes('CardHeader className="pb-3 flex flex-row') && !c.includes('border-b border-dashed')) {
    c = c.replace(
      'CardHeader className="pb-3 flex flex-row',
      'CardHeader className="pb-3 flex flex-row border-b border-dashed',
    );
  }
  fs.writeFileSync(file, c);
  console.log(path.relative(root, file));
}
