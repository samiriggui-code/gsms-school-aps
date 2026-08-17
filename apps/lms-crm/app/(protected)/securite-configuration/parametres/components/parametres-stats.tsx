'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Settings, Bell, Plug, FileText } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type SettingsSummary = {
  name: string;
  active: boolean;
  notifySystemErrorWeb: boolean;
  websiteURL: string | null;
};

export function ParametresStats() {
  const { data: settings } = useQuery({
    queryKey: ['parametres-settings-summary'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/securite-configuration/parametres/settings');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return null;
      const payload = json as { settings?: SettingsSummary };
      return payload.settings ?? null;
    },
    staleTime: 60_000,
  });

  const { data: moduleSettings = [] } = useQuery({
    queryKey: ['module-settings-count'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/securite-configuration/parametres/module-settings');
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return [];
      return unwrapSectionApiData<Array<{ id: string }>>(json) ?? [];
    },
    staleTime: 60_000,
  });

  const stats: Array<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    value: string;
    detail: string;
    color: MetricStatTone;
  }> = [
    {
      icon: Settings,
      label: 'Établissement',
      value: settings?.active ? 'Actif' : 'Inactif',
      detail: settings?.name ?? '—',
      color: 'primary',
    },
    {
      icon: Bell,
      label: 'Alertes système',
      value: settings?.notifySystemErrorWeb ? 'Web ON' : 'Web OFF',
      detail: 'Notifications',
      color: 'warning',
    },
    {
      icon: Plug,
      label: 'Modules config',
      value: String(moduleSettings.length),
      detail: 'Clés enregistrées',
      color: 'success',
    },
    {
      icon: FileText,
      label: 'Site web',
      value: settings?.websiteURL ? 'Configuré' : 'À définir',
      detail: settings?.websiteURL ?? 'URL manquante',
      color: 'destructive',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-2 lg:gap-8 h-full items-stretch">
      {stats.map((stat) => (
        <ModuleLandingStatGradientCard
          key={stat.label}
          icon={stat.icon}
          tone={stat.color}
          label={stat.label}
          value={stat.value}
          detail={stat.detail}
          trend="neutral"
        />
      ))}
    </div>
  );
}
