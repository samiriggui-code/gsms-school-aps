'use client';

import { useEffect, useState } from 'react';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { CalendarDays, Users, UserX, MapPinOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type PlanningSummary = {
  sessionCount: number;
  participantsTotal: number;
  withoutTrainer: number;
  withoutRoom: number;
};

interface VieScolairePlanningStatsProps {
  summary?: PlanningSummary | null;
  isLoading?: boolean;
}

export function VieScolairePlanningStats({
  summary,
  isLoading,
}: VieScolairePlanningStatsProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const stats = [
    {
      icon: CalendarDays,
      label: 'Sessions',
      value: summary?.sessionCount ?? 0,
      trendValue: 'Sur la période affichée',
    },
    {
      icon: Users,
      label: 'Inscrits',
      value: summary?.participantsTotal ?? 0,
      trendValue: 'Apprenants sur les sessions',
    },
    {
      icon: UserX,
      label: 'Sans formateur',
      value: summary?.withoutTrainer ?? 0,
      trendValue: 'À affecter',
    },
    {
      icon: MapPinOff,
      label: 'Sans salle',
      value: summary?.withoutRoom ?? 0,
      trendValue: 'Salle non renseignée',
    },
  ];

  if (!mounted || isLoading) {
    return (
      <div className={MODULE_LANDING_STATS_GRID_ROW}>
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
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
