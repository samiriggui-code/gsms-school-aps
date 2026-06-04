'use client';

import { type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import type { ModuleWorkspaceViewKey } from '@repo/api-core';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  MODULE_PAGE_KPI_COUNT,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { MODULE_WORKSPACE_PAGE_META } from '@/config/module-workspace-pages';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceStatLabel } from '@/lib/workspace-labels';
import { PilotageWorkspaceCharts } from './pilotage-workspace-charts';

const PILOTAGE_VIEWS = new Set<ModuleWorkspaceViewKey>([
  'pilotage-alertes',
  'pilotage-indicateurs',
  'pilotage-rapports',
  'pilotage-risques',
]);

type Props = {
  viewKey: ModuleWorkspaceViewKey;
  beforeContent?: ReactNode;
  afterContent?: ReactNode;
};

export function PilotageWorkspacePage({ viewKey, beforeContent, afterContent }: Props) {
  const { t } = useTranslation();
  const fallback = MODULE_WORKSPACE_PAGE_META[viewKey];
  const title = t(`workspace.${viewKey}.title`, { defaultValue: fallback.title });
  const description = t(`workspace.${viewKey}.description`, { defaultValue: fallback.description });

  const { data, isLoading, isFetching, refetch } = useModuleWorkspaceQuery({
    viewKey,
    page: 1,
    limit: 50,
    q: '',
  });

  if (!PILOTAGE_VIEWS.has(viewKey)) {
    return null;
  }

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" type="button" disabled={isFetching} onClick={() => refetch()}>
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              {t('crud.refresh')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      {beforeContent}

      <Container className="space-y-5 pb-8 lg:space-y-7.5">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {(data?.kpis ?? Array.from({ length: MODULE_PAGE_KPI_COUNT })).map((stat, index) => {
            const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
            if (isLoading || !stat || typeof stat !== 'object' || !('label' in stat)) {
              return <Skeleton key={index} className="h-24 w-full rounded-xl" />;
            }
            const statKey = 'key' in stat && typeof stat.key === 'string' ? stat.key : String(index);
            const label = workspaceStatLabel(t, viewKey, statKey, 'label', undefined, stat.label);
            const subtitle =
              stat.subtitle ?
                workspaceStatLabel(t, viewKey, statKey, 'subtitle', undefined, stat.subtitle)
              : null;
            return (
              <div
                key={statKey}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4 shadow-sm"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{stat.value}</p>
                {subtitle ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        <PilotageWorkspaceCharts charts={data?.charts} isLoading={isLoading} />

        {data?.footnote && !isLoading ? (
          <p className="text-center text-xs text-muted-foreground">
            {t(`workspace.${viewKey}.footnote`, { defaultValue: data.footnote })}
          </p>
        ) : null}

        {afterContent}
      </Container>
    </>
  );
}
