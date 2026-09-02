'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { PaginationState } from '@tanstack/react-table';
import { RefreshCw, Search } from 'lucide-react';
import type { ModuleWorkspaceViewKey } from '@repo/api-core';
import { Container } from '@/components/common/container';
import {
  ConfigurableListDataGrid,
  type ConfigurableListColumn,
} from '@/components/common/configurable-list-datagrid';
import {
  createModuleLandingPagination,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Card, CardHeader } from '@repo/ui/card';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  MODULE_PAGE_KPI_COUNT,
  SECTION_KPI_CARD_ACCENTS,
} from '@/components/common/stat-card-metric-layout';
import { MODULE_WORKSPACE_PAGE_META } from '@/config/module-workspace-pages';
import { useModuleWorkspaceQuery } from '@/hooks/use-module-workspace-query';
import { useTranslation } from '@/hooks/useTranslation';
import { workspaceColumnLabel, workspaceStatLabel } from '@/lib/workspace-labels';

type Props = {
  viewKey: ModuleWorkspaceViewKey;
  /** Entre la toolbar et les KPI (ex. bouton export). */
  beforeContent?: ReactNode;
  /** Graphiques hub entre KPI et tableau consolidé. */
  charts?: ReactNode;
  /** Contenu sous le tableau (ex. exports CSV sur Rapports). */
  afterContent?: ReactNode;
};

export function ModuleWorkspacePage({ viewKey, beforeContent, charts, afterContent }: Props) {
  const { t } = useTranslation();
  const fallback = MODULE_WORKSPACE_PAGE_META[viewKey];
  const title = t(`workspace.${viewKey}.title`, { defaultValue: fallback.title });
  const description = t(`workspace.${viewKey}.description`, { defaultValue: fallback.description });
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data, isLoading, isFetching, refetch } = useModuleWorkspaceQuery({
    viewKey,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    q: search,
  });

  const gridColumns = useMemo<ConfigurableListColumn[]>(() => {
    const cols = data?.columns ?? [];
    return cols.map((col) => ({
      key: col.key,
      label: workspaceColumnLabel(t, viewKey, col.key, col.label),
      align: col.align,
    }));
  }, [data?.columns, t, viewKey]);

  const rows = useMemo(
    () => (data?.rows ?? []) as Record<string, unknown>[],
    [data?.rows],
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              type="button"
              disabled={isFetching}
              onClick={() => refetch()}
            >
              <RefreshCw className={cn('size-4', isFetching && 'animate-spin')} />
              {t('crud.refresh')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      {beforeContent}

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {(data?.kpis ?? Array.from({ length: MODULE_PAGE_KPI_COUNT })).map((stat, index) => {
            const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
            if (isLoading || !stat || typeof stat !== 'object' || !('label' in stat)) {
              return <Skeleton key={index} className="h-24 w-full rounded-xl" />;
            }
            const statKey = 'key' in stat && typeof stat.key === 'string' ? stat.key : String(index);
            const statParams =
              viewKey === 'finance-budget' && statKey === 'total'
                ? { year: String(new Date().getFullYear()) }
                : undefined;
            const label = workspaceStatLabel(t, viewKey, statKey, 'label', statParams, stat.label);
            const subtitle =
              stat.subtitle ?
                workspaceStatLabel(t, viewKey, statKey, 'subtitle', statParams, stat.subtitle)
              : null;
            return (
              <div
                key={statKey}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{stat.value}</p>
                {subtitle ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{subtitle}</p>
                ) : null}
              </div>
            );
          })}
        </div>

        {charts ? (
          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-8">{charts}</div>
        ) : null}

        <ConfigurableListDataGrid
          columns={gridColumns}
          rows={rows}
          recordCount={data?.pagination.total ?? 0}
          isLoading={isLoading}
          emptyMessage={t('crud.emptyView')}
          pagination={pagination}
          onPaginationChange={setPagination}
          header={{
            title: t('crud.consolidatedData'),
            subtitle: data?.footnote
              ? t(`workspace.${viewKey}.footnote`, { defaultValue: data.footnote })
              : undefined,
          }}
          toolbar={
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-end">
                <div className="flex w-full max-w-md items-center gap-2 sm:ms-auto">
                  <div className="relative flex-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setSearch(q.trim());
                          setPagination((p) => ({ ...p, pageIndex: 0 }));
                        }
                      }}
                      placeholder={t('crud.search')}
                      className="pl-9"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setSearch(q.trim());
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    {t('crud.filter')}
                  </Button>
                </div>
              </CardHeader>
            </Card>
          }
        />
        {afterContent}
      </Container>

    </>
  );
}
