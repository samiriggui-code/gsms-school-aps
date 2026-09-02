'use client';

import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardHeading, CardTitle, CardToolbar } from '@repo/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@repo/ui/chart';
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { PilotageIndicateursPayload } from '@repo/api-core';
import { PILOTAGE_CHART_COLORS } from '@/lib/pilotage/chart-colors';
import { cn } from '@/lib/utils';

type Props = {
  data: PilotageIndicateursPayload;
};

function MiniSparkline({ id, points, color }: { id: string; points: { value: number }[]; color: string }) {
  const gradId = `pilotage-spark-${id}`;
  return (
    <div className="h-14 w-full min-w-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#${gradId})`} strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const distributionConfig = {
  s0: { label: 'Série 1', color: PILOTAGE_CHART_COLORS[0] },
  s1: { label: 'Série 2', color: PILOTAGE_CHART_COLORS[1] },
  s2: { label: 'Série 3', color: PILOTAGE_CHART_COLORS[2] },
  s3: { label: 'Série 4', color: PILOTAGE_CHART_COLORS[3] },
  s4: { label: 'Série 5', color: PILOTAGE_CHART_COLORS[4] },
} satisfies ChartConfig;

export function PilotageIndicateursDashboard({ data }: Props) {
  const evolution = data.charts.evolution.map((p) => ({ label: p.label, value: p.value }));
  const distribution = data.charts.distribution;
  const secondary = data.charts.secondaryDistribution ?? [];

  const evolutionConfig = {
    value: { label: data.charts.evolutionSeriesName, color: PILOTAGE_CHART_COLORS[0] },
  } satisfies ChartConfig;

  const moduleCards = [
    {
      id: 'rh',
      title: 'RH & conformité',
      period: data.period,
      value: data.kpis.find((k) => k.key === 'collaborators')?.value ?? '—',
      subtitle: data.kpis.find((k) => k.key === 'conformite')?.subtitle ?? '',
      color: 'var(--color-emerald-500)',
      spark: evolution.slice(-8).map((p) => ({ value: p.value })),
    },
    {
      id: 'equip',
      title: 'Équipements',
      period: data.period,
      value: data.kpis.find((k) => k.key === 'equipmentHs')?.value ?? '—',
      subtitle: 'Matériel hors service',
      color: 'var(--color-amber-500)',
      spark: evolution.map((p, i) => ({ value: Math.max(0, p.value - i) })),
    },
    {
      id: 'salles',
      title: 'Salles',
      period: data.period,
      value: data.kpis.find((k) => k.key === 'rooms')?.value ?? '—',
      subtitle: data.kpis.find((k) => k.key === 'rooms')?.subtitle ?? '',
      color: 'var(--color-violet-500)',
      spark: evolution.slice(-6).map((p) => ({ value: p.value })),
    },
  ];

  return (
    <div className="space-y-5 lg:space-y-8">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:gap-6">
        {moduleCards.map((card) => (
          <Card key={card.title} className="overflow-hidden">
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="text-sm font-semibold text-foreground">{card.title}</p>
                <p className="text-xs text-muted-foreground capitalize">{card.period}</p>
              </div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-2xl font-bold tabular-nums">{card.value}</p>
                  <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                </div>
                <MiniSparkline id={card.id} points={card.spark} color={card.color} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
        <Card className="lg:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <CardHeading>
              <CardTitle className="text-base">{data.charts.evolutionTitle}</CardTitle>
              <p className="text-xs font-normal text-muted-foreground">{data.charts.evolutionSeriesName}</p>
            </CardHeading>
            <CardToolbar>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="size-3.5" />
                Temps réel
              </div>
            </CardToolbar>
          </CardHeader>
          <CardContent className="pt-4">
            <ChartContainer config={evolutionConfig} className="aspect-auto h-[280px] w-full">
              <LineChart data={evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                  width={36}
                />
                <ChartTooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--color-value)"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 4, fill: 'var(--color-value)' }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.charts.distributionTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4 pt-4">
            <ChartContainer config={distributionConfig} className="aspect-auto h-[220px] w-full">
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="58%"
                  outerRadius="82%"
                  paddingAngle={2}
                  stroke="none"
                >
                  {distribution.map((_, i) => (
                    <Cell key={i} fill={PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
            <div className="flex w-full flex-wrap justify-center gap-2">
              {distribution.map((item, i) => (
                <span key={item.name} className="inline-flex items-center gap-1.5 text-2xs font-semibold uppercase text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length] }}
                  />
                  {item.name}
                  <span className="rounded border border-border bg-background px-1.5 py-0.5 text-primary">{item.value}</span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {secondary.length > 0 ? (
        <Card>
          <CardHeader className="border-b border-border pb-4">
            <CardTitle className="text-base">{data.charts.secondaryDistributionTitle ?? 'Charge opérationnelle'}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4 sm:grid-cols-3">
            {secondary.map((item, i) => (
              <div
                key={item.name}
                className={cn(
                  'rounded-xl border border-border/70 bg-gradient-to-br from-background to-muted/20 px-4 py-3',
                )}
              >
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.name}</p>
                <p
                  className="mt-1 text-2xl font-bold tabular-nums"
                  style={{ color: PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length] }}
                >
                  {item.value}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
