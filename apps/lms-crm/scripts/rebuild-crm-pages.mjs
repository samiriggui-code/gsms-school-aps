/**
 * Réécrit les pages CRM (protected) en shells propres + supprime les orphelins.
 * Conserve landing/auth/portails hors (protected).
 *
 * Usage: node apps/lms-crm/scripts/rebuild-crm-pages.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const protectedRoot = path.resolve(__dirname, '../app/(protected)');

const SECTIONS = [
  '/pilotage-supervision',
  '/gestion-ressources',
  '/gestion-academique',
  '/administration-facturation',
  '/communication-contenu',
  '/support-qualite',
  '/securite-configuration',
];

const LEAVES = [
  '/pilotage-supervision/pilotage/alertes',
  '/pilotage-supervision/pilotage/indicateurs',
  '/pilotage-supervision/pilotage/rapports',
  '/pilotage-supervision/pilotage/risques',
  '/pilotage-supervision/ia/brouillons',
  '/pilotage-supervision/ia/historique',
  '/gestion-ressources/compagnie/profil',
  '/gestion-ressources/compagnie/structure',
  '/gestion-ressources/compagnie/documents',
  '/gestion-ressources/qualiopi',
  '/gestion-ressources/qualiopi/passeport',
  '/gestion-ressources/qualiopi/classeur',
  '/gestion-ressources/qualiopi/couverture',
  '/gestion-ressources/qualiopi/historique',
  '/gestion-ressources/conformite',
  '/gestion-ressources/rh/collaborateurs',
  '/gestion-ressources/rh/equipes',
  '/gestion-ressources/rh/formateurs',
  '/gestion-ressources/rh/sous-traitants',
  '/gestion-ressources/rh/referent-handicap',
  '/gestion-ressources/rh/absences',
  '/gestion-ressources/equipements/inventaire',
  '/gestion-ressources/equipements/affectations',
  '/gestion-ressources/equipements/maintenance',
  '/gestion-ressources/equipements/salles',
  '/gestion-academique/vie-scolaire/formations',
  '/gestion-academique/vie-scolaire/cours',
  '/gestion-academique/vie-scolaire/devoirs',
  '/gestion-academique/vie-scolaire/discussions',
  '/gestion-academique/vie-scolaire/inscriptions-lms',
  '/gestion-academique/vie-scolaire/sessions',
  '/gestion-academique/vie-scolaire/planning',
  '/gestion-academique/vie-scolaire/etudiants',
  '/gestion-academique/suivi-formations/tableau',
  '/gestion-academique/suivi-formations/satisfaction',
  '/gestion-academique/suivi-formations/circuits',
  '/administration-facturation/finance/budget',
  '/administration-facturation/finance/devis',
  '/administration-facturation/finance/factures',
  '/administration-facturation/finance/paiements',
  '/administration-facturation/finance/financeurs',
  '/administration-facturation/finance/bpf',
  '/administration-facturation/finance/edof-catalog',
  '/administration-facturation/finance/rapports',
  '/communication-contenu/cms/pages-landing',
  '/communication-contenu/cms/equipe-landing',
  '/communication-contenu/cms/contenus',
  '/communication-contenu/marketing/formulaires-leads',
  '/communication-contenu/marketing/campagnes',
  '/communication-contenu/seo/meta-indexation',
  '/communication-contenu/seo/redirections',
  '/support-qualite/support/tickets',
  '/support-qualite/support/incidents',
  '/securite-configuration/acces/users',
  '/securite-configuration/acces/roles',
  '/securite-configuration/acces/permissions',
  '/securite-configuration/acces/logs',
  '/securite-configuration/parametres/settings',
  '/securite-configuration/parametres/sante-systeme',
  '/securite-configuration/gouvernance-donnees/conformite',
  '/securite-configuration/gouvernance-donnees/storage',
  '/securite-configuration/gouvernance-donnees/demandes-documents',
  '/securite-configuration/gouvernance-donnees/corbeille-archivage',
  '/securite-configuration/gouvernance-donnees/audit-documentaire',
];

/** Anciens hubs modules → redirigent vers la section (évite 404 bookmarks). */
const REDIRECTS = [
  ['/pilotage-supervision/pilotage', '/pilotage-supervision'],
  ['/pilotage-supervision/ia', '/pilotage-supervision'],
  ['/gestion-ressources/compagnie', '/gestion-ressources'],
  ['/gestion-ressources/rh', '/gestion-ressources'],
  ['/gestion-ressources/equipements', '/gestion-ressources'],
  ['/gestion-academique/vie-scolaire', '/gestion-academique'],
  ['/gestion-academique/suivi-formations', '/gestion-academique'],
  ['/administration-facturation/finance', '/administration-facturation'],
  ['/communication-contenu/cms', '/communication-contenu'],
  ['/communication-contenu/marketing', '/communication-contenu'],
  ['/communication-contenu/seo', '/communication-contenu'],
  ['/support-qualite/support', '/support-qualite'],
  ['/securite-configuration/acces', '/securite-configuration'],
  ['/securite-configuration/parametres', '/securite-configuration'],
  ['/securite-configuration/gouvernance-donnees', '/securite-configuration'],
];

const ORPHAN_DIRS = [
  'securite-configuration/framework-lab',
  'gestion-ressources/rh/equipe-landing',
  'gestion-ressources/rh/conformite',
  'gestion-academique/vie-scolaire/suivi-formations',
  'gestion-academique/vie-scolaire/quote-leads',
  'gestion-academique/vie-scolaire/examens',
  'gestion-academique/vie-scolaire/certifications',
  'gestion-academique/vie-scolaire/contenu-e-formation',
  'securite-configuration/acces/settings',
  'securite-configuration/acces/security-log',
  'securite-configuration/gouvernance-donnees/storage-conformite',
  'securite-configuration/parametres/settings/dirigeant',
  'securite-configuration/parametres/settings/etablissement',
  'securite-configuration/parametres/settings/formation',
  'securite-configuration/parametres/settings/integrations',
  'securite-configuration/parametres/settings/legal',
  'securite-configuration/parametres/settings/notifications',
  'securite-configuration/parametres/settings/registre',
  'securite-configuration/parametres/settings/social',
  'administration-facturation/finance/devis/[devisId]',
  'gestion-academique/vie-scolaire/devoirs/[id]',
  'gestion-academique/vie-scolaire/etudiants/[id]',
  'securite-configuration/acces/users/[id]',
];

function routeToDir(route) {
  return path.join(protectedRoot, route.replace(/^\//, '').replaceAll('/', path.sep));
}

function writePage(dir, contents) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'page.tsx'), contents, 'utf8');
}

const sectionPage = (route) => `import { CrmSectionPage } from '@/components/crm/crm-section-page';

export default function Page() {
  return <CrmSectionPage path="${route}" />;
}
`;

const leafPage = (route) => `import { CrmLeafPage } from '@/components/crm/crm-leaf-page';

export default function Page() {
  return <CrmLeafPage path="${route}" />;
}
`;

const redirectPage = (to) => `import { redirect } from 'next/navigation';

export default function Page() {
  redirect('${to}');
}
`;

const accueilPage = `import { CrmAccueilPage } from '@/components/crm/crm-accueil-page';

export default function AccueilPage() {
  return <CrmAccueilPage />;
}
`;

let written = 0;
for (const route of SECTIONS) {
  writePage(routeToDir(route), sectionPage(route));
  written++;
}
for (const route of LEAVES) {
  writePage(routeToDir(route), leafPage(route));
  written++;
}
for (const [from, to] of REDIRECTS) {
  writePage(routeToDir(from), redirectPage(to));
  written++;
}
writePage(path.join(protectedRoot, 'accueil'), accueilPage);
written++;

let removed = 0;
for (const rel of ORPHAN_DIRS) {
  const full = path.join(protectedRoot, rel.replaceAll('/', path.sep));
  if (fs.existsSync(full)) {
    fs.rmSync(full, { recursive: true, force: true });
    removed++;
    console.log('removed', rel);
  }
}

console.log(`written ${written} page.tsx · removed ${removed} orphan trees`);
