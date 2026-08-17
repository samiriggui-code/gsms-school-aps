'use client';

import { Container } from '@/components/common/container';
import {
  Headphones,
  AlertOctagon,
  Clock,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Skeleton } from '@/components/ui/skeleton';
import { useSupportQualiteStats } from '../hooks/use-support-qualite-stats';

export type SupportLandingContext = 'tickets' | 'incidents';

const ICON_BY_KPI = [Headphones, AlertOctagon, Clock, TrendingUp, Headphones] as const;

const CONTEXT_ICONS: Record<SupportLandingContext, typeof Headphones> = {
  tickets: Headphones,
  incidents: AlertOctagon,
};

export function SupportLandingFiveKpis({ context }: { context: SupportLandingContext }) {
  const { kpis, isLoading } = useSupportQualiteStats();
  const ContextIcon = CONTEXT_ICONS[context];

  if (isLoading) {
    return (
      <Container className="pb-5">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="min-h-[120px] rounded-xl" />
          ))}
        </div>
      </Container>
    );
  }

  const stats = kpis.map((kpi, index) => ({
    icon: index === 0 ? ContextIcon : ICON_BY_KPI[index] ?? AlertOctagon,
    title: kpi.label,
    value: String(kpi.value),
    subtitle: kpi.trendValue || '—',
  }));

  return (
    <Container className="pb-5">
      <div className={MODULE_LANDING_STATS_GRID_ROW}>
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
    </Container>
  );
}
