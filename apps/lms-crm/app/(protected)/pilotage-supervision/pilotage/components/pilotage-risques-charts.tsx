'use client';

import { Card, CardContent, CardHeader, CardHeading, CardTitle, CardToolbar } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, Tooltip, XAxis, YAxis } from 'recharts';
import type { PilotageRisquesPayload } from '@repo/api-core';
import { PILOTAGE_CHART_COLORS } from '@/lib/pilotage/chart-colors';

const distributionConfig = {
  s0: { label: 'Série 1', color: PILOTAGE_CHART_COLORS[0] },
  s1: { label: 'Série 2', color: PILOTAGE_CHART_COLORS[1] },
  s2: { label: 'Série 3', color: PILOTAGE_CHART_COLORS[2] },
} satisfies ChartConfig;

type Props = {
  charts: PilotageRisquesPayload['charts'];
};

export function PilotageRisquesCharts({ charts }: Props) {
  const evolution = charts.evolution.map((p) => ({ label: p.label, value: p.value }));
  const evolutionConfig = {
    value: { label: charts.evolutionSeriesName, color: PILOTAGE_CHART_COLORS[1] },
  } satisfies ChartConfig;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-3 lg:gap-8">
      <Card className="lg:col-span-2">
        <CardHeader className="border-b border-border pb-4">
          <CardHeading>
            <CardTitle className="text-base">{charts.evolutionTitle}</CardTitle>
            <p className="text-xs font-normal text-muted-foreground">{charts.evolutionSeriesName}</p>
          </CardHeading>
          <CardToolbar>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
              <TrendingUp className="size-3.5" />
              Projection 30 j
            </div>
          </CardToolbar>
        </CardHeader>
        <CardContent className="pt-4">
          <ChartContainer config={evolutionConfig} className="aspect-auto h-[260px] w-full">
            <AreaChart data={evolution} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="riskAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--border)" strokeOpacity={0.6} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
              <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} width={36} />
              <ChartTooltip />
              <Area
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                fill="url(#riskAreaGrad)"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="border-b border-border pb-4">
          <CardTitle className="text-base">{charts.distributionTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4 pt-4">
          <ChartContainer config={distributionConfig} className="aspect-auto h-[220px] w-full">
            <PieChart>
              <Pie
                data={charts.distribution}
                dataKey="value"
                nameKey="name"
                innerRadius="58%"
                outerRadius="82%"
                paddingAngle={2}
                stroke="none"
              >
                {charts.distribution.map((_, i) => (
                  <Cell key={i} fill={PILOTAGE_CHART_COLORS[i % PILOTAGE_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ChartContainer>
          <div className="flex w-full flex-wrap justify-center gap-2">
            {charts.distribution.map((item, i) => (
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
  );
}
