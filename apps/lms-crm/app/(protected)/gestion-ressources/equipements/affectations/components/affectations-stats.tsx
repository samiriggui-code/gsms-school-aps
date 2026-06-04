'use client';

import { useEffect, useState } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Calendar, Package, CheckCircle2, Wrench, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface AffectationsStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

export function AffectationsStats({ searchQuery = '' }: { searchQuery?: string }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment-affectations-stats', searchQuery],
    queryFn: async () => {
      const affParams = new URLSearchParams({ limit: '1', page: '1' });
      if (searchQuery) affParams.set('query', searchQuery);

      const [affRes, statsRes] = await Promise.all([
        apiFetch(
          `/api/sections/gestion-ressources/equipements/affectations?${affParams}`,
        ),
        apiFetch('/api/sections/gestion-ressources/equipements/stats?days=30'),
      ]);

      const totalAffectations = affRes.ok
        ? ((await affRes.json())?.data?.pagination?.total ?? 0)
        : 0;

      let totalParc = 0;
      let disponibles = 0;
      let enMaintenance = 0;
      let enUtilisation = 0;

      if (statsRes.ok) {
        const json = await statsRes.json();
        const counts: Array<{ status: string; count: number }> = json?.data?.statusCounts ?? [];
        const get = (status: string) =>
          counts.find((s) => s.status === status)?.count ?? 0;
        totalParc = counts.reduce((acc, s) => acc + (s.count ?? 0), 0);
        disponibles = get('AVAILABLE');
        enMaintenance = get('MAINTENANCE');
        enUtilisation = get('IN_USE');
      }

      return { totalAffectations, totalParc, disponibles, enMaintenance, enUtilisation };
    },
    staleTime: 120_000,
  });

  const stats: AffectationsStat[] = [
    {
      icon: Calendar,
      label: 'Affectations',
      value: data?.totalAffectations ?? 0,
      trendValue: 'Liens session ↔ équipement',
    },
    {
      icon: Users,
      label: 'En utilisation',
      value: data?.enUtilisation ?? 0,
      trendValue: 'Unités mobilisées sur le terrain',
    },
    {
      icon: Package,
      label: 'Parc total',
      value: data?.totalParc ?? 0,
      trendValue: 'Équipements référencés',
    },
    {
      icon: CheckCircle2,
      label: 'Disponibles',
      value: data?.disponibles ?? 0,
      trendValue: 'Prêts à être affectés',
    },
    {
      icon: Wrench,
      label: 'En maintenance',
      value: data?.enMaintenance ?? 0,
      trendValue: 'Hors circulation temporaire',
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
  );
}
