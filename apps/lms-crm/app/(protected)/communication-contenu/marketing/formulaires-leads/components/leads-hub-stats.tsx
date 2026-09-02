'use client';

import { useLandingLeadsQuery } from '../hooks/use-landing-leads-query';
import { Users, FileText, UserCheck, Clock3, ListChecks } from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';

interface LeadsHubStatsProps {
  variant?: 'grid' | 'row';
}

export function LeadsHubStats({ variant = 'row' }: LeadsHubStatsProps) {
  const { data, isLoading } = useLandingLeadsQuery({ kind: 'all', q: '', page: 1, limit: 10 });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid h-full grid-cols-2 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-5 sm:gap-4 lg:gap-4';

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((i) => (
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

  const total = data?.stats.totalLanding ?? 0;
  const nouveaux = data?.stats.nouveaux ?? 0;
  const horsNouveau = Math.max(0, total - nouveaux);

  const stats = [
    {
      icon: Users,
      title: 'Leads landing',
      value: total,
      subtitle: 'Toutes sources',
    },
    {
      icon: FileText,
      title: 'Demandes devis',
      value: data?.stats.quote ?? 0,
      subtitle: 'Source devis',
    },
    {
      icon: UserCheck,
      title: 'Préinscriptions',
      value: data?.stats.preinscription ?? 0,
      subtitle: 'Source préinscription',
    },
    {
      icon: Clock3,
      title: 'Nouveaux',
      value: nouveaux,
      subtitle: 'Statut NEW',
    },
    {
      icon: ListChecks,
      title: 'Hors statut NEW',
      value: horsNouveau,
      subtitle: 'Traités ou autre statut',
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
