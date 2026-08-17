'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  DEFAULT_DEVIS_WORKFLOW_SETTINGS,
  mergeDevisWorkflowSettings,
  type DevisWorkflowSettings,
} from '@/lib/finance/devis-workflow-settings';

type ModuleSettingRow = {
  moduleKey: string;
  settingKey: string;
  value: Record<string, unknown>;
};

export function useDevisWorkflowSettings() {
  const { data = DEFAULT_DEVIS_WORKFLOW_SETTINGS, isLoading } = useQuery({
    queryKey: ['module-setting', 'finance', 'devis-workflow'],
    queryFn: async (): Promise<DevisWorkflowSettings> => {
      const sp = new URLSearchParams({ moduleKey: 'finance' });
      const res = await apiFetch(
        `/api/sections/securite-configuration/parametres/module-settings?${sp}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return DEFAULT_DEVIS_WORKFLOW_SETTINGS;
      const rows = unwrapSectionApiData<ModuleSettingRow[]>(json) ?? [];
      const row = rows.find((r) => r.settingKey === 'devis-workflow');
      return mergeDevisWorkflowSettings(row?.value);
    },
    staleTime: 60_000,
  });

  return { settings: data, isLoading };
}
