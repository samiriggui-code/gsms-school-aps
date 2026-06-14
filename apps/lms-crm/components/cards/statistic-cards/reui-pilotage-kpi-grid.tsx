'use client';

import type { LucideIcon } from 'lucide-react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/** Données KPI branchées sur les layouts REUI statistic-card-1 / statistic-card-7 */
export type ReuiPilotageKpiItem = {
  title: string;
  value: string | number;
  subtitle?: string;
  delta?: number;
  positive?: boolean;
  icon?: LucideIcon;
  valueClassName?: string;
};

type Props = {
  items: ReuiPilotageKpiItem[];
  /** card1 = grille @reui/statistic-card-1, card7 = badges colorés @reui/statistic-card-7 */
  variant?: 'card1' | 'card7';
  className?: string;
};

const COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-2 lg:grid-cols-3',
  4: 'sm:grid-cols-2 lg:grid-cols-4',
  5: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
};

function Card1Item({ stat }: { stat: ReuiPilotageKpiItem }) {
  return (
    <Card>
      <CardHeader className="border-0 pb-0">
        <CardTitle className="text-muted-foreground text-sm font-medium">{stat.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-2xl font-medium text-foreground tracking-tight tabular-nums">{stat.value}</span>
          {stat.delta != null ? (
            <Badge variant={stat.positive !== false ? 'success' : 'destructive'} appearance="light">
              {stat.delta > 0 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
              {Math.abs(stat.delta)}%
            </Badge>
          ) : null}
        </div>
        {stat.subtitle ? (
          <p className="text-xs text-muted-foreground border-t pt-2.5">{stat.subtitle}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const CARD7_ACCENTS = [
  { value: 'text-green-600', badge: 'bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400' },
  { value: 'text-blue-600', badge: 'bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400' },
  { value: 'text-amber-600', badge: 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400' },
  { value: 'text-violet-600', badge: 'bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400' },
  { value: 'text-red-500', badge: 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' },
];

function Card7Item({ stat, index }: { stat: ReuiPilotageKpiItem; index: number }) {
  const accent = CARD7_ACCENTS[index % CARD7_ACCENTS.length];
  const Icon = stat.icon;
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
          {stat.subtitle ? <p className="text-xs text-muted-foreground">{stat.subtitle}</p> : null}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className={cn('text-2xl font-bold tabular-nums', stat.valueClassName ?? accent.value)}>
            {stat.value}
          </span>
          {stat.delta != null ? (
            <Badge className={cn('gap-1 font-semibold', accent.badge)} appearance="light">
              {Icon ? <Icon className="size-3.5" /> : null}
              {stat.delta > 0 ? '+' : ''}
              {stat.delta}%
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

/** Bandeau KPI pilotage — layouts REUI (sans wrapper demo min-h-screen). */
export function ReuiPilotageKpiGrid({ items, variant = 'card1', className }: Props) {
  if (items.length === 0) return null;

  const colClass = COLS[Math.min(5, Math.max(1, items.length))] ?? COLS[5];

  return (
    <div className={cn('grid grid-cols-1 gap-4 lg:gap-6', colClass, className)}>
      {items.map((item, i) =>
        variant === 'card7' ? (
          <Card7Item key={item.title} stat={item} index={i} />
        ) : (
          <Card1Item key={item.title} stat={item} />
        ),
      )}
    </div>
  );
}
