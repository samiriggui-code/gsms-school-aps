'use client';

import {
  CalendarRange,
  CircleCheckBig,
  FilePenLine,
  Layers,
  Archive,
} from 'lucide-react';
import { Card, CardContent } from '@repo/ui/card';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  MODULE_PAGE_KPI_COUNT,
  SECTION_KPI_CARD_ACCENTS,
  kpiStatsGridClass,
} from '@/components/common/stat-card-metric-layout';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import { useFormationsStatsQuery } from '../hooks/use-formations-stats-query';
import type { FormationCatalogStatsApi } from '../types/catalog-api';
import { Button } from '@repo/ui/button';

interface FormationStat {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: string | number;
  subtitle: string;
}

interface FormationStatsProps {
  variant?: 'grid' | 'row';
}

const EMPTY_STATS: FormationCatalogStatsApi = {
  totalFormations: 0,
  activeFormations: 0,
  draftFormations: 0,
  archivedFormations: 0,
  featuredFormations: 0,
  totalVitrineSessions: 0,
  byTrack: {},
};

export function FormationStats({ variant = 'grid' }: FormationStatsProps) {
  const { data: statsResponse, isLoading, error, refetch } = useFormationsStatsQuery();

  const gridClasses =
    variant === 'row' ? MODULE_LANDING_STATS_GRID_ROW : kpiStatsGridClass(MODULE_PAGE_KPI_COUNT);

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: MODULE_PAGE_KPI_COUNT }, (_, i) => i + 1).map((index) => (
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
        <p className="mb-4 max-w-md text-xs text-muted-foreground">{(error as Error).message}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Réessayer
        </Button>
      </div>
    );
  }

  const s = statsResponse ?? EMPTY_STATS;

  const stats: FormationStat[] = [
    {
      icon: Layers,
      title: 'Références catalogue',
      value: s.totalFormations,
      subtitle: 'Formations en base',
    },
    {
      icon: CircleCheckBig,
      title: 'Publiées',
      value: s.activeFormations,
      subtitle: 'Statut actif',
    },
    {
      icon: FilePenLine,
      title: 'Brouillons',
      value: s.draftFormations,
      subtitle: 'À finaliser',
    },
    {
      icon: CalendarRange,
      title: 'Sessions vitrine',
      value: s.totalVitrineSessions,
      subtitle: 'Dates offre commerciale',
    },
    {
      icon: Archive,
      title: 'Archivées',
      value: s.archivedFormations,
      subtitle:
        s.featuredFormations > 0
          ? `${s.featuredFormations} mise(s) en avant dans le catalogue`
          : 'Hors publication active',
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
