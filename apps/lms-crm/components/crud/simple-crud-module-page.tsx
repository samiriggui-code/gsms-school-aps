'use client';

import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { PaginationState } from '@tanstack/react-table';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/dialog';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import {
  workspaceColumnLabel,
  workspaceFieldLabel,
  workspaceStatLabel,
} from '@/lib/workspace-labels';

export type CrudField = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'number' | 'select';
  options?: { value: string; label: string }[];
  required?: boolean;
  defaultValue?: string | number;
};

export type CrudColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
  format?: (value: unknown, row: Record<string, unknown>) => string;
};

export type SimpleCrudModuleProps = {
  /** Loads title, description, columns, stats and fields from workspace.* i18n keys. */
  workspaceKey: string;
  title?: string;
  description?: string;
  i18nParams?: Record<string, string | number>;
  apiPath: string;
  queryKey: string;
  columns: CrudColumn[];
  statLabels: { key: string; label: string; subtitle?: string }[];
  createFields: CrudField[];
  extraQueryParams?: Record<string, string>;
  rowActions?: (row: Record<string, unknown>, refresh: () => void) => React.ReactNode;
  canDelete?: boolean;
};

type ListResponse = {
  stats: Record<string, number | string>;
  items: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
};

export function SimpleCrudModulePage({
  workspaceKey,
  title: titleProp,
  description: descriptionProp,
  i18nParams,
  apiPath,
  queryKey,
  columns,
  statLabels,
  createFields,
  extraQueryParams,
  rowActions,
  canDelete = true,
}: SimpleCrudModuleProps) {
  const { t } = useTranslation();
  const { title: routeTitle, description: routeDescription } = usePageToolbarMeta();
  const title =
    titleProp ??
    t(`workspace.${workspaceKey}.title`, { defaultValue: routeTitle });
  const description =
    descriptionProp ??
    t(`workspace.${workspaceKey}.pageDescription`, {
      ...i18nParams,
      defaultValue: t(`workspace.${workspaceKey}.description`, {
        defaultValue: routeDescription,
      }),
    });
  const qc = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    for (const f of createFields) {
      init[f.name] = String(f.defaultValue ?? '');
    }
    return init;
  });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [queryKey, pagination.pageIndex, pagination.pageSize, search, extraQueryParams] as const,
    queryFn: async (): Promise<ListResponse | undefined> => {
      const sp = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
      });
      if (search.trim()) sp.set('q', search.trim());
      if (extraQueryParams) {
        for (const [k, v] of Object.entries(extraQueryParams)) sp.set(k, v);
      }
      const res = await apiFetch(`${apiPath}?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? t('pages.settings.common.error'));
      return unwrapSectionApiData<ListResponse>(json);
    },
    staleTime: 30_000,
  });

  const gridColumns = useMemo<ConfigurableListColumn[]>(
    () =>
      columns.map((col) => ({
        key: col.key,
        label: workspaceColumnLabel(t, workspaceKey, col.key, col.label),
        align: col.align,
        format: (value, row) => {
          if (col.format) return col.format(value, row);
          if (value == null) return '—';
          if (typeof value === 'boolean') return value ? t('crud.yes') : t('crud.no');
          return String(value);
        },
      })),
    [columns, t, workspaceKey],
  );

  function refresh() {
    qc.invalidateQueries({ queryKey: [queryKey] });
  }

  async function createRow() {
    const body: Record<string, unknown> = {};
    for (const f of createFields) {
      const raw = form[f.name] ?? '';
      if (f.required && !String(raw).trim()) {
        toast.error(
          t('crud.fieldRequired', {
            field: workspaceFieldLabel(t, workspaceKey, f.name, f.label),
          }),
        );
        return;
      }
      if (f.type === 'number') body[f.name] = Number(raw) || 0;
      else body[f.name] = raw;
    }

    const res = await apiFetch(apiPath, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error((json as { error?: { message?: string } }).error?.message ?? t('crud.createFailed'));
      return;
    }
    toast.success(t('crud.created'));
    setOpenCreate(false);
    const reset: Record<string, string> = {};
    for (const f of createFields) reset[f.name] = String(f.defaultValue ?? '');
    setForm(reset);
    refresh();
  }

  async function deleteRow(id: string) {
    if (!confirm(t('crud.deleteConfirm'))) return;
    const res = await apiFetch(`${apiPath}/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      toast.error(t('crud.deleteFailed'));
      return;
    }
    toast.success(t('crud.deleted'));
    refresh();
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
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {t('crud.refresh')}
            </Button>
            <Button onClick={() => setOpenCreate(true)}>
              <Plus className="size-4" />
              {t('crud.add')}
            </Button>
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {statLabels.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            const val = data?.stats[s.key];
            return (
              <div
                key={s.key}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {workspaceStatLabel(t, workspaceKey, s.key, 'label', i18nParams, s.label)}
                </p>
                <p className="mt-1 text-2xl font-semibold">{val ?? '—'}</p>
                {s.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {workspaceStatLabel(t, workspaceKey, s.key, 'subtitle', i18nParams, s.subtitle)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <ConfigurableListDataGrid
          columns={gridColumns}
          rows={data?.items ?? []}
          recordCount={data?.pagination.total ?? 0}
          isLoading={isLoading}
          emptyMessage={t('crud.empty')}
          pagination={pagination}
          onPaginationChange={setPagination}
          renderActions={
            rowActions || canDelete
              ? (row) => (
                  <>
                    {rowActions?.(row, refresh)}
                    {canDelete && (
                      <Button size="sm" variant="ghost" onClick={() => deleteRow(String(row.id))}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    )}
                  </>
                )
              : undefined
          }
          toolbar={
            <Card className="border-border shadow-none">
              <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-end">
                <div className="flex max-w-md flex-1 gap-2 sm:ms-auto">
                  <Input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder={t('crud.search')}
                    className="flex-1"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch(q);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                  >
                    <Search className="size-4" />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          }
        />
      </Container>

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t('crud.createTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            {createFields.map((f) => (
              <div key={f.name}>
                <Label>{workspaceFieldLabel(t, workspaceKey, f.name, f.label)}</Label>
                {f.type === 'textarea' ? (
                  <Textarea
                    value={form[f.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    rows={3}
                  />
                ) : f.type === 'select' && f.options ? (
                  <Select value={form[f.name] ?? ''} onValueChange={(v) => setForm({ ...form, [f.name]: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {f.options.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : 'text'}
                    value={form[f.name] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenCreate(false)}>
              {t('common.buttons.cancel')}
            </Button>
            <Button onClick={createRow}>{t('crud.create')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
