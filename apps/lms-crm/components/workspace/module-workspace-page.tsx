'use client';

import { useMemo, useState, type ReactNode } from 'react';
import { RefreshCw, Search } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching, refetch } = useModuleWorkspaceQuery({
    viewKey,
    page,
    q: search,
  });

  const totalPages = useMemo(() => {
    const total = data?.pagination.total ?? 0;
    const limit = data?.pagination.limit ?? 15;
    return Math.max(1, Math.ceil(total / limit));
  }, [data?.pagination.limit, data?.pagination.total]);

  const onSearch = () => {
    setPage(1);
    setSearch(q.trim());
  };

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

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b border-border/60 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('crud.consolidatedData')}</h3>
              {data?.footnote ? (
                <p className="text-xs text-muted-foreground">
                  {t(`workspace.${viewKey}.footnote`, { defaultValue: data.footnote })}
                </p>
              ) : null}
            </div>
            <div className="flex w-full max-w-md items-center gap-2">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && onSearch()}
                  placeholder={t('crud.search')}
                  className="pl-9"
                />
              </div>
              <Button type="button" variant="secondary" onClick={onSearch}>
                {t('crud.filter')}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b border-border/70 bg-muted/30">
                    {(data?.columns ?? []).map((col) => (
                      <th
                        key={col.key}
                        className={cn(
                          'px-4 py-3 font-medium text-muted-foreground',
                          col.align === 'right' ? 'text-right' : 'text-left',
                        )}
                      >
                        {workspaceColumnLabel(t, viewKey, col.key, col.label)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-border/50">
                        <td colSpan={Math.max(data?.columns.length ?? 4, 4)} className="px-4 py-4">
                          <Skeleton className="h-4 w-full" />
                        </td>
                      </tr>
                    ))
                  ) : (data?.rows.length ?? 0) === 0 ? (
                    <tr>
                      <td
                        colSpan={Math.max(data?.columns.length ?? 1, 1)}
                        className="px-4 py-10 text-center text-muted-foreground"
                      >
                        {t('crud.emptyView')}
                      </td>
                    </tr>
                  ) : (
                    data!.rows.map((row, idx) => (
                      <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                        {data!.columns.map((col) => (
                          <td
                            key={col.key}
                            className={cn(
                              'px-4 py-3 text-foreground',
                              col.align === 'right' ? 'text-right' : 'text-left',
                            )}
                          >
                            {row[col.key] ?? '—'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {(data?.pagination.total ?? 0) > (data?.pagination.limit ?? 15) ? (
              <div className="flex items-center justify-between border-t border-border/60 px-4 py-3">
                <p className="text-xs text-muted-foreground">
                  {t('crud.pageWithCount', {
                    page,
                    total: totalPages,
                    count: data?.pagination.total ?? 0,
                  })}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    {t('crud.previous')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    {t('crud.nextFull')}
                  </Button>
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
        {afterContent}
      </Container>

    </>
  );
}
