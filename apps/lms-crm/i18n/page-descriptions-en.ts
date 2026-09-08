/** English page toolbar descriptions — keyed like PAGE_DESCRIPTIONS_FR. */
export const PAGE_DESCRIPTIONS_EN_MAP: Record<string, string> = {
  'administration-facturation.finance.devis':
    'Commercial proposals, version tracking and conversion to invoicing.',
  'administration-facturation.finance.factures':
    'Issued invoices, reminders and attachments aligned with your billing process.',
  'administration-facturation.finance':
    'Track quotes, invoices and payments to monitor financial performance in real time.',
  'administration-facturation.finance.budget':
    'Budget lines by fiscal year — planned vs actual.',
  'administration-facturation.finance.paiements':
    'Payments linked to quotes and collection follow-ups.',
  'administration-facturation.finance.rapports':
    'Monthly summary of quotes, leads and revenue.',
  'administration-facturation': 'Centralize billing, collections and follow-ups.',
  'communication-contenu.cms.contenus':
    'Track training records published on the landing (#pricing) — edit in the Formations module.',
  'communication-contenu.cms': 'Landing pages and content management.',
  'communication-contenu.cms.pages-landing':
    'Order, visibility and publication of the one-page public site.',
  'communication-contenu.cms.equipe-landing':
    'Team catalogue published on the landing #trainers section (direction, trainers, pedagogy, HR).',
  'communication-contenu.marketing.formulaires-leads':
    'Leads from landings (quotes, pre-registration): qualification, pipeline and detail views.',
  'communication-contenu.marketing': 'Lead forms and campaign management.',
  'communication-contenu.marketing.campagnes':
    'Acquisition campaign registry (UTM, channels, status) - not email sending; leads under Lead forms.',
  'communication-contenu': 'Centralize messaging, training content and campaigns.',
  'communication-contenu.seo.meta-indexation':
    'Landing title/description tags and sitemap / robots links.',
  'communication-contenu.seo': 'SEO management, indexing and redirects.',
  'communication-contenu.seo.redirections': '301/302 rules and landing site anchors.',
  'gestion-academique':
    'Student life and training follow-up — catalog, sessions, follow-up board, satisfaction and circuits.',
  'gestion-academique.vie-scolaire.certifications':
    'CRM certificate issuance after a passed exam (before closing the file).',
  'gestion-academique.vie-scolaire.etudiants':
    'Learner files, CRM pipeline and session assignment.',
  'gestion-academique.vie-scolaire.examens':
    'Result entry for candidates enrolled in a session (CRM catalog path).',
  'gestion-academique.vie-scolaire.formations':
    'Catalog, programs and link to scheduled sessions.',
  'gestion-academique.vie-scolaire':
    'Training and session tracking. Alerts below may also reflect team compliance (HR).',
  'gestion-academique.vie-scolaire.planning':
    'CRM catalog sessions and enrolled headcount (linked to candidate journey).',
  'gestion-academique.vie-scolaire.sessions':
    'Session planning, enrollments and training follow-up.',
  'gestion-academique.vie-scolaire.suivi-formations':
    'Redirects to Training follow-up → Follow-up board.',
  'gestion-academique.suivi-formations':
    'Follow-up board, satisfaction surveys and session n8n circuits.',
  'gestion-academique.suivi-formations.tableau':
    'Daily session tracking: enrolled trainees, e-learning progress, quizzes and attendance / compliance preparation.',
  'gestion-academique.suivi-formations.satisfaction':
    'HOT (D0) and COLD (D+45) surveys — cross-session trainee feedback.',
  'gestion-academique.suivi-formations.circuits':
    'Session circuit runs (D-N → D+N milestones) recorded via n8n.',
  'gestion-ressources.compagnie':
    'Manage company profile, structure and administrative documents.',
  'gestion-ressources.qualiopi':
    'Qualiopi module — school dossier completeness and open indicators.',
  'gestion-ressources.qualiopi.passeport':
    'Deterministic session stress test — PASS/FAIL/WARNING, findings and business links.',
  'gestion-ressources.qualiopi.classeur':
    'Indicator detail — audit status, comment and evidence per indicator.',
  'gestion-ressources.qualiopi.historique':
    'Qualiopi gap timeline (ComplianceItem events) — OK→KO transitions and evidence.',
  'gestion-ressources.compagnie.profil':
    'Legal identity, contact details and administrative contacts.',
  'administration-facturation.finance.financeurs':
    'OPCO / CPF / company funder registry — single source for sessions, quotes and BPF.',
  'administration-facturation.finance.bpf':
    'Annual Pedagogical & Financial Balance Sheet (Cerfa) — aggregates and guards.',
  'pilotage-supervision.ia':
    'AI draft governance (AiArtifact) and run history (AiRun).',
  'pilotage-supervision.ia.brouillons':
    'Queue of PROPOSED artifacts to approve before business writes.',
  'pilotage-supervision.ia.historique':
    'AiRun journal — success, failures, provider and model.',
  'pilotage-supervision.pilotage.alertes':
    'Central CRM alert register — in-app notifications synced with the header bell.',
  'pilotage-supervision.pilotage.indicateurs':
    'Consolidated KPIs and charts per module — trends, breakdowns and shortcuts.',
  'pilotage-supervision.pilotage.rapports':
    'CSV exports, report templates and activity history for the selected period.',
  'pilotage-supervision.pilotage.risques':
    'Risk register: severity, exposure and recommendations to keep operations healthy.',
  'gestion-ressources.equipements.affectations':
    'Equipment reservations and mobilization per session (trainer or staff).',
  'gestion-ressources.equipements.inventaire':
    'Equipment catalog by category — stock, assignments and maintenance per line.',
  'gestion-ressources.equipements.maintenance':
    'Workshop units and technical interventions tracking.',
  'gestion-ressources.equipements': 'Manage your fleet and inventory in real time.',
  'gestion-ressources':
    'Configure company, Qualiopi, HR teams and equipment before academic operations.',
  'gestion-ressources.rh.absences': 'Absence requests, approvals and staff export.',
  'gestion-ressources.rh.collaborateurs':
    'List, export and HR files for group staff.',
  'gestion-ressources.rh.equipes': 'Manage teams and staff assignments.',
  'gestion-ressources.rh.formateurs': 'External trainers, assignments and availability.',
  'gestion-ressources.rh':
    'Manage staff, absence tracking and HR administration in real time.',
  'mon-profil': 'Staff profile: HR identity, compliance, contract and public landing presentation.',
  'account.notifications':
    'CRM alert history: tickets, finance, training and team — mark read and archive.',
  'pilotage-supervision':
    'Dashboards, KPIs, performance and operational monitoring in real time.',
  'pilotage-supervision.pilotage':
    'Dashboards, alerts, reports and operational monitoring in real time.',
  'securite-configuration.acces':
    'Manage users, roles and permissions with access traceability in real time.',
  'securite-configuration.acces.permissions':
    'Fine-grained screen and action rights; assignment to roles and users.',
  'securite-configuration.acces.roles':
    'Authorization profiles and reusable permission groups.',
  'securite-configuration.acces.logs':
    'Audit log: sign-ins, sensitive actions and compliance investigations.',
  'securite-configuration.acces.security-log':
    'Redirects to Activity logs — same audit journal.',
  'securite-configuration.acces.users':
    'Accounts, statuses and application access for staff and partners.',
  'securite-configuration.gouvernance-donnees':
    'Manage storage, document requests and content audit tracking.',
  'securite-configuration.gouvernance-donnees.conformite':
    'School-wide compliance — all profiles, merged email alerts for missing or expired documents.',
  'securite-configuration.gouvernance-donnees.storage':
    'GED explorer — FileAsset inventory, versions and archiving.',
  'securite-configuration.gouvernance-donnees.storage-conformite':
    'GED explorer — FileAsset inventory, versions and archiving.',
  'securite-configuration.gouvernance-donnees.demandes-documents':
    'Candidate files awaiting documents or review.',
  'securite-configuration.gouvernance-donnees.corbeille-archivage':
    'Deleted files — restore available.',
  'securite-configuration.gouvernance-donnees.audit-documentaire':
    'Document audit trail — compliance, file versions and GED archiving (90 days).',
  'securite-configuration':
    'Administer access, traceability and platform settings.',
  'securite-configuration.parametres':
    'Configure general settings, notifications and global platform options.',
  'securite-configuration.parametres.sante-systeme':
    'Real-time resource usage overview (Postgres, Redis, Node.js).',
  'support-qualite': 'Helpdesk — tickets and incidents.',
  'support-qualite.support': 'Helpdesk: incoming tickets and incident tracking (equipment, process).',
  'support-qualite.support.tickets': 'Create, assign and track support requests.',
  'support-qualite.support.incidents':
    'Out-of-service equipment and process errors — analysis and corrective actions.',
};
