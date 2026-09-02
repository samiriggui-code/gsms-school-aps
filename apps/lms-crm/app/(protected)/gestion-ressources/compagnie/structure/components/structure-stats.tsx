'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@repo/ui/card';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { Users, UserCheck, AlertTriangle, FileWarning, FileX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';

interface StructureStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

interface StructureStatsProps {
  variant?: 'grid' | 'row';
}

export function StructureStats({ variant = 'grid' }: StructureStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: statsResponse, isLoading, error } = useQuery({
    queryKey: ['compagnie-structure-stats'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/tenant/profile/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch structure stats');
      }
      return response.json();
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 h-full items-stretch';

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} className="border border-border/70 shadow-none">
            <CardContent className="p-4">
              <Skeleton className="h-8 w-8 rounded-lg mb-3" />
              <Skeleton className="h-7 w-16 mb-2" />
              <Skeleton className="h-3 w-28" />
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
  const expiredDocs = statsData?.expiredDocumentsCount ?? 0;

  const stats: StructureStat[] = [
    {
      icon: Users,
      label: 'Unités d\'Organisation',
      value: statsData?.totalOrgUnits ?? 0,
      trendValue: 'Structure Interne',
    },
    {
      icon: UserCheck,
      label: 'Collaborateurs',
      value: statsData?.totalCollaborators ?? 0,
      trendValue: 'Effectif Global',
    },
    {
      icon: AlertTriangle,
      label: 'Alertes Conformité',
      value: statsData?.complianceIssues ?? 0,
      trendValue: statsData?.complianceIssues > 0 ? `${statsData.complianceIssues} Points à vérifier` : 'Tout est OK',
    },
    {
      icon: FileWarning,
      label: 'Documents à jour',
      value: statsData?.validDocumentsCount ?? 0,
      trendValue: 'Fiches conformes enregistrées',
    },
    {
      icon: FileX,
      label: 'Documents expirés',
      value: expiredDocs,
      trendValue: expiredDocs > 0 ? 'À régulariser' : 'Aucun document expiré',
    },
  ];

  return (
    <div className={gridClasses}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
        return (
          <div
            key={stat.label}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-semibold text-foreground mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{stat.trendValue}</p>
              </div>
              <div
                className={cn(
                  'size-10 shrink-0 rounded-lg flex items-center justify-center border',
                  accent.box,
                )}
              >
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
