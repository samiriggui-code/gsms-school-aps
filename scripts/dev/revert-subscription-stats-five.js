const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '../apps/lms-crm/app/(protected)');
const rels = [
  'securite-configuration/parametres/components/subscription-stats.tsx',
  'support-qualite/support/tickets/components/subscription-stats.tsx',
  'securite-configuration/gouvernance-donnees/components/subscription-stats.tsx',
  'support-qualite/support/components/subscription-stats.tsx',
  'gestion-ressources/rh/components/subscription-stats.tsx',
  'support-qualite/support/base-aide/components/subscription-stats.tsx',
  'gestion-ressources/equipements/components/subscription-stats.tsx',
  'securite-configuration/acces/components/subscription-stats.tsx',
  'gestion-academique/vie-scolaire/components/subscription-stats.tsx',
  'support-qualite/qualite/incidents/components/subscription-stats.tsx',
  'support-qualite/qualite/components/subscription-stats.tsx',
  'communication-contenu/seo/components/subscription-stats.tsx',
  'gestion-ressources/compagnie/components/subscription-stats.tsx',
  'administration-facturation/finance/components/subscription-stats.tsx',
  'communication-contenu/cms/components/subscription-stats.tsx',
  'communication-contenu/marketing/components/subscription-stats.tsx',
];

const wantB = `import { Users, GraduationCap, UserX, Wallet, BookOpen } from 'lucide-react';\r\nimport {\r\n  ModuleLandingStatGradientCard,\r\n  MODULE_LANDING_STATS_GRID_ROW,\r\n  type MetricStatTone,\r\n} from '@/components/common/stat-card-metric-layout';`;

const wantA = `import { Users, GraduationCap, UserX, Wallet } from 'lucide-react';\r\nimport {\r\n  ModuleLandingStatGradientCard,\r\n  type MetricStatTone,\r\n} from '@/components/common/stat-card-metric-layout';`;

const c2 = `    trendValue: '0',\r\n    color: 'info',\r\n  },\r\n  {\r\n    icon: BookOpen,\r\n    label: 'Parcours actifs',\r\n    value: '0',\r\n    trend: 'neutral',\r\n    trendValue: 'Vue pipeline',\r\n    color: 'primary',\r\n  },\r\n];`;

const c1 = `    trendValue: '0',\r\n    color: 'info',\r\n  },\r\n];`;

const d2 = '<div className={MODULE_LANDING_STATS_GRID_ROW}>';
const d1 = '<div className="grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 h-full items-stretch">';

for (const rel of rels) {
  const fp = path.join(root, rel);
  let s = fs.readFileSync(fp, 'utf8');
  if (!s.includes('BookOpen')) {
    console.log('skip (already 4)', rel);
    continue;
  }
  if (!s.includes(wantB)) {
    console.error('unexpected import block', rel);
    process.exitCode = 1;
    continue;
  }
  s = s.replace(wantB, wantA).replace(c2, c1).replace(d2, d1);
  fs.writeFileSync(fp, s);
  console.log('reverted', rel);
}
