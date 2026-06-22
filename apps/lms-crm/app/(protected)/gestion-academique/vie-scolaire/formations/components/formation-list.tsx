'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { CirclePause, CirclePlay, Clock, Eye, LayoutGrid, List, Search, SquarePen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarIndicator, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FormationCatalogProgramSheets } from './catalog/formation-catalog-program-sheets';
import {
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
  type CatalogProgramOpen,
  type FormationParcoursSpecialite,
  type FormationVitrineTrack,
} from '../data/formation-vitrine-catalog';
import { resolveCatalogProgramOpen } from '@/lib/formation/resolve-catalog-program';
import type { FormationCatalogApiRow } from '../types/catalog-api';
import { FormationLogoThumb } from './formation-logo-thumb';
import {
  formationsCatalogQueryRoot,
  type FormationsCatalogScope,
  useFormationsCatalogQuery,
} from '../hooks/use-formations-catalog-query';
import { formationsStatsQueryKey } from '../hooks/use-formations-stats-query';
import { sessionsQueryRoot } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-manager';
import { apiFetch } from '@/lib/api';
import {
  toastFormationActivateCancelled,
  toastFormationActivateSuccess,
  toastFormationError,
  toastFormationSuspendCancelled,
  toastFormationSuspendSuccess,
} from '../utils/formation-catalog-feedback';

/** Ordre identique à la section pricing du landing (`pricing.tsx`). */
const PRICING_TRACK_ORDER: FormationVitrineTrack[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];

type CatalogTrackTab = 'all' | FormationVitrineTrack;

/** Référence stable : évite useMemo/useEffect/table qui repartent à chaque rendu sans données. */
const EMPTY_CATALOG_ROWS: FormationCatalogApiRow[] = [];

const FormationList = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [catalogScope, setCatalogScope] = useState<FormationsCatalogScope>('visible');
  const {
    data: catalogPayload,
    isLoading: catalogLoading,
    error: catalogError,
    refetch: refetchCatalog,
  } = useFormationsCatalogQuery(catalogScope);

  const catalogRows = catalogPayload?.items ?? EMPTY_CATALOG_ROWS;

  const [catalogView, setCatalogView] = useState<'table' | 'grid'>('table');
  const [catalogPagination, setCatalogPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [catalogSorting, setCatalogSorting] = useState<SortingState>([
    { id: 'name', desc: false },
  ]);
  const [catalogRowSelection, setCatalogRowSelection] = useState({});
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogTrackTab, setCatalogTrackTab] = useState<CatalogTrackTab>('all');
  const [catalogParcoursFilter, setCatalogParcoursFilter] = useState<
    FormationParcoursSpecialite | 'all'
  >('all');
  const [activeCatalogProgram, setActiveCatalogProgram] = useState<CatalogProgramOpen | null>(
    null,
  );
  const [selectedFormationItem, setSelectedFormationItem] =
    useState<FormationCatalogApiRow | null>(null);
  const [catalogSheetMode, setCatalogSheetMode] = useState<'view' | 'edit'>('view');
  const [lifecycleDialog, setLifecycleDialog] = useState<
    null | { action: 'suspend' | 'activate'; row: FormationCatalogApiRow }
  >(null);

  const lifecycleMutation = useMutation({
    mutationFn: async (input: { slug: string; catalogStatus: 'ACTIVE' | 'ARCHIVED' }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formations/${encodeURIComponent(input.slug)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ catalogStatus: input.catalogStatus }),
        },
      );
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload?.error?.message ?? 'Mise à jour du statut impossible.');
      }
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
      queryClient.invalidateQueries({ queryKey: formationsStatsQueryKey });
      queryClient.invalidateQueries({ queryKey: [...sessionsQueryRoot] });
    },
  });

  const closeCatalogSheets = useCallback(() => {
    setActiveCatalogProgram(null);
    setSelectedFormationItem(null);
    setCatalogSheetMode('view');
  }, []);
  useEffect(() => {
    setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
    setCatalogRowSelection({});
  }, [catalogTrackTab]);

  useEffect(() => {
    setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
    setCatalogRowSelection({});
    setCatalogSearchQuery('');
  }, [catalogScope]);

  const filteredCatalogRows = useMemo(() => {
    const q = catalogSearchQuery.trim().toLowerCase();
    return catalogRows.filter((row) => {
      if (catalogTrackTab !== 'all' && row.track !== catalogTrackTab) return false;
      if (
        catalogParcoursFilter !== 'all' &&
        row.parcoursSpecialite !== catalogParcoursFilter
      )
        return false;
      if (!q) return true;
      const blob =
        `${row.name} ${row.tag} ${row.duration} ${row.description}`.toLowerCase();
      return blob.includes(q);
    });
  }, [catalogSearchQuery, catalogTrackTab, catalogParcoursFilter, catalogRows]);

  const openCatalogProgram = useCallback(
    (row: FormationCatalogApiRow, mode: 'view' | 'edit' = 'view') => {
      const program =
        resolveCatalogProgramOpen(row) ??
        ({ sheet: 'customer' } as CatalogProgramOpen);
      setSelectedFormationItem(row);
      setCatalogSheetMode(mode);
      setActiveCatalogProgram(program);
    },
    [],
  );

  const confirmLifecycleChange = useCallback(() => {
    if (!lifecycleDialog) return;
    const { action, row } = lifecycleDialog;
    const catalogStatus = action === 'suspend' ? 'ARCHIVED' : 'ACTIVE';
    lifecycleMutation.mutate(
      { slug: row.slug, catalogStatus },
      {
        onSuccess: () => {
          if (action === 'suspend') toastFormationSuspendSuccess(row.name);
          else toastFormationActivateSuccess(row.name);
          setLifecycleDialog(null);
        },
        onError: (err) => toastFormationError((err as Error).message),
      },
    );
  }, [lifecycleDialog, lifecycleMutation]);

  const cancelLifecycleDialog = useCallback(() => {
    if (!lifecycleDialog) return;
    if (lifecycleDialog.action === 'suspend') toastFormationSuspendCancelled();
    else toastFormationActivateCancelled();
    setLifecycleDialog(null);
  }, [lifecycleDialog]);
  const catalogColumns = useMemo<ColumnDef<FormationCatalogApiRow>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 48,
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Formation" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-0 items-start gap-3 py-1">
            <FormationLogoThumb
              name={row.original.name}
              slug={row.original.slug}
              logoUrl={row.original.logoUrl}
              className="size-11 rounded-xl"
              imageClassName="object-cover"
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <button
                type="button"
                className="text-left text-sm font-semibold text-foreground hover:text-primary"
                onClick={() => openCatalogProgram(row.original, 'view')}
              >
                {row.original.name}
              </button>
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {row.original.description}
              </span>
            </div>
          </div>
        ),
        size: 280,
      },
      {
        accessorKey: 'parcoursSpecialite',
        id: 'parcoursSpecialite',
        header: ({ column }) => (
          <DataGridColumnHeader title="Parcours" column={column} />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary" appearance="light" size="sm">
            {FORMATION_PARCOURS_LABELS[row.original.parcoursSpecialite]}
          </Badge>
        ),
        size: 110,
      },
      {
        accessorKey: 'tag',
        id: 'tag',
        header: ({ column }) => <DataGridColumnHeader title="Tag" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">{row.original.tag}</span>
        ),
        size: 130,
      },
      {
        accessorKey: 'duration',
        id: 'duration',
        header: ({ column }) => (
          <DataGridColumnHeader title="Durée indicative" column={column} />
        ),
        cell: ({ row }) => (
          <span className="text-sm font-medium">{row.original.duration}</span>
        ),
        size: 140,
      },
      {
        id: 'priceFrom',
        accessorFn: (row) => row.priceFrom,
        header: ({ column }) => (
          <DataGridColumnHeader title="Prix catalogue" column={column} />
        ),
        cell: ({ row }) => {
          const p = row.original.priceFrom;
          const cur = row.original.currency?.trim() || 'EUR';
          if (p == null || !Number.isFinite(Number(p))) {
            return <span className="text-sm text-muted-foreground">Sur devis</span>;
          }
          try {
            return (
              <span className="text-sm font-medium tabular-nums">
                {new Intl.NumberFormat('fr-FR', {
                  style: 'currency',
                  currency: cur,
                  maximumFractionDigits: 0,
                }).format(Number(p))}
              </span>
            );
          } catch {
            return (
              <span className="text-sm font-medium tabular-nums">
                {Math.round(Number(p))} {cur}
              </span>
            );
          }
        },
        size: 120,
      },
      {
        id: 'actions',
        header: '',
        size: 176,
        cell: ({ row }) => (
          <div className="flex justify-end gap-0.5 pe-2">
            <Button
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Voir la formation"
              onClick={() => openCatalogProgram(row.original, 'view')}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Éditer la formation"
              onClick={() => openCatalogProgram(row.original, 'edit')}
            >
              <SquarePen className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              mode="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Suspendre (retire du catalogue actif)"
              disabled={row.original.status === 'ARCHIVED'}
              onClick={() => setLifecycleDialog({ action: 'suspend', row: row.original })}
            >
              <CirclePause className="size-4" />
            </Button>
            <Button
              variant="ghost"
              mode="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Activer dans le catalogue"
              disabled={row.original.status === 'ACTIVE'}
              onClick={() => setLifecycleDialog({ action: 'activate', row: row.original })}
            >
              <CirclePlay className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [openCatalogProgram],
  );

  const catalogTable = useReactTable({
    columns: catalogColumns,
    data: filteredCatalogRows,
    getRowId: (row) => row.id,
    state: {
      pagination: catalogPagination,
      sorting: catalogSorting,
      rowSelection: catalogRowSelection,
    },
    onRowSelectionChange: setCatalogRowSelection,
    onPaginationChange: setCatalogPagination,
    onSortingChange: setCatalogSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 space-y-1">
              <h3 className="text-base font-semibold text-foreground">Liste des formations</h3>
              <p className="text-xs text-muted-foreground">
                {catalogScope === 'visible' ? (
                  <>
                    Offres actives ou en brouillon. Suspendre retire la formation de cette vue ; les
                    données restent consultables dans « Suspendues ».
                  </>
                ) : (
                  <>
                    Formations suspendues (retirées du catalogue actif). Réactivez-les ici pour les
                    faire réapparaître dans la vue catalogue.
                  </>
                )}
              </p>
            </div>
            <div
              role="tablist"
              aria-label="Portée du catalogue"
              className="flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-muted/50 p-1"
            >
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={catalogScope === 'visible' ? 'secondary' : 'ghost'}
                className="h-8 px-3 text-xs"
                aria-selected={catalogScope === 'visible'}
                onClick={() => setCatalogScope('visible')}
              >
                Au catalogue
              </Button>
              <Button
                type="button"
                role="tab"
                size="sm"
                variant={catalogScope === 'archived' ? 'secondary' : 'ghost'}
                className="h-8 px-3 text-xs"
                aria-selected={catalogScope === 'archived'}
                onClick={() => setCatalogScope('archived')}
              >
                Suspendues
              </Button>
            </div>
          </div>

          {catalogError ? (
            <Alert variant="destructive">
              <AlertTitle>Catalogue indisponible</AlertTitle>
              <AlertDescription className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <span>{(catalogError as Error).message}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => refetchCatalog()}>
                  Réessayer
                </Button>
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('datagrid.search.catalog')}
              value={catalogSearchQuery}
              onChange={(e) => {
                setCatalogSearchQuery(e.target.value);
                setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="h-10 ps-9"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div
              role="tablist"
              aria-label="Filtrer par filière"
              className="flex h-auto min-h-10 w-full min-w-0 flex-wrap justify-start gap-1 rounded-lg border border-border bg-accent p-1 lg:inline-flex lg:w-auto lg:max-w-full"
            >
              <Button
                type="button"
                role="tab"
                aria-selected={catalogTrackTab === 'all'}
                size="sm"
                variant={catalogTrackTab === 'all' ? 'secondary' : 'ghost'}
                className="text-xs sm:text-sm"
                onClick={() => {
                  setCatalogTrackTab('all');
                  setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                Toutes filières
              </Button>
              {PRICING_TRACK_ORDER.map((track) => (
                <Button
                  key={track}
                  type="button"
                  role="tab"
                  aria-selected={catalogTrackTab === track}
                  size="sm"
                  variant={catalogTrackTab === track ? 'secondary' : 'ghost'}
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setCatalogTrackTab(track);
                    setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  {FORMATION_TRACK_LABELS[track]}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end lg:shrink-0">
              <Select
                value={catalogParcoursFilter}
                onValueChange={(v) => {
                  setCatalogParcoursFilter(v as FormationParcoursSpecialite | 'all');
                  setCatalogPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-[200px]">
                  <SelectValue placeholder="Parcours pédagogique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous parcours</SelectItem>
                  {(
                    Object.keys(FORMATION_PARCOURS_LABELS) as FormationParcoursSpecialite[]
                  ).map((p) => (
                    <SelectItem key={p} value={p}>
                      {FORMATION_PARCOURS_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/50 p-1 shadow-sm">
                <Button
                  type="button"
                  variant={catalogView === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setCatalogView('table')}
                >
                  <List className="size-4" />
                  {t('datagrid.listView')}
                </Button>
                <Button
                  type="button"
                  variant={catalogView === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setCatalogView('grid')}
                >
                  <LayoutGrid className="size-4" />
                  {t('datagrid.gridView')}
                </Button>
              </div>
            </div>
          </div>

          {!catalogLoading &&
          catalogRows.length > 0 &&
          filteredCatalogRows.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Aucune formation pour cette filière ou ce parcours ({catalogRows.length} dans le
              catalogue). Changez d&apos;onglet ou du filtre parcours.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      {catalogView === 'table' ? (
        <DataGrid
          table={catalogTable}
          recordCount={filteredCatalogRows.length}
          isLoading={catalogLoading}
          tableLayout={{
            columnsResizable: true,
            columnsPinnable: true,
            columnsMovable: true,
            columnsVisibility: true,
          }}
          tableClassNames={{
            bodyRow: 'transition-colors relative',
          }}
        >
          <Card className="border-border shadow-none">
            <CardTable>
              <ScrollArea>
                <DataGridTable />
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </CardTable>
            <CardFooter className="border-t border-border">
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      ) : (
        <DataGrid
          table={catalogTable}
          recordCount={filteredCatalogRows.length}
          isLoading={catalogLoading}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {catalogTable.getRowModel().rows.map((row) => {
                const f = row.original;
                const selected = row.getIsSelected();
                return (
                  <Card
                    key={f.id}
                    className={cn(
                      'group overflow-hidden border-border shadow-none transition-all duration-300 hover:border-primary/50',
                      selected &&
                        'border-primary ring-1 ring-primary/25 ring-offset-2 ring-offset-background',
                    )}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="relative mb-4 w-full">
                          <div className="relative mx-auto aspect-[4/3] w-full max-w-[280px] overflow-hidden rounded-2xl border-2 border-background shadow-lg">
                            <FormationLogoThumb
                              name={f.name}
                              slug={f.slug}
                              logoUrl={f.logoUrl}
                              className="size-full rounded-none border-0 shadow-none"
                              imageClassName="object-cover"
                            />
                            <AvatarIndicator className="-end-1 -top-1">
                              <AvatarStatus
                                variant="online"
                                className="size-3.5 border-2 border-background"
                              />
                            </AvatarIndicator>
                          </div>
                        </div>

                        <div className="mb-4 space-y-1">
                          <h4
                            role="button"
                            tabIndex={0}
                            className="line-clamp-2 cursor-pointer font-bold text-foreground transition-colors group-hover:text-primary"
                            onClick={() => openCatalogProgram(f, 'view')}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openCatalogProgram(f, 'view');
                              }
                            }}
                          >
                            {f.name}
                          </h4>
                          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="size-3 shrink-0" />
                            <span className="max-w-[220px] truncate">{f.duration}</span>
                          </div>
                        </div>

                        <div className="mb-6 flex flex-wrap justify-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wide text-primary"
                          >
                            {FORMATION_PARCOURS_LABELS[f.parcoursSpecialite]}
                          </Badge>
                          <Badge
                            variant="success"
                            appearance="light"
                            size="sm"
                            className="text-[10px] font-bold uppercase tracking-wide"
                          >
                            {f.tag}
                          </Badge>
                        </div>

                        <div className="flex w-full items-end justify-between gap-3 border-t border-dashed border-border pt-4">
                          <div className="min-w-0 flex flex-col items-start text-start">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                              Fonction
                            </span>
                            <span className="line-clamp-2 text-xs font-medium text-foreground/80">
                              {FORMATION_TRACK_LABELS[f.track]}
                            </span>
                          </div>
                          <div className="flex shrink-0 gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Voir la formation"
                              onClick={() => openCatalogProgram(f, 'view')}
                            >
                              <Eye className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Éditer la formation"
                              onClick={() => openCatalogProgram(f, 'edit')}
                            >
                              <SquarePen className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Suspendre (retire du catalogue actif)"
                              disabled={f.status === 'ARCHIVED'}
                              onClick={() => setLifecycleDialog({ action: 'suspend', row: f })}
                            >
                              <CirclePause className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Activer dans le catalogue"
                              disabled={f.status === 'ACTIVE'}
                              onClick={() => setLifecycleDialog({ action: 'activate', row: f })}
                            >
                              <CirclePlay className="size-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <div className="mt-8 flex justify-center">
              <DataGridPagination />
            </div>
          </DataGrid>
      )}

      <AlertDialog
        open={lifecycleDialog !== null}
        onOpenChange={(open) => {
          if (!open) setLifecycleDialog(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {lifecycleDialog?.action === 'suspend'
                ? 'Suspendre cette formation ?'
                : 'Activer cette formation ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {lifecycleDialog?.action === 'suspend'
                ? `« ${lifecycleDialog.row.name} » sera retirée du catalogue actif (statut archivé). Aucune donnée n’est effacée : vous pourrez la réactiver plus tard.`
                : lifecycleDialog
                  ? `« ${lifecycleDialog.row.name} » repassera visible comme formation active dans le catalogue.`
                  : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" onClick={cancelLifecycleDialog}>
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction
              variant={lifecycleDialog?.action === 'suspend' ? 'destructive' : 'primary'}
              disabled={lifecycleMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                confirmLifecycleChange();
              }}
            >
              {lifecycleDialog?.action === 'suspend' ? 'Suspendre' : 'Activer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FormationCatalogProgramSheets
        active={activeCatalogProgram}
        selectedFormation={selectedFormationItem}
        sheetMode={catalogSheetMode}
        onClose={closeCatalogSheets}
      />
    </>
  );
};

export default FormationList;



