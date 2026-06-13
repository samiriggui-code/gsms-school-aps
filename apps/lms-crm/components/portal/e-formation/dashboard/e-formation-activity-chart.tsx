'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Loader2, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_ACTIVITY_API } from '@/lib/portal/e-formation-paths';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted } from '@/components/portal/layout/portal-ui';

type ActivityPoint = {
  date: string;
  label: string;
  lessons: number;
  quizzes: number;
};

type ActivityPayload = {
  days: number;
  series: ActivityPoint[];
  totals: { lessons: number; quizzes: number };
};

const chartConfig = {
  lessons: {
    label: 'Leçons terminées',
    color: 'hsl(var(--primary))',
  },
  quizzes: {
    label: 'Quiz réussis',
    color: 'hsl(142 76% 36%)',
  },
} satisfies ChartConfig;

export function EFormationActivityChart({ className }: { className?: string }) {
  const [data, setData] = useState<ActivityPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(E_FORMATION_ACTIVITY_API);
        const json = (await res.json()) as { success?: boolean; data?: ActivityPayload };
        if (!cancelled && res.ok && json.success && json.data) {
          setData(json.data);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasActivity =
    data != null && (data.totals.lessons > 0 || data.totals.quizzes > 0);

  return (
    <PortalSection
      title="Activité des 30 derniers jours"
      icon={TrendingUp}
      description={
        data
          ? `${data.totals.lessons} leçon(s) · ${data.totals.quizzes} quiz réussi(s)`
          : undefined
      }
      className={className}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-[13px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </div>
      ) : !data || !hasActivity ? (
        <p className={portalMuted}>
          Aucune activité enregistrée sur les 30 derniers jours. Commencez une leçon pour
          voir votre courbe de progression.
        </p>
      ) : (
        <ChartContainer config={chartConfig} className="aspect-[16/9] max-h-[280px] w-full">
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
      )}
    </PortalSection>
  );
}
