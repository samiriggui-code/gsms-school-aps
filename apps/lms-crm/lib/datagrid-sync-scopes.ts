import type { ModuleSyncScope } from '@repo/api-core';

/** Scopes exécutés par le bouton « Synchroniser » selon le module UI. */
export const DATAGRID_SYNC_SCOPES = {
  rhAbsences: ['rh-absences', 'stats-rh'] satisfies readonly ModuleSyncScope[],
  rhPersonnel: ['rh-absences', 'stats-rh'] satisfies readonly ModuleSyncScope[],
  rhConformite: ['rh-absences', 'stats-rh'] satisfies readonly ModuleSyncScope[],
  rhTeams: ['stats-rh'] satisfies readonly ModuleSyncScope[],
  vieScolaire: ['rh-absences', 'stats-academic'] satisfies readonly ModuleSyncScope[],
  candidats: ['rh-absences', 'stats-academic'] satisfies readonly ModuleSyncScope[],
  equipements: ['stats-equipements', 'equipment-sessions'] satisfies readonly ModuleSyncScope[],
  finance: ['stats-finance', 'crm-events'] satisfies readonly ModuleSyncScope[],
  compagnieDocuments: [] satisfies readonly ModuleSyncScope[],
} as const;

export type DatagridSyncPreset = keyof typeof DATAGRID_SYNC_SCOPES;
