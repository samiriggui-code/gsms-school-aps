'use client';

import { Fragment } from 'react';
import { toAbsoluteUrl } from '@/lib/helpers';
import { Card, CardContent } from '@repo/ui/card';
import { LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { StatCardMetricLayout } from '@/components/common/stat-card-metric-layout';

export interface StatCardItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'primary' | 'success' | 'warning' | 'info' | 'destructive' | 'secondary';
  color?: string; // Fallback
  bg?: string;    // Fallback
}

interface StatsCardProps {
  stats: StatCardItem[];
  /**
   * Nombre de colonnes sur desktop
   * @default 5
   */
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const variantStyles = {
  primary: { color: 'text-primary', bg: 'bg-primary/10' },
  success: { color: 'text-success', bg: 'bg-success/10' },
  warning: { color: 'text-warning', bg: 'bg-warning/10' },
  info: { color: 'text-info', bg: 'bg-info/10' },
  destructive: { color: 'text-destructive', bg: 'bg-destructive/10' },
  secondary: { color: 'text-muted-foreground', bg: 'bg-muted' },
};

export function StatsCard({ stats, columns = 5, className }: StatsCardProps) {
  const gridColsClass = {
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    5: 'lg:grid-cols-5',
    6: 'lg:grid-cols-6',
  }[columns];

  return (
    <Fragment>
      <style>
        {`
          .stats-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2.png')}');
          }
          .dark .stats-card-bg {
            background-image: url('${toAbsoluteUrl('/media/images/2600x1600/bg-2-dark.png')}');
          }
        `}
      </style>

      <div className={cn("grid grid-cols-2 md:grid-cols-3 gap-5 lg:gap-8", gridColsClass, className)}>
        {stats.map((stat) => {
          const style = stat.variant ? variantStyles[stat.variant] : { color: stat.color, bg: stat.bg };
          
          return (
            <Card key={stat.label} className="group hover:scale-[1.02] transition-all duration-300 border-border shadow-none">
              <CardContent className="p-0 h-full min-h-[120px] bg-cover rtl:bg-[left_top_-1.7rem] bg-[right_top_-1.7rem] bg-no-repeat stats-card-bg">
                <StatCardMetricLayout
                  iconSlot={
                    <div
                      className={cn(
                        'rounded-lg border border-border/50 p-3 transition-colors duration-200 group-hover:bg-foreground/5',
                        style.bg,
                      )}
                    >
                      <stat.icon className={cn('size-6', style.color)} />
                    </div>
                  }
                >
                  <span className="text-2xl font-bold transition-colors group-hover:text-foreground">{stat.value}</span>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</span>
                  {stat.trendValue ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium leading-none text-foreground/50">
                      {stat.trend === 'up' ? '↑' : stat.trend === 'down' ? '↓' : '•'} {stat.trendValue}
                    </span>
                  ) : null}
                </StatCardMetricLayout>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Fragment>
  );
}