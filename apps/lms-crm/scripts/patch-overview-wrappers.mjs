import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const configs = [
  {
    file: 'securite-configuration/acces/components/acces-overview-table.tsx',
    export: 'AccesOverviewTable',
    title: 'Éléments récents',
    href: '/securite-configuration/acces/users',
  },
  {
    file: 'securite-configuration/parametres/components/parametres-overview-table.tsx',
    export: 'ParametresOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'securite-configuration/gouvernance-donnees/components/gouvernance-overview-table.tsx',
    export: 'GouvernanceOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'communication-contenu/cms/components/cms-overview-table.tsx',
    export: 'CmsOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'communication-contenu/marketing/components/marketing-overview-table.tsx',
    export: 'MarketingOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'communication-contenu/seo/components/seo-overview-table.tsx',
    export: 'SeoOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'support-qualite/support/components/support-overview-table.tsx',
    export: 'SupportOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
  {
    file: 'support-qualite/qualite/components/qualite-overview-table.tsx',
    export: 'QualiteOverviewTable',
    title: 'Collaborateurs récents',
    href: '/gestion-ressources/rh/collaborateurs',
  },
];

const base = path.join(path.dirname(fileURLToPath(import.meta.url)), '../app/(protected)');

for (const { file, export: name, title, href } of configs) {
  const content = `'use client';

import { ModuleLandingStaffOverviewTable } from '@/components/common/module-landing-staff-overview-table';

export function ${name}() {
  return (
    <ModuleLandingStaffOverviewTable
      title="${title}"
      viewAllHref="${href}"
    />
  );
}
`;
  const full = path.join(base, file);
  fs.writeFileSync(full, content);
  console.log(file);
}
