/**
 * One-shot: align RH-clone *-stats.tsx files to 5 KPI + MODULE_LANDING_STATS_GRID_ROW.
 * Run: node scripts/patch-module-five-stats.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../apps/lms-crm/app/(protected)');

const files = [
  'securite-configuration/acces/components/acces-stats.tsx',
  'securite-configuration/parametres/components/parametres-stats.tsx',
  'securite-configuration/gouvernance-donnees/components/gouvernance-stats.tsx',
  'communication-contenu/marketing/components/marketing-stats.tsx',
  'communication-contenu/cms/components/cms-stats.tsx',
  'communication-contenu/seo/components/seo-stats.tsx',
  'support-qualite/qualite/components/qualite-stats.tsx',
  'support-qualite/support/components/support-stats.tsx',
  'support-qualite/support/tickets/components/examens-stats.tsx',
  'support-qualite/support/base-aide/components/examens-stats.tsx',
  'support-qualite/qualite/incidents/components/examens-stats.tsx',
];

const importOld = `import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Users, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';`;

const importNew = `import {
  ModuleLandingStatGradientCard,
  MODULE_LANDING_STATS_GRID_ROW,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Users, ShieldCheck, Calendar, AlertTriangle, UserMinus } from 'lucide-react';`;

const midOld = `      color: 'destructive',
    },
  ];`;

const midNew = `      color: 'destructive',
    },
    {
      icon: UserMinus,
      label: 'Non actifs',
      value: String(Math.max(0, total - active)),
      trend: 'neutral',
      trendValue: \`\${total} comptes catalogue\`,
      color: 'info',
    },
  ];`;

const divOld = `<div className="grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 h-full items-stretch">`;
const divNew = `<div className={MODULE_LANDING_STATS_GRID_ROW}>`;

for (const rel of files) {
  const fp = path.join(root, rel);
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes(importOld)) {
    console.error('Missing import block:', rel);
    process.exitCode = 1;
    continue;
  }
  if (!s.includes(midOld)) {
    console.error('Missing stats tail:', rel);
    process.exitCode = 1;
    continue;
  }
  s = s.replace(importOld, importNew).replace(midOld, midNew).replace(divOld, divNew);
  fs.writeFileSync(fp, s);
  console.log('patched', rel);
}
