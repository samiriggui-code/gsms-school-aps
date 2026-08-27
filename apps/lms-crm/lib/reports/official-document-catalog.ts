/**
 * Inventaire des documents officiels / imprimables de l'app CRM.
 * `shell` : utilise ReportDocumentShell (logo, pied de page, auteur).
 * `legacy` : rendu custom (à migrer progressivement).
 */
export type OfficialDocumentEntry = {
  id: string;
  label: string;
  section: string;
  module: string;
  formats: ('PDF' | 'HTML' | 'EXCEL' | 'CSV')[];
  shell: 'unified' | 'legacy' | 'partial';
  font: 'corporate' | 'legal' | 'mixed';
  notes?: string;
};

export const OFFICIAL_DOCUMENT_CATALOG: OfficialDocumentEntry[] = [
  // ——— Moteur rapports (report-engine) ———
  {
    id: 'pilotage.gr-indicateurs',
    label: 'Indicateurs gestion ressources',
    section: 'pilotage-supervision',
    module: 'pilotage',
    formats: ['PDF', 'EXCEL'],
    shell: 'unified',
    font: 'corporate',
  },
  {
    id: 'pilotage.gr-conformite',
    label: 'État conformité RH',
    section: 'pilotage-supervision',
    module: 'pilotage',
    formats: ['PDF', 'CSV', 'EXCEL'],
    shell: 'partial',
    font: 'corporate',
    notes: 'Template registre OK ; page render à brancher.',
  },
  {
    id: 'rh.emargement-session',
    label: "Feuille d'émargement",
    section: 'gestion-academique',
    module: 'vie-scolaire / sessions',
    formats: ['PDF', 'EXCEL'],
    shell: 'unified',
    font: 'corporate',
  },
  {
    id: 'academic.convocation-session',
    label: 'Convocation de session',
    section: 'gestion-academique',
    module: 'vie-scolaire / sessions',
    formats: ['PDF'],
    shell: 'partial',
    font: 'corporate',
    notes: 'PDFKit + en-tête/pied de page partagés (GSMS-OF-01) — une page par participant confirmé.',
  },
  {
    id: 'academic.convention-session',
    label: 'Convention de formation',
    section: 'gestion-academique',
    module: 'vie-scolaire / sessions',
    formats: ['PDF'],
    shell: 'partial',
    font: 'legal',
    notes: 'PDFKit + en-tête/pied de page partagés (GSMS-OF-01) — le prix reste dans devis/facture.',
  },
  {
    id: 'academic.certificate-session',
    label: 'Certificat de réalisation',
    section: 'gestion-academique',
    module: 'vie-scolaire / sessions',
    formats: ['PDF'],
    shell: 'partial',
    font: 'legal',
    notes: 'PDFKit + en-tête/pied de page partagés (GSMS-OF-01) — durée = valeur déclarée fiche formation, pas encore recalculée depuis les émargements réels.',
  },
  {
    id: 'academic.fiche-candidat',
    label: 'Fiche candidat',
    section: 'gestion-academique',
    module: 'vie-scolaire / étudiants',
    formats: ['PDF', 'EXCEL'],
    shell: 'unified',
    font: 'corporate',
  },
  {
    id: 'rh.fiche-collaborateur',
    label: 'Fiche collaborateur (rapport)',
    section: 'gestion-ressources',
    module: 'rh / collaborateurs',
    formats: ['PDF', 'EXCEL'],
    shell: 'unified',
    font: 'corporate',
  },
  {
    id: 'rh.contrat-travail',
    label: 'Contrat de travail (synthèse rapport)',
    section: 'gestion-ressources',
    module: 'rh / collaborateurs',
    formats: ['PDF'],
    shell: 'unified',
    font: 'legal',
    notes: 'Synthèse CRM — le contrat juridique complet reste dans la fiche (legacy).',
  },
  {
    id: 'finance.devis',
    label: 'Devis commercial',
    section: 'administration-facturation',
    module: 'finance / devis',
    formats: ['PDF'],
    shell: 'legacy',
    font: 'corporate',
    notes: 'PDFKit + HTML minimal — à migrer vers shell unifié.',
  },
  {
    id: 'finance.facture',
    label: 'Facture',
    section: 'administration-facturation',
    module: 'finance / factures',
    formats: ['PDF', 'HTML'],
    shell: 'legacy',
    font: 'corporate',
    notes: 'Même moteur que devis (finance-devis-pdf).',
  },
  // ——— Exports datagrid ———
  {
    id: 'datagrid.export',
    label: 'Exports listes (maintenance, RH, finance, leads…)',
    section: 'transversal',
    module: 'datagrid',
    formats: ['PDF', 'CSV', 'EXCEL'],
    shell: 'unified',
    font: 'corporate',
    notes: '16 presets (inventaire, collaborateurs, devis, logs…).',
  },
  // ——— Fiches imprimables (sheets) ———
  {
    id: 'fiche.collaborateur',
    label: 'Fiche collaborateur (aperçu sheet)',
    section: 'gestion-ressources',
    module: 'rh / collaborateurs',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
    notes: 'fiche-print inline — à brancher sur shell.',
  },
  {
    id: 'fiche.formateur',
    label: 'Fiche formateur',
    section: 'gestion-ressources',
    module: 'rh / formateurs',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'fiche.etudiant',
    label: 'Fiche étudiant / candidat',
    section: 'gestion-academique',
    module: 'vie-scolaire / étudiants',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'fiche.formation',
    label: 'Fiche formation',
    section: 'gestion-academique',
    module: 'vie-scolaire / formations',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'fiche.planning',
    label: 'Fiche planning',
    section: 'gestion-academique',
    module: 'vie-scolaire / planning',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'fiche.inventaire',
    label: 'Fiche équipement inventaire',
    section: 'gestion-ressources',
    module: 'equipements / inventaire',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'fiche.lead',
    label: 'Fiche lead marketing',
    section: 'communication-contenu',
    module: 'marketing / leads',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  // ——— Contrats juridiques (dupliqués) ———
  {
    id: 'legal.contrat-travail',
    label: 'Contrat de travail CDI (modèle complet)',
    section: 'gestion-ressources',
    module: 'rh',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'legal',
    notes: 'Georgia — collaborateur, formateur, conformité, examen, étudiant (5 copies).',
  },
  {
    id: 'legal.cnaps',
    label: 'Documents CNAPS / carte pro',
    section: 'transversal',
    module: 'conformité',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'mixed',
    notes: 'Leads, candidats, certifications.',
  },
  // ——— Autres ———
  {
    id: 'instructor.emargement-pdf',
    label: 'Émargement formateur (PDFKit)',
    section: 'instructor',
    module: 'sessions',
    formats: ['PDF'],
    shell: 'partial',
    font: 'corporate',
    notes: 'En-tête brand PDFKit (loadAttendancePdfBrandContext).',
  },
  {
    id: 'legal.cgv',
    label: 'CGV FORM\'SSI',
    section: 'site',
    module: 'legal',
    formats: ['HTML'],
    shell: 'legacy',
    font: 'corporate',
  },
  {
    id: 'finance.plaquette',
    label: 'Plaquette devis (print)',
    section: 'administration-facturation',
    module: 'finance / devis',
    formats: ['HTML'],
    shell: 'unified',
    font: 'corporate',
  },
];

export function countOfficialDocuments() {
  const unified = OFFICIAL_DOCUMENT_CATALOG.filter((d) => d.shell === 'unified').length;
  const legacy = OFFICIAL_DOCUMENT_CATALOG.filter((d) => d.shell === 'legacy').length;
  const partial = OFFICIAL_DOCUMENT_CATALOG.filter((d) => d.shell === 'partial').length;
  return { total: OFFICIAL_DOCUMENT_CATALOG.length, unified, legacy, partial };
}
