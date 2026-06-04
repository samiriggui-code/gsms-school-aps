'use client';

import { Fragment, type ComponentType, type ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { sectionStatCardToneClasses } from '@/lib/section-stat-card-styles';
import {
  SECTION_STATS_CARD_BG_CLASS,
  SECTION_STATS_CARD_BG_STYLE,
} from '@/lib/section-stats-card-bg';

type StatCardMetricLayoutProps = {
  /** Pastille + icône Lucide (déjà enveloppée si besoin). */
  iconSlot: ReactNode;
  children: ReactNode;
  className?: string;
};

export type MetricStatTone = 'primary' | 'success' | 'destructive' | 'info' | 'warning';

export type ModuleLandingStatTrend = 'up' | 'down' | 'neutral';

const KPI_GRID_LG_COLS: Record<1 | 2 | 3 | 4 | 5, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
  5: 'lg:grid-cols-5',
};

const KPI_GRID_BASE =
  'grid w-full grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-4 lg:gap-4 h-full items-stretch';

/** Grille KPI alignée sur le **nombre réel** de cartes (évite une 5e colonne vide). */
export function kpiStatsGridClass(itemCount: number): string {
  const n = Math.min(Math.max(itemCount, 1), 5) as 1 | 2 | 3 | 4 | 5;
  return cn(KPI_GRID_BASE, KPI_GRID_LG_COLS[n]);
}

/**
 * Grille 5 colonnes pour les bandeaux KPI des **pages de section** (ex. Profil, Structure, Documents, Collaborateurs).
 * Préférer `kpiStatsGridClass(n)` si le nombre de cartes peut varier (pages workspace, CRUD, tickets…).
 */
export const MODULE_LANDING_STATS_GRID_ROW = kpiStatsGridClass(5);

/** Nombre standard de cartes KPI sur les pages module / workspace (aligné Profil compagnie). */
export const MODULE_PAGE_KPI_COUNT = 5;

/** Halo + pastille icône pour les cartes KPI des pages de section (aligné sur Profil / Structure). */
export const SECTION_KPI_CARD_ACCENTS = [
  { orb: 'bg-sky-500/10', box: 'bg-sky-500/15 border-sky-500/25', icon: 'text-sky-600 dark:text-sky-400' },
  { orb: 'bg-emerald-500/10', box: 'bg-emerald-500/15 border-emerald-500/25', icon: 'text-emerald-600 dark:text-emerald-400' },
  { orb: 'bg-amber-500/10', box: 'bg-amber-500/15 border-amber-500/25', icon: 'text-amber-600 dark:text-amber-400' },
  { orb: 'bg-violet-500/10', box: 'bg-violet-500/15 border-violet-500/25', icon: 'text-violet-600 dark:text-violet-400' },
  { orb: 'bg-rose-500/10', box: 'bg-rose-500/15 border-rose-500/25', icon: 'text-rose-600 dark:text-rose-400' },
] as const;

/** Pastille d’icône colorée (même système que les KPI section / `sectionStatCardToneClasses`). */
export function MetricStatCardIconSlot({
  icon: Icon,
  tone,
  iconClassName = 'size-6',
}: {
  icon: ComponentType<{ className?: string }>;
  tone: MetricStatTone;
  iconClassName?: string;
}) {
  const t = sectionStatCardToneClasses(tone);
  return (
    <div
      className={cn(
        'rounded-lg border p-3 transition-colors duration-200 group-hover:bg-foreground/5',
        t.wrap,
      )}
    >
      <Icon className={cn(iconClassName, t.icon)} />
    </div>
  );
}

export function metricStatTrendTextClass(trend: 'up' | 'down' | 'neutral'): string {
  if (trend === 'up') return 'text-success';
  if (trend === 'down') return 'text-destructive';
  return 'text-muted-foreground';
}

/** Styles globaux du motif hexagonal (une fois par page section). */
export function SectionStatsCardBackgroundStyles() {
  return <style>{SECTION_STATS_CARD_BG_STYLE}</style>;
}

/**
 * Carte KPI des atterrissages **section** : motif hexagonal + pastille icône colorée.
 */
export function SectionLandingHexStatCard({
  icon,
  tone,
  label,
  value,
  detail,
  trend = 'neutral',
}: {
  icon: ComponentType<{ className?: string }>;
  tone: MetricStatTone;
  label: string;
  value: string | number;
  detail: string;
  trend?: ModuleLandingStatTrend;
}) {
  const trendColored = trend === 'up' || trend === 'down';
  return (
    <Card className="group border-border shadow-none transition-all duration-300 hover:scale-[1.02]">
      <CardContent
        className={cn(
          'h-full min-h-[120px] bg-cover bg-no-repeat p-0 rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem]',
          SECTION_STATS_CARD_BG_CLASS,
        )}
      >
        <StatCardMetricLayout iconSlot={<MetricStatCardIconSlot icon={icon} tone={tone} />}>
          <span className="text-2xl font-bold transition-colors group-hover:text-foreground">
            {value}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            {label}
          </span>
          <span
            className={cn(
              'flex items-center gap-1 text-[10px] font-medium leading-none',
              trendColored ? metricStatTrendTextClass(trend) : 'text-foreground/50',
            )}
          >
            {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : '• '}
            {detail}
          </span>
        </StatCardMetricLayout>
      </CardContent>
    </Card>
  );
}

/**
 * Mise en page commune des cartes « KPI » : icône à gauche (LTR), chiffres / libellé / tendance à droite.
 * À réutiliser partout pour éviter les empilements verticaux incohérents.
 */
export function StatCardMetricLayout({ iconSlot, children, className }: StatCardMetricLayoutProps) {
  return (
    <div
      className={cn(
        'flex min-h-[112px] flex-row items-start gap-3 px-4 py-4 lg:min-h-[120px] lg:gap-4 lg:px-5 lg:py-5',
        className,
      )}
    >
      <div className="shrink-0 pt-0.5">{iconSlot}</div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">{children}</div>
    </div>
  );
}

/**
 * Carte KPI « page module » : même gabarit que Compagnie (dégradé, pastille icône, libellé haut / valeur / détail).
 */
export function ModuleLandingStatGradientCard({
  icon,
  tone,
  label,
  value,
  detail,
  trend = 'neutral',
}: {
  icon: ComponentType<{ className?: string }>;
  tone: MetricStatTone;
  label: string;
  value: string | number;
  detail: string;
  trend?: ModuleLandingStatTrend;
}) {
  const trendColored = trend === 'up' || trend === 'down';
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30">
      <div className="absolute -end-8 -top-8 size-24 rounded-full bg-primary/5" aria-hidden />
      <StatCardMetricLayout
        className="relative z-10 min-h-0 bg-transparent !px-4 !py-4"
        iconSlot={<MetricStatCardIconSlot icon={icon} tone={tone} iconClassName="size-5" />}
      >
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-2xl font-semibold text-foreground">{value}</p>
        <p
          className={cn(
            'text-xs font-medium',
            trendColored ? metricStatTrendTextClass(trend) : 'text-muted-foreground',
          )}
        >
          {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
          {detail}
        </p>
      </StatCardMetricLayout>
    </div>
  );
}
