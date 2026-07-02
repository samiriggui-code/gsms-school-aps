import {
  REPORT_TEMPLATE_REGISTRY,
  getReportTemplate,
  type ReportTemplateDefinition,
} from '@repo/report-engine';
import { CRM_MODULE_KEYS } from './crm-events';
import { isPilotageExportDataset } from './pilotage-export';
import type { PilotageRapportTemplate } from './pilotage-hub';

export const GESTION_RESSOURCES_REPORT_TEMPLATES: PilotageRapportTemplate[] = [
  {
    id: 'gr-rh-conformite',
    label: 'État conformité RH',
    moduleKey: CRM_MODULE_KEYS.RH,
    format: 'CSV',
    status: 'available',
    description: 'Cartes pro, titres de séjour et certifications à échéance',
    exportDataset: 'rh-compliance',
    href: '/gestion-ressources/rh/conformite',
  },
  {
    id: 'gr-equipements-inventaire',
    label: 'Inventaire équipements',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    format: 'CSV',
    status: 'available',
    description: 'Statuts parc, maintenance et affectations',
    exportDataset: 'equipment-inventory',
    href: '/gestion-ressources/equipements/inventaire',
  },
  {
    id: 'gr-salles-planning',
    label: 'Planning salles',
    moduleKey: CRM_MODULE_KEYS.EQUIPEMENTS,
    format: 'PDF',
    status: 'scheduled',
    description: 'Occupation et réservations sur la période',
    exportDataset: null,
    href: '/gestion-ressources/equipements/salles',
  },
  {
    id: 'gr-absences',
    label: 'Synthèse absences',
    moduleKey: CRM_MODULE_KEYS.RH,
    format: 'Excel',
    status: 'available',
    description: 'Absences actives et historique récent',
    exportDataset: null,
    href: '/gestion-ressources/rh/absences',
  },
  {
    id: 'gr-compagnie-docs',
    label: 'Documents compagnie',
    moduleKey: 'gestion-ressources.compagnie',
    format: 'PDF',
    status: 'available',
    description: 'Dossier administratif et pièces légales',
    exportDataset: null,
    href: '/gestion-ressources/compagnie',
  },
];

function moduleHrefFromKey(moduleKey: string): string {
  if (moduleKey.startsWith('gestion-ressources.rh')) return '/gestion-ressources/rh/collaborateurs';
  if (moduleKey.startsWith('gestion-ressources.equipements')) return '/gestion-ressources/equipements/inventaire';
  if (moduleKey.startsWith('gestion-ressources')) return '/gestion-ressources';
  if (moduleKey.startsWith('gestion-academique')) return '/gestion-academique/vie-scolaire';
  if (moduleKey.startsWith('administration-facturation')) return '/administration-facturation/finance';
  if (moduleKey.startsWith('support-qualite')) return '/support-qualite';
  if (moduleKey.startsWith('communication-contenu')) return '/communication-contenu';
  if (moduleKey.startsWith('securite-configuration')) return '/securite-configuration';
  if (moduleKey.startsWith('pilotage-supervision')) return '/pilotage-supervision/pilotage';
  return '/pilotage-supervision/pilotage';
}

function registryFormat(t: ReportTemplateDefinition): PilotageRapportTemplate['format'] {
  if (t.supportedFormats.includes('PDF')) return 'PDF';
  if (t.supportedFormats.includes('EXCEL')) return 'Excel';
  return 'CSV';
}

export function registryToPilotageTemplate(t: ReportTemplateDefinition): PilotageRapportTemplate {
  return {
    id: t.key,
    label: t.label,
    moduleKey: t.moduleKey,
    format: registryFormat(t),
    status: 'available',
    description: t.description,
    exportDataset:
      t.exportDataset && isPilotageExportDataset(t.exportDataset) ? t.exportDataset : null,
    href: moduleHrefFromKey(t.moduleKey),
  };
}

export function moduleMatchesTemplateModule(moduleId: string, moduleKey: string): boolean {
  if (moduleId === 'all') return true;
  return moduleKey === moduleId || moduleKey.startsWith(`${moduleId}.`);
}

export function templatesForPilotageModule(moduleId: string): PilotageRapportTemplate[] {
  const fromRegistry = REPORT_TEMPLATE_REGISTRY.filter((t) =>
    moduleMatchesTemplateModule(moduleId, t.moduleKey),
  ).map(registryToPilotageTemplate);

  const legacy =
    moduleId === 'all' || moduleId === 'gestion-ressources'
      ? GESTION_RESSOURCES_REPORT_TEMPLATES.filter((t) =>
          moduleMatchesTemplateModule(moduleId, t.moduleKey),
        )
      : [];

  const seen = new Set<string>();
  const merged: PilotageRapportTemplate[] = [];
  for (const row of [...fromRegistry, ...legacy]) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    merged.push(row);
  }
  return merged;
}

export function templateKeysForPilotageModule(moduleId: string): string[] | null {
  if (moduleId === 'all') return null;
  return templatesForPilotageModule(moduleId).map((t) => t.id);
}

export function resolvePilotageModuleKey(templateId: string, fallback = 'pilotage-supervision'): string {
  return getReportTemplate(templateId)?.moduleKey ?? fallback;
}
