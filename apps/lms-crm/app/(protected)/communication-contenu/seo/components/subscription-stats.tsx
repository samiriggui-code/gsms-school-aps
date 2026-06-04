'use client';

import { Users, GraduationCap, UserX, Wallet } from 'lucide-react';
import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';

interface SubscriptionStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: MetricStatTone;
}

const stats: SubscriptionStat[] = [
  {
    icon: Users,
    label: 'Collaborateurs',
    value: '0',
    trend: 'neutral',
    trendValue: '0',
    color: 'primary',
  },
  {
    icon: GraduationCap,
    label: 'Formations en Cours',
    value: '0',
    trend: 'neutral',
    trendValue: '0',
    color: 'success',
  },
  {
    icon: UserX,
    label: 'Absences',
    value: '0',
    trend: 'neutral',
    trendValue: '0',
    color: 'warning',
  },
  {
    icon: Wallet,
    label: 'Masse Salariale',
    value: '0',
    trend: 'neutral',
    trendValue: '0',
    color: 'info',
  },
];

export function SubscriptionStats() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 h-full items-stretch">
      {stats.map((stat) => (
        <ModuleLandingStatGradientCard
          key={stat.label}
          icon={stat.icon}
          tone={stat.color}
          label={stat.label}
          value={stat.value}
          detail={stat.trendValue}
          trend={stat.trend}
        />
      ))}
    </div>
  );
}
