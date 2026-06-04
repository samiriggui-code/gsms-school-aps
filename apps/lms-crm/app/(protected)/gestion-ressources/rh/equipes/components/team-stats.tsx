'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Users, LayoutGrid, Activity, UserPlus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ModuleLandingStatGradientCard,
  StatCardMetricLayout,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { apiFetch } from '@/lib/api';

interface TeamStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
  tone: MetricStatTone;
}

interface TeamStatsProps {
  variant?: 'grid' | 'row';
}

export function TeamStats({ variant = 'grid' }: TeamStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: statsResponse, isLoading, error } = useQuery({
    queryKey: ['rh-teams-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/rh/equipes/statistics');
      if (!response.ok) {
        throw new Error('Failed to fetch team stats');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2,
  });

  const gridClasses =
    variant === 'row'
      ? 'grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-8 w-full'
      : 'grid grid-cols-2 md:grid-cols-2 gap-5 lg:gap-8 h-full items-stretch';

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4].map((index) => (
          <Card key={index} className="border-border shadow-none">
            <CardContent className="p-0">
              <StatCardMetricLayout iconSlot={<Skeleton className="size-12 shrink-0 rounded-lg" />}>
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </StatCardMetricLayout>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border border-border rounded-xl bg-background shadow-none">
        <p className="text-sm font-bold text-foreground uppercase tracking-widest mb-2">
          Échec du chargement des statistiques
        </p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 inline-flex items-center justify-center rounded-md text-[10px] font-bold uppercase ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-border hover:bg-muted h-9 px-4"
        >
          Réessayer
        </button>
      </div>
    );
  }

  const statsData = statsResponse?.data;

  const stats: TeamStat[] = [
    {
      icon: LayoutGrid,
      label: 'Équipes Totales',
      value: statsData?.total?.value ?? 0,
      trendValue: 'Structure Globale',
      tone: 'primary',
    },
    {
      icon: Activity,
      label: 'Équipes Actives',
      value: statsData?.active?.value ?? 0,
      trendValue: 'Opérationnelles',
      tone: 'success',
    },
    {
      icon: Users,
      label: 'Membres Totaux',
      value: statsData?.members?.value ?? 0,
      trendValue: 'Effectif RH',
      tone: 'info',
    },
    {
      icon: UserPlus,
      label: 'Taille Moyenne',
      value: statsData?.avgSize?.value ?? 0,
      trendValue: 'Effectif Moyen',
      tone: 'warning',
    },
  ];

  return (
    <div className={gridClasses}>
      {stats.map((stat) => (
        <ModuleLandingStatGradientCard
          key={stat.label}
          icon={stat.icon}
          tone={stat.tone}
          label={stat.label}
          value={stat.value}
          detail={stat.trendValue}
          trend="neutral"
        />
      ))}
    </div>
  );
}
