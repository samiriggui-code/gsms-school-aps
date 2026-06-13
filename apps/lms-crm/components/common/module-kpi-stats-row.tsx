'use client';

import type { LucideIcon } from 'lucide-react';
import {
  kpiStatsGridClass,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';

export type ModuleKpiStatItem = {
  label: string;
  value: string | number;
  subtitle: string;
  icon: LucideIcon;
};

/** Bandeau KPI notifications / pages module — dégradé, halo, icône coin, 5 colonnes max. */
export function ModuleKpiStatsRow({ items }: { items: ModuleKpiStatItem[] }) {
  if (items.length === 0) return null;

  return (
    <div className={kpiStatsGridClass(items.length)}>
      {items.map((card, i) => {
        const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <Icon className={cn('size-4 shrink-0', accent.icon)} aria-hidden />
            </div>
            <p className="mt-1 text-2xl font-semibold tabular-nums">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </div>
        );
      })}
    </div>
  );
}
