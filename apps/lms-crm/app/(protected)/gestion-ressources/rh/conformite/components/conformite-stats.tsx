'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Users, UserCheck, AlertTriangle, FileWarning, UserMinus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface ConformiteStat {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
}

interface ConformiteStatsProps {
  variant?: 'grid' | 'row';
}

const DEFAULT_STATS = {
  totalConformites: 0,
  activeConformites: 0,
  complianceIssues: 0,
  complianceNonCompliant: 0,
  documentsExpiring: 0,
  documentsExpired: 0,
};

export function ConformiteStats({ variant = 'grid' }: ConformiteStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: statsResponse, isLoading, error } = useQuery({
    queryKey: ['conformite-equipements-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/conformite/stats');
      if (!response.ok) {
        return { success: true, data: DEFAULT_STATS };
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} className="border border-border/70 shadow-none">
            <CardContent className="p-4">
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="mb-2 h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-8 text-center shadow-none">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-foreground">
          Échec du chargement des statistiques
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-border px-4 text-[10px] font-bold uppercase ring-offset-background transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const statsData = statsResponse?.data ?? DEFAULT_STATS;
  const total = statsData?.totalConformites ?? 0;
  const active = statsData?.activeConformites ?? 0;
  const inactive = Math.max(0, total - active);

  const stats: ConformiteStat[] = [
    {
      icon: Users,
      title: 'Conformités',
      value: total,
      subtitle: 'Effectif global',
    },
    {
      icon: UserCheck,
      title: 'Actifs',
      value: active,
      subtitle: 'Comptes opérationnels',
    },
    {
      icon: AlertTriangle,
      title: 'Conformité',
      value: statsData?.complianceIssues ?? 0,
      subtitle:
        statsData?.complianceNonCompliant > 0
          ? `${statsData.complianceNonCompliant} non conformes`
          : 'Aucun incident',
    },
    {
      icon: FileWarning,
      title: 'Documents',
      value: (statsData?.documentsExpiring ?? 0) + (statsData?.documentsExpired ?? 0),
      subtitle:
        statsData?.documentsExpired > 0
          ? `${statsData.documentsExpired} expirés`
          : 'À surveiller',
    },
    {
      icon: UserMinus,
      title: 'Non actifs',
      value: inactive,
      subtitle: `${total} fiches catalogue`,
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
              <div className="min-w-0">
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
