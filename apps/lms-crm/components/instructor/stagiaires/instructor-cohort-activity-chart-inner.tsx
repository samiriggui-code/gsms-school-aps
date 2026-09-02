'use client';

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import type { CohortActivityPayload } from '@/lib/instructor/instructor-types';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@repo/ui/chart';

const chartConfig = {
  lessons: {
    label: 'UV terminées (cohorte)',
    color: 'hsl(var(--primary))',
  },
  quizzes: {
    label: 'Quiz réussis (cohorte)',
    color: 'hsl(142 76% 36%)',
  },
} satisfies ChartConfig;

export function InstructorCohortActivityChartInner({ data }: { data: CohortActivityPayload }) {
  return (
    <ChartContainer config={chartConfig} className="aspect-[16/9] max-h-[260px] w-full">
      <AreaChart data={data.series} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-border/50" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={32}
          className="text-[10px]"
        />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          width={28}
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
          fillOpacity={0.35}
        />
        <Area
          type="monotone"
          dataKey="quizzes"
          stackId="a"
          stroke="var(--color-quizzes)"
          fill="var(--color-quizzes)"
          fillOpacity={0.4}
        />
      </AreaChart>
    </ChartContainer>
  );
}
