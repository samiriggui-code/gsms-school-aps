import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const content = fs.readFileSync(path.join(root, 'config/menu.config.tsx'), 'utf8');
const start = content.indexOf('export const MENU_SIDEBAR');
const nextExport = content.indexOf('export const', start + 1);
const block = content.slice(start, nextExport === -1 ? content.length : nextExport);

const re = /title: '([^']*)'[\s\S]*?path: '([^']+)'/g;
const fr = {};
let m;
while ((m = re.exec(block))) {
  fr[m[2].replace(/^\//, '').replace(/\//g, '.')] = m[1];
}
fr['support-qualite.support.base-aide'] = 'Base aide';
fr['securite-configuration.gouvernance-donnees.storage'] = 'Coffre documentaire';
fr['securite-configuration.gouvernance-donnees.storage-conformite'] = 'Coffre documentaire';

const enMap = {
  Accueil: 'Home',
  'Gestion ressources': 'Resource management',
  Compagnie: 'Company',
  Profil: 'Profile',
  Structure: 'Structure',
  Documents: 'Documents',
  RH: 'HR',
  Collaborateurs: 'Staff',
  Équipes: 'Teams',
  Formateurs: 'Trainers',
  Absences: 'Absences',
  Conformité: 'Compliance',
  Équipements: 'Equipment',
  Inventaire: 'Inventory',
  Affectations: 'Assignments',
  Maintenance: 'Maintenance',
  Salles: 'Rooms',
  'Gestion académique': 'Academic management',
  'Vie scolaire': 'Student life',
  Formations: 'Training programs',
  Sessions: 'Sessions',
  Étudiants: 'Students',
  Planning: 'Scheduling',
  Examens: 'Exams',
  Certifications: 'Certifications',
  'Contenu e-formation': 'E-learning content',
  'Suivi formations': 'Training follow-up',
  'Coffre documentaire': 'Storage',
  'Admin facturation': 'Admin billing',
  Finance: 'Finance',
  Budget: 'Budget',
  Devis: 'Quotes',
  Factures: 'Invoices',
  Paiements: 'Payments',
  Rapports: 'Reports',
  'Communication contenu': 'Communication content',
  CMS: 'CMS',
  'Pages landing': 'Landing pages',
  'Équipe landing': 'Landing team',
  'Catalogue vitrine': 'Showcase catalog',
  Contenus: 'Content',
  Marketing: 'Marketing',
  'Formulaires leads': 'Lead forms',
  Campagnes: 'Campaigns',
  SEO: 'SEO',
  'Meta indexation': 'Meta indexing',
  Redirections: 'Redirects',
  'Support qualité': 'Support quality',
  Support: 'Support',
  Tickets: 'Tickets',
  'Base aide': 'Help base',
  Qualité: 'Quality',
  Incidents: 'Incidents',
  'Sécurité configuration': 'Security configuration',
  Accès: 'Access',
  Utilisateurs: 'Users',
  Rôles: 'Roles',
  Permissions: 'Permissions',
  Logs: 'Logs',
  Paramètres: 'Settings',
  'Paramètres système': 'System settings',
  'Santé système': 'System health',
  'Gouvernance données': 'Data governance',
  'Storage conformité': 'Storage compliance',
  'Demandes documents': 'Document requests',
  'Corbeille archivage': 'Trash archiving',
  'Audit documentaire': 'Document audit',
  'Pilotage supervision': 'Monitoring supervision',
  Pilotage: 'Monitoring',
  Alertes: 'Alerts',
  Indicateurs: 'Indicators',
  Risques: 'Risks',
};

const en = {};
for (const [k, v] of Object.entries(fr)) {
  en[k] = enMap[v] ?? v;
}

const out = `/** Menu labels keyed by path without leading slash (e.g. accueil, gestion-ressources.rh). */
export const MENU_BY_PATH_FR: Record<string, string> = ${JSON.stringify(fr, null, 2)};

export const MENU_BY_PATH_EN: Record<string, string> = ${JSON.stringify(en, null, 2)};
`;

fs.writeFileSync(path.join(root, 'i18n/menu-by-path.ts'), out);
console.log('Generated', Object.keys(fr).length, 'menu keys');
