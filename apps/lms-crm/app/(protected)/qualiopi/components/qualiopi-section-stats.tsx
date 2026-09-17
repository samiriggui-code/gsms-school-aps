'use client';

import { Fragment } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getIcon } from '@/lib/icons';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';
import { Card, CardContent } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';

type QualiopiBootstrap = {
  summary: { completenessPct: number; status: string };
  items: { status: string }[];
};

type PilotageLanding = {
  kpis: { key: string; label: string; value: number | string; subtitle: string }[];
};

type IaStats = {
  proposed: number;
  approved: number;
  rejected: number;
  runsTotal: number;
  runsFailed: number;
};

/** Rangée de 5 KPI pleine largeur pour la page section Qualiopi (Référentiel + Pilotage + IA). */
export function QualiopiSectionStats() {
  const qualiopiQuery = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<QualiopiBootstrap>(await res.json());
    },
    staleTime: 30_000,
  });

  const pilotageQuery = useQuery({
    queryKey: ['pilotage-supervision', 'pilotage', 'landing'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/pilotage/landing');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<PilotageLanding>(await res.json());
    },
    staleTime: 30_000,
  });

  const iaQuery = useQuery({
    queryKey: ['pilotage-supervision', 'ia', 'stats'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/ia/stats');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<IaStats>(await res.json());
    },
    staleTime: 30_000,
  });

  const isLoading = qualiopiQuery.isLoading || pilotageQuery.isLoading || iaQuery.isLoading;

  if (isLoading) {
    return (
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i}>
            <CardContent className="p-0 h-full min-h-[120px]">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-12 shrink-0 rounded-lg" />}>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const items = qualiopiQuery.data?.items ?? [];
  const ko = items.filter((i) => i.status === 'REJECTED').length;
  const toTreat = items.filter((i) => !['VALIDATED', 'WAIVED'].includes(i.status)).length;
  const alertsKpi = pilotageQuery.data?.kpis.find((k) => k.key === 'alerts');

  const stats: {
    icon: string;
    label: string;
    value: string;
    detail: string;
    trend: 'up' | 'down' | 'neutral';
    tone: MetricStatTone;
  }[] = [
    {
      icon: 'ShieldCheck',
      label: 'Complétude classeur',
      value: `${qualiopiQuery.data?.summary.completenessPct ?? 0}%`,
      detail: `${items.length} indicateurs V.9`,
      trend: 'neutral',
      tone: 'success',
    },
    {
      icon: 'ClipboardCheck',
      label: 'À traiter',
      value: String(toTreat),
      detail: `${ko} non conformes (KO)`,
      trend: ko > 0 ? 'down' : 'neutral',
      tone: 'info',
    },
    {
      icon: 'AlertTriangle',
      label: 'Alertes non lues',
      value: String(alertsKpi?.value ?? 0),
      detail: alertsKpi?.subtitle ?? 'Pilotage',
      trend: Number(alertsKpi?.value ?? 0) > 0 ? 'down' : 'neutral',
      tone: 'warning',
    },
    {
      icon: 'BookOpenCheck',
      label: 'Brouillons IA',
      value: String(iaQuery.data?.proposed ?? 0),
      detail: `${iaQuery.data?.runsTotal ?? 0} runs`,
      trend: 'neutral',
      tone: 'primary',
    },
    {
      icon: 'AlertCircle',
      label: 'Écarts détectés',
      value: String(ko),
      detail: 'Référentiel Qualiopi',
      trend: ko > 0 ? 'down' : 'neutral',
      tone: 'destructive',
    },
  ];

  return (
    <Fragment>
      <SectionStatsCardBackgroundStyles />
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {stats.map((stat, index) => {
          const Icon = getIcon(stat.icon);
          return (
            <SectionLandingHexStatCard
              key={index}
              icon={Icon}
              tone={stat.tone}
              label={stat.label}
              value={stat.value}
              detail={stat.detail}
              trend={stat.trend}
            />
          );
        })}
      </div>
    </Fragment>
  );
}
