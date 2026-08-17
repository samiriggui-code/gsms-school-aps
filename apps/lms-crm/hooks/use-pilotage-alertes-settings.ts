'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type PilotageAlertesSettings = {
  candidaturesPending: number;
  overdueInvoices: number;
  equipmentMaintenanceDue: number;
  sessionsWithoutTrainer: number;
};

export const DEFAULT_PILOTAGE_ALERTES_SETTINGS: PilotageAlertesSettings = {
  candidaturesPending: 10,
  overdueInvoices: 5,
  equipmentMaintenanceDue: 3,
  sessionsWithoutTrainer: 2,
};

type ModuleSettingRow = {
  moduleKey: string;
  settingKey: string;
  value: Record<string, unknown>;
};

export function mergePilotageAlertesSettings(
  value: Record<string, unknown> | null | undefined,
): PilotageAlertesSettings {
  if (!value) return DEFAULT_PILOTAGE_ALERTES_SETTINGS;
  return {
    candidaturesPending:
      Number(value.candidaturesPending) || DEFAULT_PILOTAGE_ALERTES_SETTINGS.candidaturesPending,
    overdueInvoices:
      Number(value.overdueInvoices) || DEFAULT_PILOTAGE_ALERTES_SETTINGS.overdueInvoices,
    equipmentMaintenanceDue:
      Number(value.equipmentMaintenanceDue) ||
      DEFAULT_PILOTAGE_ALERTES_SETTINGS.equipmentMaintenanceDue,
    sessionsWithoutTrainer:
      Number(value.sessionsWithoutTrainer) ||
      DEFAULT_PILOTAGE_ALERTES_SETTINGS.sessionsWithoutTrainer,
  };
}

export function usePilotageAlertesSettings() {
  const { data = DEFAULT_PILOTAGE_ALERTES_SETTINGS, isLoading } = useQuery({
    queryKey: ['module-setting', 'pilotage-supervision', 'alertes'],
    queryFn: async (): Promise<PilotageAlertesSettings> => {
      const sp = new URLSearchParams({ moduleKey: 'pilotage-supervision' });
      const res = await apiFetch(
        `/api/sections/securite-configuration/parametres/module-settings?${sp}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return DEFAULT_PILOTAGE_ALERTES_SETTINGS;
      const rows = unwrapSectionApiData<ModuleSettingRow[]>(json) ?? [];
      const row = rows.find((r) => r.settingKey === 'alertes');
      return mergePilotageAlertesSettings(row?.value);
    },
    staleTime: 60_000,
  });

  return { settings: data, isLoading };
}
