'use client';

import { useMemo, useState } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Activity, DoorOpen, RefreshCw, ShieldCheck, Users, Wrench } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { Card, CardContent } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import { Container } from '@/components/common/container';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { MODULE_LANDING_STATS_GRID_ROW } from '@/components/common/stat-card-metric-layout';
import {
  Toolbar,
  ToolbarActions,
  ToolbarDescription,
  ToolbarHeading,
  ToolbarTitle,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { PILOTAGE_PAGE_INTRO } from '@/lib/pilotage/page-copy';
import { cn } from '@/lib/utils';
import type { PilotageModuleId, PilotagePeriod } from '@/lib/pilotage/modules';
import { fetchPilotageIndicateurs } from '@/lib/pilotage/api';
import { PilotageModuleTabs, pilotageApiModuleId } from './pilotage-module-tabs';
import { PilotagePeriodSelector } from './pilotage-period-selector';
import { PilotageIndicateursDashboard } from './pilotage-indicateurs-dashboard';
import { PilotagePageIntro } from './pilotage-page-intro';

const KPI_ICONS = [Users, ShieldCheck, Wrench, DoorOpen, Activity];

export function PilotageIndicateursContent() {
  const { title, description } = usePageToolbarMeta('/qualiopi/pilotage/indicateurs');
  const intro = PILOTAGE_PAGE_INTRO.indicateurs;
  const [moduleId, setModuleId] = useState<PilotageModuleId>('all');
  const [period, setPeriod] = useState<PilotagePeriod>('month');

  const apiModule = pilotageApiModuleId(moduleId);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['pilotage-indicateurs', apiModule, period],
    queryFn: () => fetchPilotageIndicateurs(apiModule, period),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const kpiCards = useMemo(() => {
    if (!data?.kpis?.length) return [];
    return data.kpis.map((kpi, i) => ({
      label: kpi.label,
      value: kpi.value,
      subtitle: kpi.subtitle,
      icon: KPI_ICONS[i % KPI_ICONS.length],
    }));
  }, [data?.kpis]);

  const unavailable = data && 'available' in data && data.available === false;

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <PilotagePeriodSelector value={period} onChange={setPeriod} />
            <Button variant="outline" disabled={isFetching} onClick={() => refetch()}>
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              Actualiser
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        {isLoading ? (
          <div className={MODULE_LANDING_STATS_GRID_ROW}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        ) : (
          <ModuleKpiStatsRow items={kpiCards} />
        )}

        <PilotageModuleTabs value={moduleId} onChange={setModuleId} />

        <PilotagePageIntro lead={intro.lead} detail={intro.detail} />

        {unavailable ? (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              {(data as { message?: string }).message ?? 'Module non disponible — sélectionnez Gestion ressources.'}
            </CardContent>
          </Card>
        ) : data?.charts ? (
          <PilotageIndicateursDashboard data={data} />
        ) : isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Skeleton className="h-72 rounded-xl" />
            <Skeleton className="h-72 rounded-xl" />
          </div>
        ) : null}
      </Container>
    </>
  );
}
