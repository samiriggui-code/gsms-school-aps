'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui/card';
import type { InstructorChartSlice } from '@/lib/instructor/instructor-types';
import { cn } from '@/lib/utils';

type InstructorSessionsDonutProps = {
  slices: InstructorChartSlice[];
  className?: string;
};

function DonutTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { fill: string } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-[12px] shadow-md">
      <p className="font-medium">{item.name}</p>
      <p className="text-muted-foreground">{item.value} session{item.value > 1 ? 's' : ''}</p>
    </div>
  );
}

export function InstructorSessionsDonut({ slices, className }: InstructorSessionsDonutProps) {
  const total = slices.reduce((sum, item) => sum + item.value, 0);
  const empty = total === 0;

  const chartData = slices.map((item) => ({
    name: item.name,
    value: item.value,
    fill: item.color,
  }));

  return (
    <Card className={cn('flex h-full flex-col border-dashed', className)}>
      <CardHeader className="border-b border-dashed py-3.5">
        <CardTitle className="text-sm font-bold uppercase tracking-wide text-foreground">
          Répartition des sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col items-center justify-center gap-5 p-5">
        <div className="relative mx-auto h-[148px] w-[148px] shrink-0">
          {empty ? (
            <div className="flex size-full items-center justify-center rounded-full border border-dashed text-[12px] text-muted-foreground">
              Aucune session
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={54}
                    outerRadius={68}
                    paddingAngle={4}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={<DonutTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-bold tabular-nums leading-none">{total}</span>
                <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Sessions
                </span>
              </div>
            </>
          )}
        </div>

        {!empty ? (
          <ul className="grid w-full gap-2 sm:grid-cols-2">
            {chartData.map((row) => (
              <li
                key={row.name}
                className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-2.5 py-1.5"
              >
                <span className="flex min-w-0 items-center gap-2 text-[11px] text-muted-foreground">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.fill }}
                  />
                  <span className="truncate">{row.name}</span>
                </span>
                <span className="shrink-0 text-[11px] font-bold tabular-nums">{row.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
