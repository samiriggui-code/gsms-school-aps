'use client';

import { useEffect, useState } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Wrench, AlertTriangle, Package, CheckCircle2, PackageX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface MaintenanceStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

export function MaintenanceStats() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment-maintenance-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/equipements/stats?days=30');
      if (!response.ok) {
        return { total: 0, maintenance: 0, outOfService: 0, available: 0, inUse: 0 };
      }
      const json = await response.json();
      const counts: Array<{ status: string; count: number }> = json?.data?.statusCounts ?? [];
      const get = (status: string) =>
        counts.find((s) => s.status === status)?.count ?? 0;
      const total = counts.reduce((acc, s) => acc + (s.count ?? 0), 0);
      return {
        total,
        maintenance: get('MAINTENANCE'),
        outOfService: get('OUT_OF_SERVICE'),
        available: get('AVAILABLE'),
        inUse: get('IN_USE'),
      };
    },
    staleTime: 120_000,
  });

  const stats: MaintenanceStat[] = [
    {
      icon: Wrench,
      label: 'En maintenance',
      value: data?.maintenance ?? 0,
      trendValue: 'Unités en atelier ou révision',
    },
    {
      icon: AlertTriangle,
      label: 'Hors service',
      value: data?.outOfService ?? 0,
      trendValue: 'Indisponibles jusqu’à réparation',
    },
    {
      icon: Package,
      label: 'Parc total',
      value: data?.total ?? 0,
      trendValue: 'Équipements suivis',
    },
    {
      icon: CheckCircle2,
      label: 'Disponibles',
      value: data?.available ?? 0,
      trendValue: 'Réintégrables au parc actif',
    },
    {
      icon: PackageX,
      label: 'En utilisation',
      value: data?.inUse ?? 0,
      trendValue: 'Mobilisés hors maintenance',
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
