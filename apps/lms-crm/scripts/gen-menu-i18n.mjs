import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const content = fs.readFileSync(path.join(root, 'config/menu.config.tsx'), 'utf8');
const block = content.slice(
  content.indexOf('export const MENU_SIDEBAR'),
  content.indexOf('export const MENU_SIDEBAR_CUSTOM'),
);

const re = /title: '([^']*)'[\s\S]*?path: '([^']+)'/g;
const fr = {};
let m;
while ((m = re.exec(block))) {
  fr[m[2].replace(/^\//, '').replace(/\//g, '.')] = m[1];
}
fr['support-qualite.support.base-aide'] = "Base d'aide";
fr['securite-configuration.acces.logs'] = "Logs d'activite";

const enMap = {
  Accueil: 'Home',
  'Gestion administrative': 'Administrative management',
  Compagnie: 'Company',
  Profil: 'Profile',
  Structure: 'Structure',
  Documents: 'Documents',
  RH: 'HR',
  Collaborateurs: 'Staff',
  Formateurs: 'Trainers',
  Absences: 'Absences',
  Conformité: 'Compliance',
  Equipements: 'Equipment',
  'Inventaire & stock': 'Inventory & stock',
  Affectations: 'Assignments',
  Maintenance: 'Maintenance',
  'Gestion académique': 'Academic management',
  'Vie scolaire': 'Student life',
  Formations: 'Training programs',
  Sessions: 'Sessions',
  Candidature: 'Applications',
  Planning: 'Scheduling',
  Examens: 'Exams',
  Certifications: 'Certifications',
  'Administration & facturation': 'Administration & billing',
  Finance: 'Finance',
  Budget: 'Budget',
  Devis: 'Quotes',
  Factures: 'Invoices',
  Paiements: 'Payments',
  Rapports: 'Reports',
  'Communication & contenu': 'Communication & content',
  CMS: 'CMS',
  'Pages landing': 'Landing pages',
  Contenus: 'Content',
  Marketing: 'Marketing',
  'Formulaires leads': 'Lead forms',
  Campagnes: 'Campaigns',
  SEO: 'SEO',
  'Meta & indexation': 'Meta & indexing',
  Redirections: 'Redirects',
  'Support & qualite': 'Support & quality',
  Support: 'Support',
  Tickets: 'Tickets',
  "Base d'aide": 'Help center',
  Qualite: 'Quality',
  Incidents: 'Incidents',
  'Securite & configuration': 'Security & configuration',
  Acces: 'Access',
  'Utilisateurs CRM': 'CRM users',
  Roles: 'Roles',
  Permissions: 'Permissions',
  "Logs d'activite": 'Activity logs',
  Parametres: 'Settings',
  'Parametres systeme': 'System settings',
  'Sante du systeme': 'System health',
  'Gouvernance des donnees': 'Data governance',
  'Storage & conformite': 'Storage & compliance',
  'Demandes de documents': 'Document requests',
  'Corbeille & archivage': 'Trash & archiving',
  'Audit documentaire': 'Document audit',
  'Pilotage & supervision': 'Monitoring & supervision',
  Pilotage: 'Monitoring',
  Alertes: 'Alerts',
  Indicateurs: 'Indicators',
  'Rapports & exports': 'Reports & exports',
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
