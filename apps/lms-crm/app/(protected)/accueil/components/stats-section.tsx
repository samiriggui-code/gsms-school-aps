'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Loader2 } from 'lucide-react';
import { useDashboardStats } from '@/lib/hooks/use-dashboard-stats-generic';

interface StatItemProps {
  title: string;
  value: string | number;
  subtitle: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatItem = ({ title, value, subtitle, trend, trendValue }: Omit<StatItemProps, 'color'>) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="size-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="size-4 text-red-500" />;
      case 'neutral':
        return <span className="text-blue-500 font-bold size-4 flex items-center justify-center text-lg leading-none">•</span>;
      default:
        return null;
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600 bg-green-50 dark:bg-green-950/20 dark:text-green-400';
      case 'down':
        return 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400';
      case 'neutral':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
      default:
        return '';
    }
  };

  return (
    <div className="text-center group">
      <div className="text-4xl font-bold text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors mb-2">
        {value}
      </div>
      <p className="text-foreground font-medium mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-2">{subtitle}</p>
      {trend && trendValue && (
        <Badge variant="secondary" className={`${getTrendColor()} border-0`}>
          {getTrendIcon()}
          <span className="ml-1">{trendValue}</span>
        </Badge>
      )}
    </div>
  );
};

export const StatsSection = () => {
  const { data: statsResponse, isLoading } = useDashboardStats('dashboard');
  const statsData = statsResponse?.data;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const stats = [
    {
      title: 'Utilisateurs',
      value: statsData?.administration?.totalUsers || 0,
      subtitle: 'Présents dans le tenant',
      trend: 'neutral' as const,
      trendValue: '0'
    },
    {
      title: 'Sites actifs',
      value: statsData?.sites?.activeSites || 0,
      subtitle: 'Sous surveillance',
      trend: 'neutral' as const,
      trendValue: '0'
    },
    {
      title: 'Agents',
      value: statsData?.rh?.activeEmployees || 0,
      subtitle: 'Effectif total',
      trend: 'neutral' as const,
      trendValue: '0'
    },
    {
      title: 'Clients',
      value: statsData?.sites?.activeClients || 0,
      subtitle: 'Actifs',
      trend: 'neutral' as const,
      trendValue: '0'
    }
  ];

  return (
    <Card>
      <CardContent className="p-8">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground hover:text-blue-600 dark:hover:text-blue-400 transition-colors mb-2">
            Vue d'ensemble GSMS
          </h2>
          <p className="text-muted-foreground">
            Indicateurs clés de performance en temps réel
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8">
          {stats.map((stat, index) => (
            <StatItem
              key={index}
              title={stat.title}
              value={stat.value}
              subtitle={stat.subtitle}
              trend={stat.trend}
              trendValue={stat.trendValue}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
