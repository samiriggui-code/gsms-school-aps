'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Activity,
  Bell,
  CalendarRange,
  CheckCircle2,
  Clock,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { MODULE_LANDING_STATS_GRID_ROW } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { fetchPilotageLanding } from '@/lib/pilotage/api';
import type { PilotageLandingPayload, PilotagePeriod } from '@repo/api-core';
import { PilotagePageIntro } from './pilotage-page-intro';
import { PilotageModuleHubGrid } from './pilotage-module-hub-grid';
import { PILOTAGE_PAGE_INTRO } from '@/lib/pilotage/page-copy';
import { PILOTAGE_CHART_COLORS } from '@/lib/pilotage/chart-colors';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const KPI_ICONS = [Bell, Users, CalendarRange, ShieldAlert, ShieldCheck];
const FLUX_PERIODS = ['5D', '2W', '1M', '6M', '1Y'] as const;
const ACTIVITY_PERIODS: { key: PilotagePeriod; label: string }[] = [
  { key: 'day', label: 'Jour' },
  { key: 'week', label: 'Semaine' },
  { key: 'month', label: 'Mois' },
  { key: 'year', label: 'Année' },
];

function VarianceCard({ card }: { card: PilotageLandingPayload['variance'][0] }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-5 p-5">
        <div>
          <h3 className="text-base font-semibold">{card.title}</h3>
          <p className="text-sm text-muted-foreground">{card.metric}</p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums">{card.baseValue}</p>
            <p className="text-xs text-muted-foreground">{card.baseLabel}</p>
          </div>
          <div className="relative h-14 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={card.data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <ReferenceLine y={0} stroke="var(--border)" strokeDasharray="3 3" />
                <Tooltip cursor={{ stroke: card.color, strokeWidth: 1, strokeDasharray: '2 2' }} />
                <Line type="monotone" dataKey="value" stroke={card.color} strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tabular-nums">{card.targetValue}</p>
            <p className="text-xs text-muted-foreground">{card.targetLabel}</p>
          </div>
        </div>
        <p className={cn('text-xs font-semibold uppercase', card.isPositive ? 'text-emerald-600' : 'text-amber-600')}>
          {card.change}
        </p>
      </CardContent>
    </Card>
  );
}

export function PilotageLandingDashboard() {
  const intro = PILOTAGE_PAGE_INTRO.pilotage;
  const [fluxPeriod, setFluxPeriod] = useState<(typeof FLUX_PERIODS)[number]>('5D');
  const [activityPeriod, setActivityPeriod] = useState<PilotagePeriod>('day');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pilotage-landing'],
    queryFn: fetchPilotageLanding,
    refetchInterval: 60_000,
  });

  const kpiCards = useMemo(() => {
    if (!data?.kpis?.length) return [];
    return data.kpis.map((kpi, i) => ({
      label: kpi.label,
      value: kpi.value,
      subtitle: kpi.subtitle,
      icon: KPI_ICONS[i % KPI_ICONS.length],
    }));
  }, [data?.kpis]);

  const fluxData = data?.flux.byPeriod[fluxPeriod] ?? [];
  const fluxTotal = fluxData.reduce((s, p) => s + p.value, 0);
  const fluxConfig = {
    value: { label: data?.flux.seriesName ?? 'Événements', color: 'var(--color-violet-500)' },
  } satisfies ChartConfig;

  const activityData = data?.activity.byPeriod[activityPeriod] ?? [];
  const activityConfig = {
    value: { label: data?.activity.seriesName ?? 'Activité', color: PILOTAGE_CHART_COLORS[3] },
  } satisfies ChartConfig;

  const evolutionConfig = useMemo(() => {
    if (!data?.evolution.series) return {} as ChartConfig;
    return Object.fromEntries(
      data.evolution.series.map((s) => [s.key, { label: s.name, color: s.color }]),
    ) satisfies ChartConfig;
  }, [data?.evolution.series]);

  if (isLoading) {
    return (
      <div className="space-y-5 lg:space-y-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-20 rounded-xl" />
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-xl" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-5 pb-8 lg:space-y-8">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" size="sm" disabled={isFetching} onClick={() => refetch()}>
          <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
          Actualiser
        </Button>
      </div>

      <ModuleKpiStatsRow items={kpiCards} />
      <PilotagePageIntro lead={intro.lead} detail={intro.detail} />

      <PilotageModuleHubGrid sparklines={data.sparklines} />

      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">Analytique transversale</h2>
        <p className="text-sm text-muted-foreground">Évolution, flux et variance consolidés sur l&apos;ensemble du CRM.</p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        {/* REUI line-chart-9 — évolution multi-séries */}
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardHeading>
              <CardTitle className="text-base">{data.evolution.title}</CardTitle>
              <p className="text-xs font-normal text-muted-foreground">Candidatures · Sessions · Alertes</p>
            </CardHeading>
            <CardToolbar>
              <div className="flex items-center gap-1.5 text-sm">
                <span className="text-2xl font-bold tabular-nums">{data.evolution.headline.value}</span>
                <span className={cn('flex items-center gap-0.5 text-xs font-medium', data.evolution.headline.deltaPositive ? 'text-emerald-600' : 'text-amber-600')}>
                  {data.evolution.headline.deltaPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {data.evolution.headline.delta}
                </span>
              </div>
            </CardToolbar>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={evolutionConfig} className="aspect-auto h-[300px] w-full">
              <LineChart data={data.evolution.points} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={36} />
                <ChartTooltip />
                {data.evolution.series.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    stroke={`var(--color-${s.key})`}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Donut signaux */}
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.signals.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <div className="relative h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.signals.distribution}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="58%"
                    outerRadius="82%"
                    paddingAngle={2}
                    stroke="none"
                  >
                    {data.signals.distribution.map((_, i) => (
                      <Cell key={i} fill={PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-muted-foreground">Signaux</span>
                <span className="text-2xl font-bold tabular-nums">{data.signals.total}</span>
              </div>
            </div>
            <div className="flex w-full flex-wrap justify-center gap-2">
              {data.signals.distribution.map((item, i) => (
                <span key={item.name} className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase text-muted-foreground">
                  <span className="size-2 rounded-full" style={{ backgroundColor: PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length] }} />
                  {item.name}
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-primary">{item.value}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* REUI line-chart-3 — flux événements */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">{data.flux.title}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {fluxTotal.toLocaleString('fr-FR')} {data.flux.totalLabel} — période {fluxPeriod}
            </p>
          </div>
          <ToggleGroup
            type="single"
            value={fluxPeriod}
            variant="outline"
            onValueChange={(v) => v && setFluxPeriod(v as (typeof FLUX_PERIODS)[number])}
          >
            {FLUX_PERIODS.map((p) => (
              <ToggleGroupItem key={p} value={p} className="text-xs">
                {p}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardHeader>
        <CardContent className="pt-5">
          <ChartContainer config={fluxConfig} className="h-[280px] w-full">
            <LineChart data={fluxData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-border/60" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="value" stroke="var(--color-value)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* REUI area-chart-4 — activité + stats */}
      <Card className="rounded-2xl">
        <CardHeader className="flex flex-col gap-4 border-0 py-6 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-xl font-semibold">{data.activity.title}</CardTitle>
          <ToggleGroup
            type="single"
            value={activityPeriod}
            variant="outline"
            onValueChange={(v) => v && setActivityPeriod(v as PilotagePeriod)}
          >
            {ACTIVITY_PERIODS.map((p) => (
              <ToggleGroupItem key={p.key} value={p.key}>
                {p.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardHeader>
        <CardContent className="space-y-6">
          <ChartContainer config={activityConfig} className="h-[260px] w-full">
            <AreaChart data={activityData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="activityGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} className="stroke-border/60" />
              <XAxis dataKey="period" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={36} />
              <ChartTooltip />
              <Area type="monotone" dataKey="value" stroke="var(--color-value)" fill="url(#activityGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ChartContainer>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.activity.stats.map((stat) => (
              <div key={stat.id} className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
                <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {stat.id === 'today' ? <Clock className="size-3.5" /> : stat.id === 'success' ? <CheckCircle2 className="size-3.5" /> : <Activity className="size-3.5" />}
                  {stat.label}
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">{stat.value}</p>
                <p className={cn('text-xs font-medium', stat.changeType === 'positive' ? 'text-emerald-600' : 'text-amber-600')}>
                  {stat.change}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* REUI line-chart-8 — variance par module */}
      <div className="grid grid-cols-1 gap-4 @3xl:grid-cols-3 md:grid-cols-3 lg:gap-6">
        {data.variance.map((card) => (
          <VarianceCard key={card.key} card={card} />
        ))}
      </div>
    </div>
  );
}
