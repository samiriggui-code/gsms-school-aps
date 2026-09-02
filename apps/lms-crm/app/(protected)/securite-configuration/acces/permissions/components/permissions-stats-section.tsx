'use client';

import { useState, useEffect } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Users, UserCheck, AlertTriangle, FileWarning, UserMinus } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';

interface PermissionsStatsSectionProps {
  variant?: 'grid' | 'row';
  firstMetricTitle?: string;
}

export function PermissionsStatsSection({
  variant = 'row',
  firstMetricTitle = 'Permissions',
}: PermissionsStatsSectionProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (!mounted) {
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

  const stats = [
    {
      icon: Users,
      title: firstMetricTitle,
      value: 0,
      subtitle: 'Permissions definies',
    },
    {
      icon: UserCheck,
      title: 'Actifs',
      value: 0,
      subtitle: 'Permissions appliquees',
    },
    {
      icon: AlertTriangle,
      title: 'Conformité',
      value: 0,
      subtitle: 'Aucun incident',
    },
    {
      icon: FileWarning,
      title: 'Documents',
      value: 0,
      subtitle: 'À surveiller',
    },
    {
      icon: UserMinus,
      title: 'Non actifs',
      value: 0,
      subtitle: 'Permissions revoquees',
    },
  ];

  return (
    <div className={cn(gridClasses, 'mb-5')}>
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