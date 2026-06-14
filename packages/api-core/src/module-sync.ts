import type { PrismaClient } from '@repo/database';
import { CrmEventService } from './crm-events';
import { syncAllUsersAbsenceStatus } from './rh-absence-sync';
import { releaseEndedSessionsEquipment } from './equipment-lifecycle';
import { StatService } from './services';

export type ModuleSyncScope =
  | 'rh-absences'
  | 'stats-rh'
  | 'stats-academic'
  | 'stats-finance'
  | 'stats-equipements'
  | 'crm-events'
  | 'equipment-sessions';

export type DatagridSyncPreset =
  | 'rhAbsences'
  | 'rhPersonnel'
  | 'rhTeams'
  | 'rhConformite'
  | 'equipements'
  | 'compagnieDocuments'
  | 'vieScolaire'
  | 'candidats'
  | 'finance';

const PRESET_SCOPES: Record<DatagridSyncPreset, ModuleSyncScope[]> = {
  rhAbsences: ['rh-absences', 'stats-rh'],
  rhPersonnel: ['rh-absences', 'stats-rh'],
  rhTeams: ['stats-rh'],
  rhConformite: ['stats-rh'],
  equipements: ['stats-equipements', 'equipment-sessions'],
  compagnieDocuments: [],
  vieScolaire: ['stats-academic', 'rh-absences'],
  candidats: ['stats-academic', 'rh-absences'],
  finance: ['stats-finance', 'crm-events'],
};

export type ModuleSyncResult = {
  preset: DatagridSyncPreset;
  scopes: ModuleSyncScope[];
  results: Record<string, unknown>;
};

export function scopesForPreset(preset: DatagridSyncPreset): ModuleSyncScope[] {
  return PRESET_SCOPES[preset] ?? [];
}

export async function runModuleSync(
  prisma: PrismaClient,
  preset: DatagridSyncPreset,
): Promise<ModuleSyncResult> {
  const scopes = scopesForPreset(preset);
  const stats = new StatService(prisma);
  const events = new CrmEventService(prisma);
  const results: Record<string, unknown> = {};

  for (const scope of scopes) {
    switch (scope) {
      case 'rh-absences':
        results['rh-absences'] = await syncAllUsersAbsenceStatus(prisma);
        break;
      case 'stats-rh':
        results['stats-rh'] = {
          collaborateurs: await stats.getCollaborateursStats(12),
        };
        break;
      case 'stats-academic':
        results['stats-academic'] = {
          vieScolaire: await stats.getVieScolaireStats(12),
          candidats: await stats.getCandidatsStats(12),
        };
        break;
      case 'stats-finance':
        results['stats-finance'] = await stats.getFinanceStats(12);
        break;
      case 'stats-equipements':
        results['stats-equipements'] = await stats.getEquipementsStats(30);
        break;
      case 'equipment-sessions':
        results['equipment-sessions'] = await releaseEndedSessionsEquipment(prisma);
        break;
      case 'crm-events':
        results['crm-events'] = await events.processPending(40);
        break;
      default:
        break;
    }
  }

  return { preset, scopes, results };
}
