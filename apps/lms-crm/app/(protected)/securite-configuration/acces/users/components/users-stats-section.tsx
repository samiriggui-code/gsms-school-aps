'use client';

import { useState, useEffect } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Users, Shield, Key, UserPlus, Lock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

const ICON_MAP: Record<string, any> = {
  'Users': Users,
  'Shield': Shield,
  'Key': Key,
  'UserPlus': UserPlus,
  'Lock': Lock,
};

interface UsersStatsSectionProps {
  variant?: 'grid' | 'row';
  firstMetricTitle?: string;
}

export function UsersStatsSection({
  variant = 'row',
  firstMetricTitle = 'Utilisateurs',
}: UsersStatsSectionProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: statsResponse, isLoading, error } = useQuery({
    queryKey: ['security-stats-section'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/securite-configuration/stats');
      if (!response.ok) return { success: true, data: { kpis: [] } };
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
      <div className={cn(gridClasses, 'mb-5')}>
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-8 w-16" />
            <Skeleton className="mt-2 h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return null;
  }

  const kpis = statsResponse?.data?.kpis ?? [];

  return (
    <div className={cn(gridClasses, 'mb-5')}>
      {kpis.map((stat: any, index: number) => {
        const Icon = ICON_MAP[stat.icon] || Users;
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
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stat.trendValue || 'Données système'}</p>
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
