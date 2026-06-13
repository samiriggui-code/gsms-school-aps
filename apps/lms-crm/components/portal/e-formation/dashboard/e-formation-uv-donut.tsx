'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Target } from 'lucide-react';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalLabel, portalMuted } from '@/components/portal/layout/portal-ui';
import { cn } from '@/lib/utils';

export type UvProgressBreakdown = {
  total: number;
  completed: number;
  inProgress: number;
  locked: number;
};

const COLORS = {
  completed: 'hsl(var(--primary))',
  inProgress: 'hsl(38 92% 50%)',
  locked: 'hsl(var(--muted-foreground) / 0.35)',
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-[12px] shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">{item.value} UV</p>
    </div>
  );
}

export function EFormationUvDonut({
  breakdown,
  className,
}: {
  breakdown: UvProgressBreakdown;
  className?: string;
}) {
  const chartData = [
    { name: 'Terminées', value: breakdown.completed, fill: COLORS.completed },
    { name: 'En cours', value: breakdown.inProgress, fill: COLORS.inProgress },
    { name: 'Verrouillées', value: breakdown.locked, fill: COLORS.locked },
  ].filter((d) => d.value > 0);

  const empty = breakdown.total === 0;

  return (
    <PortalSection title="Progression UV" icon={Target} className={className}>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:gap-6">
        <div className="relative h-[180px] w-[180px] shrink-0">
          {empty ? (
            <div className="flex size-full items-center justify-center rounded-full border border-dashed text-[13px] text-muted-foreground">
              —
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={
                      chartData.length
                        ? chartData
                        : [{ name: '—', value: 1, fill: COLORS.locked }]
                    }
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {(chartData.length ? chartData : [{ fill: COLORS.locked }]).map(
                      (entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ),
                    )}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{breakdown.completed}</span>
                <span className="text-[10px] text-muted-foreground">/ {breakdown.total} UV</span>
              </div>
            </>
          )}
        </div>

        <ul className="w-full space-y-2 text-[13px] sm:flex-1">
          {[
            { label: 'Terminées', value: breakdown.completed, color: COLORS.completed },
            { label: 'En cours', value: breakdown.inProgress, color: COLORS.inProgress },
            { label: 'Verrouillées', value: breakdown.locked, color: COLORS.locked },
          ].map((row) => (
            <li key={row.label} className="flex items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ backgroundColor: row.color }} />
                {row.label}
              </span>
              <span className="font-semibold tabular-nums">{row.value}</span>
            </li>
          ))}
        </ul>
      </div>
    </PortalSection>
  );
}

export function EFormationUvKpiRow({
  breakdown,
  className,
}: {
  breakdown: UvProgressBreakdown;
  className?: string;
}) {
  const items = [
    { label: 'UV du parcours', value: breakdown.total, hint: 'Unités de valeur' },
    { label: 'UV terminées', value: breakdown.completed, hint: 'Leçons validées' },
    { label: 'UV en cours', value: breakdown.inProgress, hint: 'Accessibles, non terminées' },
  ];

  return (
    <div className={cn('grid gap-3 sm:grid-cols-3', className)}>
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-xl border bg-card px-4 py-3.5 text-center shadow-xs"
        >
          <p className={portalLabel}>{item.label}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums tracking-tight">{item.value}</p>
          <p className={cn('mt-0.5', portalMuted)}>{item.hint}</p>
        </article>
      ))}
    </div>
  );
}
