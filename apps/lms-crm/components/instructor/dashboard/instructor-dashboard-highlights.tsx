'use client';

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  TrendingDown,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Badge, BadgeDot } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { InstructorDashboardPayload } from '@/lib/instructor/instructor-types';

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarDays,
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
};

type InstructorDashboardHighlightsProps = {
  highlights: InstructorDashboardPayload['highlights'];
};

export function InstructorDashboardHighlights({ highlights }: InstructorDashboardHighlightsProps) {
  return (
    <Card className="h-full min-w-0 w-full overflow-hidden">
      <CardHeader>
        <CardTitle>Synthèse pédagogique</CardTitle>
      </CardHeader>
      <CardContent className="flex min-w-0 flex-col gap-4 p-5 lg:p-8 lg:pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-sm font-normal text-secondary-foreground">
            Progression moyenne e-formation
          </span>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl font-semibold text-mono">
              {highlights.overallProgress}%
            </span>
            {highlights.trend > 0 ? (
              <Badge size="sm" variant="success" appearance="light">
                {highlights.trend}% actifs
              </Badge>
            ) : null}
          </div>
        </div>
        <div className="mb-1.5 grid w-full min-w-0 grid-cols-[9fr_7fr_4fr] gap-1">
          <div className="h-2 min-w-0 rounded-xs bg-blue-500" />
          <div className="h-2 min-w-0 rounded-xs bg-green-500" />
          <div className="h-2 min-w-0 rounded-xs bg-violet-500" />
        </div>
        <div className="mb-1 flex flex-wrap items-center gap-4">
          {highlights.categories.map((item, index) => (
            <div key={index} className="flex items-center gap-1.5">
              <BadgeDot className={item.badgeColor} />
              <span className="text-sm font-normal text-foreground">{item.label}</span>
            </div>
          ))}
        </div>
        <div className="border-b border-input" />
        <div className="grid gap-3">
          {highlights.rows.map((row, index) => {
            const Icon = ICON_MAP[row.icon] ?? CalendarDays;
            return (
              <div
                key={index}
                className="flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-1.5">
                  <Icon className="size-4.5 text-muted-foreground" />
                  <span className="text-sm font-normal text-mono">{row.text}</span>
                </div>
                <div className="flex items-center gap-5 text-sm font-medium text-foreground lg:gap-8">
                  <span className="lg:text-right">
                    {row.total}
                    {row.unit ?? ''}
                  </span>
                  <span className="flex items-center justify-end gap-1">
                    {row.trend === 'up' ? (
                      <TrendingUp className="size-4 text-green-500" />
                    ) : row.trend === 'down' ? (
                      <TrendingDown className="text-destructive size-4" />
                    ) : null}
                    {row.stats > 0 ? `${row.stats}%` : null}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
