'use client';

import { useEffect, useState } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import {
  Theater,
  CheckCircle2,
  Ban,
  CalendarCheck,
  CalendarDays,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface SallesStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

export function SallesStats() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ['venue-rooms-stats'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/gestion-ressources/equipements/salles/stats',
      );
      if (!res.ok) {
        return {
          total: 0,
          disponibles: 0,
          reservedToday: 0,
          sessionsUpcoming: 0,
          inactives: 0,
        };
      }
      const json = await res.json();
      return json?.data ?? {};
    },
    staleTime: 120_000,
  });

  const stats: SallesStat[] = [
    {
      icon: Theater,
      label: 'Salles référencées',
      value: data?.total ?? 0,
      trendValue: 'Espaces pédagogiques du catalogue',
    },
    {
      icon: CheckCircle2,
      label: 'Disponibles aujourd’hui',
      value: data?.disponibles ?? 0,
      trendValue: 'Salles actives sans session en cours',
    },
    {
      icon: CalendarCheck,
      label: 'Réservées aujourd’hui',
      value: data?.reservedToday ?? 0,
      trendValue: 'Salles occupées par une session',
    },
    {
      icon: CalendarDays,
      label: 'Sessions à venir',
      value: data?.sessionsUpcoming ?? 0,
      trendValue: 'Planifiées sur l’ensemble des salles',
    },
    {
      icon: Ban,
      label: 'Inactives',
      value: data?.inactives ?? 0,
      trendValue: 'Hors réservation (désactivées)',
    },
  ];

  if (!mounted || isLoading) {
    return (
      <div className={MODULE_LANDING_STATS_GRID_ROW}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-background px-4 py-4"
          >
            <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={MODULE_LANDING_STATS_GRID_ROW}>
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
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">
                  {stat.label}
                </p>
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
  );
}
