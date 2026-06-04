'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Users, ShieldCheck, Calendar, AlertTriangle } from 'lucide-react';
import { useSectionHubStats } from '@/hooks/use-section-hub-stats';

type CmsStatsApi = {
  totalCollaborators?: number;
  activeCollaborators?: number;
  absentCollaborators?: number;
  complianceRate?: number;
  complianceIssues?: number;
};

interface CmsStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendValue: string;
  color: MetricStatTone;
}

export function CmsStats() {
  const { data: statsApi = {} } = useSectionHubStats('cms', 12);
  const total = statsApi.totalCollaborators ?? 0;
  const active = statsApi.activeCollaborators ?? 0;
  const absences = statsApi.absentCollaborators ?? 0;
  const complianceRate = statsApi.complianceRate ?? 0;
  const alerts = statsApi.complianceIssues ?? 0;

  const stats: CmsStat[] = [
    {
      icon: Users,
      label: 'Effectif Actif',
      value: String(active),
      trend: 'neutral',
      trendValue: `${total}`,
      color: 'primary',
    },
    {
      icon: ShieldCheck,
      label: 'Conformité',
      value: `${complianceRate}%`,
      trend: 'neutral',
      trendValue: `${alerts}`,
      color: 'success',
    },
    {
      icon: Calendar,
      label: 'Absences',
      value: String(absences),
      trend: 'neutral',
      trendValue: `${total}`,
      color: 'warning',
    },
    {
      icon: AlertTriangle,
      label: 'Alertes',
      value: String(alerts),
      trend: 'neutral',
      trendValue: `${complianceRate}%`,
      color: 'destructive',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 md:grid-cols-2 lg:gap-8 h-full items-stretch">
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
