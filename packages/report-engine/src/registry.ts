import type { ReportTemplateDefinition } from './types';

/**
 * Registre global des modèles de rapport — une clé = un document réutilisable dans toute l'app.
 */
export const REPORT_TEMPLATE_REGISTRY: ReportTemplateDefinition[] = [
  {
    key: 'pilotage.gr-indicateurs',
    label: 'Indicateurs gestion ressources',
    description: 'KPI, courbe d\'évolution et donut parc équipements',
    category: 'pilotage',
    moduleKey: 'gestion-ressources',
    renderPath: 'pilotage-gr-indicateurs',
    supportedFormats: ['PDF', 'EXCEL'],
    engine: 'html-print',
  },
  {
    key: 'pilotage.gr-conformite',
    label: 'État conformité RH',
    description: 'Cartes pro, titres de séjour et certifications à échéance',
    category: 'pilotage',
    moduleKey: 'gestion-ressources.rh',
    renderPath: 'pilotage-gr-conformite',
    supportedFormats: ['PDF', 'CSV', 'EXCEL'],
    engine: 'html-print',
    exportDataset: 'audit',
  },
  {
    key: 'rh.emargement-session',
    label: 'Feuille d\'émargement session',
    description: 'Liste participants, signatures, formateur et lieu',
    category: 'rh',
    moduleKey: 'gestion-academique',
    renderPath: 'rh-emargement-session',
    supportedFormats: ['PDF', 'EXCEL'],
    engine: 'html-print',
    requiredParameters: [
      { key: 'sessionId', label: 'ID session', placeholder: 'UUID session formation' },
    ],
  },
  {
    key: 'academic.fiche-candidat',
    label: 'Fiche candidat',
    description: 'Identité, formation visée, statut pipeline et documents',
    category: 'academic',
    moduleKey: 'gestion-academique.vie-scolaire',
    renderPath: 'academic-fiche-candidat',
    supportedFormats: ['PDF', 'EXCEL'],
    engine: 'html-print',
    requiredParameters: [
      { key: 'candidatureId', label: 'ID candidature', placeholder: 'UUID dossier candidat' },
    ],
  },
  {
    key: 'rh.fiche-collaborateur',
    label: 'Fiche collaborateur',
    description: 'Contrat, conformité, absences et certifications',
    category: 'rh',
    moduleKey: 'gestion-ressources.rh',
    renderPath: 'rh-fiche-collaborateur',
    supportedFormats: ['PDF', 'EXCEL'],
    engine: 'html-print',
    requiredParameters: [
      { key: 'userId', label: 'ID collaborateur', placeholder: 'UUID utilisateur' },
    ],
  },
  {
    key: 'rh.contrat-travail',
    label: 'Contrat de travail (synthèse)',
    description: 'Type contrat, dates, fonction, temps de travail et coordonnées',
    category: 'legal',
    moduleKey: 'gestion-ressources.rh',
    renderPath: 'rh-contrat-travail',
    supportedFormats: ['PDF'],
    engine: 'html-print',
    requiredParameters: [
      { key: 'userId', label: 'ID collaborateur', placeholder: 'UUID salarié' },
    ],
  },
  {
    key: 'finance.devis',
    label: 'Devis commercial',
    description: 'Document PDF structuré (moteur pdfkit existant)',
    category: 'finance',
    moduleKey: 'administration-facturation.finance',
    renderPath: 'finance-devis',
    supportedFormats: ['PDF'],
    engine: 'pdfkit',
    requiredParameters: [{ key: 'devisId', label: 'ID devis', placeholder: 'UUID devis' }],
  },
];

const byKey = new Map(REPORT_TEMPLATE_REGISTRY.map((t) => [t.key, t]));

export function getReportTemplate(key: string): ReportTemplateDefinition | undefined {
  return byKey.get(key);
}

export function listReportTemplates(category?: ReportTemplateDefinition['category']) {
  if (!category) return REPORT_TEMPLATE_REGISTRY;
  return REPORT_TEMPLATE_REGISTRY.filter((t) => t.category === category);
}

export function validateTemplateParameters(
  template: ReportTemplateDefinition,
  parameters: Record<string, unknown>,
): string | null {
  for (const p of template.requiredParameters ?? []) {
    const v = parameters[p.key];
    if (typeof v !== 'string' || !v.trim()) return `${p.label} requis`;
  }
  return null;
}
