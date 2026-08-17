'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  MODULE_PAGE_KPI_COUNT,
  SECTION_KPI_CARD_ACCENTS,
  kpiStatsGridClass,
} from '@/components/common/stat-card-metric-layout';
import { Users, CalendarCheck, FileCheck, Timer, FileX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { candidatHubStatsQueryKey } from '../constants/query-keys';

type HubStatApi = {
  total: number;
  avecSession: number;
  dossierValide: number;
  dossierEnAttente: number;
  sansDossier: number;
};

interface CandidatHubStatsProps {
  variant?: 'grid' | 'row';
}

export function CandidatHubStats({ variant = 'row' }: CandidatHubStatsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: [...candidatHubStatsQueryKey],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/rh/CandidatHub/stats');
      const json = (await res.json()) as { success?: boolean; data?: HubStatApi };
      if (!json?.success || json.data == null) throw new Error('stats');
      return json.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const gridClasses =
    variant === 'row' ? MODULE_LANDING_STATS_GRID_ROW : kpiStatsGridClass(MODULE_PAGE_KPI_COUNT);

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: MODULE_PAGE_KPI_COUNT }, (_, i) => i + 1).map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-12" />
            <Skeleton className="mt-2 h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return null;
  }

  const stats: {
    title: string;
    value: number;
    subtitle: string;
    icon: typeof Users;
  }[] = [
    {
      icon: Users,
      title: 'Candidats',
      value: data.total,
      subtitle: 'Rôles candidat + élève',
    },
    {
      icon: CalendarCheck,
      title: 'Inscrits session',
      value: data.avecSession,
      subtitle: 'Au moins une session CRM',
    },
    {
      icon: FileCheck,
      title: 'Dossier validé',
      value: data.dossierValide,
      subtitle: 'Statut dossier validé',
    },
    {
      icon: Timer,
      title: 'Dossier en attente',
      value: data.dossierEnAttente,
      subtitle: 'Hors statut terminal',
    },
    {
      icon: FileX,
      title: 'Sans dossier',
      value: data.sansDossier,
      subtitle: data.sansDossier > 0 ? 'Aucune fiche dossier en CRM' : 'Tous les dossiers créés',
    },
  ];

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
        return (
          <div
            key={stat.title}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0 pr-2">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{stat.title}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                  accent.box,
                )}
              >
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
