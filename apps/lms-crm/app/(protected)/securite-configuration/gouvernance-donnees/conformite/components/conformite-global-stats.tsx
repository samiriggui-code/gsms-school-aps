'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, FileWarning, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { fetchGlobalComplianceStats } from '@/lib/governance/global-user-compliance-api';

export function ConformiteGlobalStats() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['governance-compliance-stats'],
    queryFn: fetchGlobalComplianceStats,
    staleTime: 60_000,
  });

  const items = useMemo(
    () => [
      {
        label: 'Profils suivis',
        value: isLoading ? '—' : (stats?.totalConformites ?? 0),
        subtitle: 'École (tous rôles)',
        icon: Users,
      },
      {
        label: 'Conformes',
        value: isLoading ? '—' : (stats?.compliantCount ?? 0),
        subtitle: 'Sans anomalie',
        icon: ShieldCheck,
      },
      {
        label: 'Alertes',
        value: isLoading ? '—' : (stats?.warningCount ?? 0),
        subtitle: 'À surveiller',
        icon: AlertTriangle,
      },
      {
        label: 'Non conformes',
        value: isLoading ? '—' : (stats?.nonCompliantCount ?? 0),
        subtitle: 'Action requise',
        icon: FileWarning,
      },
      {
        label: 'Comptes actifs',
        value: isLoading ? '—' : (stats?.activeConformites ?? 0),
        subtitle: 'Statut ACTIVE',
        icon: UserCheck,
      },
    ],
    [isLoading, stats],
  );

  return <ModuleKpiStatsRow items={items} />;
}
