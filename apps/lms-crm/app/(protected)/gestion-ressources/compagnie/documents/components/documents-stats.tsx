'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { FileCheck, Clock, AlertCircle, FileStack, FileX } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { DossierAdministratifResponse } from './dossier-types';

interface DocumentStat {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  trendValue: string;
}

interface DocumentsStatsProps {
  variant?: 'grid' | 'row';
}

/** Même clé que `DocumentsList` : une seule requête partagée (React Query). */
export function DocumentsStats({ variant = 'grid' }: DocumentsStatsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ['dossier-administratif'],
    queryFn: async () => {
      const response = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif');
      if (!response.ok) throw new Error('fetch');
      const json = await response.json();
      return unwrapSectionApiData<DossierAdministratifResponse>(json);
    },
    staleTime: 1000 * 60,
  });

  const gridClasses =
    variant === 'row'
      ? MODULE_LANDING_STATS_GRID_ROW
      : 'grid h-full grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5 items-stretch';

  if (!mounted || isLoading) {
    return (
      <div className={gridClasses}>
        {[1, 2, 3, 4, 5].map((index) => (
          <Card key={index} className="border border-border/70 shadow-none">
            <CardContent className="p-4">
              <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
              <Skeleton className="mb-2 h-7 w-16" />
              <Skeleton className="h-3 w-28" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background p-8 text-center shadow-none">
        <p className="mb-2 text-sm font-bold uppercase tracking-widest text-foreground">
          Échec du chargement des statistiques
        </p>
      </div>
    );
  }

  const s = data?.summary;
  const totalSlots = s?.totalSlots ?? 0;
  const withFile = s?.withFile ?? 0;
  const expiringSoon = s?.expiringSoon ?? 0;
  const expired = s?.expired ?? 0;
  const withoutFile = Math.max(0, totalSlots - withFile);

  const stats: DocumentStat[] = [
    {
      icon: FileStack,
      label: 'Total documents',
      value: totalSlots,
      trendValue: 'Emplacements dossier administratif',
    },
    {
      icon: FileCheck,
      label: 'Documents validés',
      value: withFile,
      trendValue: 'Fichier joint sur la fiche',
    },
    {
      icon: Clock,
      label: 'À renouveler',
      value: expiringSoon,
      trendValue: 'Échéance ≤ 60 j.',
    },
    {
      icon: AlertCircle,
      label: 'Documents expirés',
      value: expired,
      trendValue: expired > 0 ? 'Action requise' : 'Aucun expiré',
    },
    {
      icon: FileX,
      label: 'Sans fichier',
      value: withoutFile,
      trendValue: withoutFile > 0 ? 'Fiche sans pièce jointe' : 'Toutes les fiches complétées',
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
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stat.trendValue}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
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
