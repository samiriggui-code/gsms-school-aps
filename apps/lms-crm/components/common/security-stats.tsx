'use client';

import { Fragment, useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { Skeleton } from '@repo/ui/skeleton';
import {
  SectionLandingHexStatCard,
  SectionStatsCardBackgroundStyles,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { SECTION_LANDING_STATS_GRID_CLASS } from '@/lib/section-stats-card-bg';
import { Shield, Users, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent } from '@repo/ui/card';
import { useTranslation } from '@/hooks/useTranslation';

interface SecurityStatDef {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  detail: string;
  tone: MetricStatTone;
  getValue: (s: DashboardStatsState) => string;
}

type DashboardStatsState = {
  activeSites: number;
  activeAgents: number;
  currentAlerts: number;
  activeClients: number;
  todayInterventions: number;
};

const SecurityStats = () => {
  const { t } = useTranslation();
  const [stats, setStats] = useState<DashboardStatsState>({
    activeSites: 0,
    activeAgents: 0,
    currentAlerts: 0,
    activeClients: 0,
    todayInterventions: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const response = await apiFetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setStats({
            activeSites: data?.sites?.activeSites ?? 0,
            activeAgents: data?.rh?.activeEmployees ?? 0,
            currentAlerts: data?.interventions?.currentAlerts ?? 0,
            activeClients: data?.sites?.activeClients ?? 0,
            todayInterventions: data?.interventions?.todayCourses ?? 0,
          });
        }
      } catch (error) {
        console.error(t('securityStats.loadError'), error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchStats();
  }, []);

  const definitions: SecurityStatDef[] = [
    {
      icon: Shield,
      label: t('securityStats.activeCampus'),
      detail: t('securityStats.activeCampusDetail'),
      tone: 'primary',
      getValue: (s) => String(s.activeSites),
    },
    {
      icon: Users,
      label: t('securityStats.activeTrainers'),
      detail: t('securityStats.activeTrainersDetail'),
      tone: 'success',
      getValue: (s) => String(s.activeAgents),
    },
    {
      icon: AlertTriangle,
      label: t('securityStats.pedagogicalAlerts'),
      detail: t('securityStats.pedagogicalAlertsDetail'),
      tone: 'warning',
      getValue: (s) => String(s.currentAlerts),
    },
    {
      icon: CheckCircle,
      label: t('securityStats.activeLearners'),
      detail: t('securityStats.activeLearnersDetail'),
      tone: 'success',
      getValue: (s) => String(s.activeClients),
    },
    {
      icon: Clock,
      label: t('securityStats.todayCourses'),
      detail: t('securityStats.todayCoursesDetail'),
      tone: 'info',
      getValue: (s) => String(s.todayInterventions),
    },
  ];

  if (isLoading) {
    return (
      <div className={SECTION_LANDING_STATS_GRID_CLASS}>
        {Array.from({ length: 5 }, (_, index) => (
          <Card key={`sk-${index}`}>
            <CardContent className="p-0 h-full min-h-[120px]">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-12 shrink-0 rounded-lg" />}>
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-16" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Fragment>
      <SectionStatsCardBackgroundStyles />
      <div className={`${SECTION_LANDING_STATS_GRID_CLASS} h-full items-stretch`}>
        {definitions.map((def) => (
          <SectionLandingHexStatCard
            key={def.label}
            icon={def.icon}
            tone={def.tone}
            label={def.label}
            value={def.getValue(stats)}
            detail={def.detail}
            trend="neutral"
          />
        ))}
      </div>
    </Fragment>
  );
};

export { SecurityStats };
export type { SecurityStatDef as ISecurityStatsItem };
