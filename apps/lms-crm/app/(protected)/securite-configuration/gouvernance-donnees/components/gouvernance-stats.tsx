'use client';

import {
  ModuleLandingStatGradientCard,
  type MetricStatTone,
} from '@/components/common/stat-card-metric-layout';
import { Archive, FileText, FolderOpen, HardDrive, Inbox } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@repo/ui/skeleton';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type DashboardStats = {
  filesActive: number;
  filesArchived: number;
  filesTrashed: number;
  volumeMb: number;
  entityDossiers: number;
  openDemandes: number;
  missingDocumentsDemandes: number;
};

type DashboardResponse = {
  stats: DashboardStats;
};

const STAT_CONFIG: {
  key: keyof DashboardStats;
  label: string;
  detail: string;
  icon: React.ComponentType<{ className?: string }>;
  color: MetricStatTone;
}[] = [
  {
    key: 'filesActive',
    label: 'Fichiers actifs',
    detail: 'Coffre documentaire',
    icon: FileText,
    color: 'primary',
  },
  {
    key: 'volumeMb',
    label: 'Volume stocké',
    detail: 'MinIO / S3 (Mo)',
    icon: HardDrive,
    color: 'info',
  },
  {
    key: 'openDemandes',
    label: 'Demandes ouvertes',
    detail: 'Dossiers candidats',
    icon: Inbox,
    color: 'warning',
  },
  {
    key: 'missingDocumentsDemandes',
    label: 'Pièces manquantes',
    detail: 'À relancer',
    icon: FolderOpen,
    color: 'destructive',
  },
];

export function GouvernanceStats() {
  const { data, isLoading } = useQuery({
    queryKey: ['gouvernance-dashboard'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/dashboard',
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error('Dashboard load failed');
      return unwrapSectionApiData<DashboardResponse>(json);
    },
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-2 gap-5 lg:gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="grid h-full grid-cols-2 items-stretch gap-5 lg:gap-8">
      {STAT_CONFIG.map((item) => {
        const value =
          item.key === 'volumeMb'
            ? `${stats?.volumeMb ?? 0} Mo`
            : String(stats?.[item.key] ?? 0);
        return (
          <ModuleLandingStatGradientCard
            key={item.key}
            icon={item.icon}
            tone={item.color}
            label={item.label}
            value={value}
            detail={item.detail}
            trend="neutral"
          />
        );
      })}
      {stats && stats.filesArchived + stats.filesTrashed > 0 ? (
        <div className="col-span-2 flex items-center gap-2 rounded-lg border border-dashed border-border/70 bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
          <Archive className="size-3.5 shrink-0" />
          {stats.filesArchived} archivé(s) GED · {stats.filesTrashed} en corbeille ·{' '}
          {stats.entityDossiers} dossiers entité
        </div>
      ) : null}
    </div>
  );
}
