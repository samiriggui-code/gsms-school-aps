'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/chart';
import type { CohortActivityPayload } from '@/lib/instructor/instructor-types';
import { cn } from '@/lib/utils';

const chartConfig = {
  lessons: {
    label: 'UV terminées',
    color: 'hsl(var(--primary))',
  },
  quizzes: {
    label: 'Quiz réussis',
    color: 'hsl(142 76% 36%)',
  },
} satisfies ChartConfig;

type InstructorDashboardActivityChartProps = {
  activity: CohortActivityPayload | null;
  className?: string;
};

export function InstructorDashboardActivityChart({
  activity,
  className,
}: InstructorDashboardActivityChartProps) {
  const hasActivity =
    activity != null && (activity.totals.lessons > 0 || activity.totals.quizzes > 0);

  return (
    <Card className={cn('flex h-full flex-col border-dashed', className)}>
      <CardHeader className="flex flex-row items-start justify-between gap-3 border-b border-dashed py-3.5">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
            Activité e-formation
          </CardTitle>
          <p className="text-[11px] text-muted-foreground">
            {activity
              ? `${activity.participantCount} stagiaire(s) · ${activity.totals.lessons} UV · ${activity.totals.quizzes} quiz — 30 jours`
              : '30 derniers jours · tous vos stagiaires'}
          </p>
        </div>
        <TrendingUp className="size-4 shrink-0 text-primary" />
      </CardHeader>
      <CardContent className="flex flex-1 items-center p-4 pt-5">
        {!activity || !hasActivity ? (
          <div className="flex w-full flex-col items-center justify-center py-10 text-center">
            <div className="mb-2 flex size-9 items-center justify-center rounded-full bg-muted">
              <TrendingUp className="size-4 text-muted-foreground" />
            </div>
            <p className="text-[12px] font-medium text-muted-foreground">
              Aucune activité LMS sur les 30 derniers jours
            </p>
            <p className="mt-1 max-w-xs text-[11px] text-muted-foreground/80">
              Les UV terminées et quiz réussis par vos stagiaires apparaîtront ici.
            </p>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-[2.2/1] max-h-[240px] w-full">
            <AreaChart
              data={activity.series}
              margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
            >
              <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/40" />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={6}
                interval="preserveStartEnd"
                minTickGap={40}
                className="text-[10px]"
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tickMargin={4}
                width={24}
                className="text-[10px]"
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Area
                type="monotone"
                dataKey="lessons"
                stackId="a"
                stroke="var(--color-lessons)"
                fill="var(--color-lessons)"
                fillOpacity={0.28}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="quizzes"
                stackId="a"
                stroke="var(--color-quizzes)"
                fill="var(--color-quizzes)"
                fillOpacity={0.32}
                strokeWidth={2}
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
