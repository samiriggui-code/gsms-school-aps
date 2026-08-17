'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  LAYOUT_WIDGET_CATALOG,
  defaultLayoutWidgets,
  type LayoutModuleKey,
} from '@/config/dashboard-widgets.config';

type ModuleSettingRow = {
  moduleKey: string;
  settingKey: string;
  value: { widgets?: string[] };
};

export function useModuleLayout(moduleKey: LayoutModuleKey) {
  const catalog = LAYOUT_WIDGET_CATALOG[moduleKey];
  const defaults = defaultLayoutWidgets(moduleKey);

  const { data: widgets = defaults, isLoading } = useQuery({
    queryKey: ['module-layout', moduleKey],
    queryFn: async () => {
      const sp = new URLSearchParams({ moduleKey });
      const res = await apiFetch(
        `/api/sections/securite-configuration/parametres/module-settings?${sp}`,
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return defaults;
      const rows = unwrapSectionApiData<ModuleSettingRow[]>(json) ?? [];
      const layout = rows.find((r) => r.settingKey === 'layout');
      const saved = layout?.value?.widgets;
      if (!Array.isArray(saved) || saved.length === 0) return defaults;
      return saved.filter((id) => catalog.some((w) => w.id === id));
    },
    staleTime: 60_000,
  });

  return {
    widgets,
    isLoading,
    isVisible: (id: string) => widgets.includes(id),
  };
}

/** @deprecated Préférer `useModuleLayout` */
export function useDashboardLayout(moduleKey: LayoutModuleKey) {
  return useModuleLayout(moduleKey);
}
