'use client';

import { Fragment, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@repo/ui/card';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle2, XCircle, ListFilter, Scale } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { Button } from '@repo/ui/button';

interface AbsenceStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

interface AbsenceStatsProps {
  variant?: 'grid' | 'row';
}

function normalizeAbsenceStats(payload: unknown): {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
} {
  const fallback = { pending: 0, approved: 0, rejected: 0, total: 0 };
  if (!payload || typeof payload !== 'object') return fallback;

  const record = payload as Record<string, unknown>;
  const rootStats = record.stats;
  if (rootStats && typeof rootStats === 'object') {
    return { ...fallback, ...(rootStats as Record<string, number>) };
  }

  const rootData = record.data;
  if (rootData && typeof rootData === 'object') {
    const dataRecord = rootData as Record<string, unknown>;
    if (dataRecord.stats && typeof dataRecord.stats === 'object') {
      return { ...fallback, ...(dataRecord.stats as Record<string, number>) };
    }
  }
  return fallback;
}

export function AbsenceStats({ variant = 'grid' }: AbsenceStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['rh-absences-stats-summary'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/absences');
      if (!response.ok) throw new Error('Failed to fetch absences');
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const statsSummary = normalizeAbsenceStats(data);
  const decided = statsSummary.approved + statsSummary.rejected;
  const acceptRate =
    decided > 0 ? Math.round((statsSummary.approved / decided) * 100) : null;

  const stats: AbsenceStat[] = [
    {
      label: 'Total demandes',
      value: statsSummary.total,
      icon: ListFilter,
      trendValue: 'Historique RH',
    },
    {
      label: 'En attente',
      value: statsSummary.pending,
      icon: Clock,
      trendValue: 'À traiter',
    },
    {
      label: 'Approuvées',
      value: statsSummary.approved,
      icon: CheckCircle2,
      trendValue: 'Validées',
    },
    {
      label: 'Rejetées',
      value: statsSummary.rejected,
      icon: XCircle,
      trendValue: 'Refusées',
    },
    {
      label: "Taux d'acceptation",
      value: acceptRate == null ? '—' : `${acceptRate}%`,
      icon: Scale,
      trendValue: decided > 0 ? `Sur ${decided} décision${decided > 1 ? 's' : ''}` : 'Aucune décision enregistrée',
    },
  ];

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 lg:gap-4';

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} className="border-border shadow-none transition-all duration-300 group-hover:scale-[1.02]">
            <CardContent className="p-6">
              <Skeleton className="mb-4 h-12 w-12 rounded-lg" />
              <Skeleton className="mb-2 h-8 w-16" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-border bg-background shadow-none">
        <CardContent className="flex flex-col items-center justify-center p-6 text-center">
          <p className="mb-2 text-sm font-bold uppercase tracking-widest text-foreground">Erreur de chargement</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.reload()}
            className="border-border text-[10px] font-bold uppercase"
          >
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Fragment>
      <style>
        {`
          .absences-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .absences-stats-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <div className={gridClasses}>
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
          return (
            <div
              key={stat.label}
              className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
            >
              <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
              <div className="relative flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stat.trendValue}</p>
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
    </Fragment>
  );
}
