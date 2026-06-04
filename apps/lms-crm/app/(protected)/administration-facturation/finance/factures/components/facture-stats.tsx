'use client';

import { useMemo } from 'react';
import { ReceiptText, Banknote, GraduationCap, Layers, Calculator } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { useFinanceFactureQuery } from '../hooks/use-finance-facture-query';

interface FactureStatsProps {
  variant?: 'grid' | 'row';
}

export function FactureStats({ variant = 'row' }: FactureStatsProps) {
  const { data, isLoading } = useFinanceFactureQuery({
    leadId: null,
    page: 1,
    limit: 10,
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
      icon: typeof ReceiptText;
    }[]
  >(() => {
    const fmt = (value: number) =>
      new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value ?? 0);

    const total = data?.stats.total ?? 0;
    const montantTtcTotal = data?.stats.montantTtcTotal ?? 0;
    const moyen = total > 0 ? montantTtcTotal / total : 0;

    return [
      {
        icon: ReceiptText,
        title: 'À facturer',
        value: total,
        subtitle: 'Propositions acceptées',
      },
      {
        icon: Banknote,
        title: 'Montant TTC cumulé',
        value: fmt(montantTtcTotal),
        subtitle: 'Sur ces dossiers',
      },
      {
        icon: GraduationCap,
        title: 'Avec formation',
        value: data?.stats.avecFormation ?? 0,
        subtitle: 'Rattachées au catalogue',
      },
      {
        icon: Layers,
        title: 'Sans formation',
        value: data?.stats.sansFormation ?? 0,
        subtitle: 'Prestations hors catalogue',
      },
      {
        icon: Calculator,
        title: 'Montant moyen TTC',
        value: total > 0 ? fmt(moyen) : '—',
        subtitle: total > 0 ? `Par dossier (${total})` : 'Aucun dossier à facturer',
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
