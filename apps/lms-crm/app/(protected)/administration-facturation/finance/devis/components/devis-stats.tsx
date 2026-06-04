'use client';

import { useMemo } from 'react';
import { FileText, FileClock, Send, Banknote, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { useFinanceDevisQuery } from '../hooks/use-finance-devis-query';

interface DevisStatsProps {
  variant?: 'grid' | 'row';
}

export function DevisStats({ variant = 'row' }: DevisStatsProps) {
  const { data, isLoading } = useFinanceDevisQuery({
    leadId: null,
    page: 1,
    limit: 10,
    status: 'all',
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid w-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5';

  const stats = useMemo<
    {
      title: string;
      value: number | string;
      subtitle: string;
      icon: typeof FileText;
    }[]
  >(() => {
    const fmt = (value: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value ?? 0);

    const total = data?.stats.total ?? 0;
    const brouillons = data?.stats.brouillons ?? 0;
    const envoyes = data?.stats.envoyes ?? 0;
    const pipelineTtc = data?.stats.pipelineTtc ?? 0;
    const dansPipeline = brouillons + envoyes;
    const panierMoyen = dansPipeline > 0 ? pipelineTtc / dansPipeline : 0;

    return [
      {
        icon: FileText,
        title: 'Total devis',
        value: total,
        subtitle: 'Tous statuts',
      },
      {
        icon: FileClock,
        title: 'Brouillons',
        value: brouillons,
        subtitle: 'À finaliser',
      },
      {
        icon: Send,
        title: 'Envoyés',
        value: envoyes,
        subtitle: 'En attente client',
      },
      {
        icon: Banknote,
        title: 'Pipeline TTC',
        value: fmt(pipelineTtc),
        subtitle: 'Brouillons + envoyés',
      },
      {
        icon: Calculator,
        title: 'Panier moyen TTC',
        value: dansPipeline > 0 ? fmt(panierMoyen) : '—',
        subtitle:
          dansPipeline > 0
            ? `Sur ${dansPipeline} devis dans le pipeline`
            : 'Aucun devis brouillon ou envoyé',
      },
    ];
  }, [data]);

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
              <div className="min-w-0 pr-2">
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
