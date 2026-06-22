'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { toast } from 'sonner';
import {
  CalendarClock,
  Clock,
  Eye,
  LayoutGrid,
  List,
  LoaderCircleIcon,
  MapPin,
  Pencil,
  Search,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { AvatarIndicator, AvatarStatus } from '@/components/ui/avatar';
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
  FORMATION_PARCOURS_LABELS,
  FORMATION_TRACK_LABELS,
  type FormationParcoursSpecialite,
  type FormationVitrineTrack,
} from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import { useSearchParams } from 'next/navigation';
import { formationsCatalogQueryRoot } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/hooks/use-formations-catalog-query';
import type { FormationSessionApiRow } from '../types/formation-session-api-row';
import {
  EXAMEN_FINAL_BADGE_LABEL,
  formationParcoursHasExamenFinal,
  sessionExamenSearchBlob,
} from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import { FormationLogoThumb } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/components/formation-logo-thumb';

export const sessionsQueryRoot = ['gestion-academique', 'vie-scolaire', 'sessions'] as const;

export const sessionsListQueryKey = [
  ...sessionsQueryRoot,
  'list',
] as const;

const PRICING_TRACK_ORDER: FormationVitrineTrack[] = [
  'surete',
  'incendie',
  'habilitation',
  'sst',
  'entreprise',
  'autres',
];

type TrackTab = 'all' | FormationVitrineTrack;

type Props = {
  onEditSession: (row: FormationSessionApiRow) => void;
  onViewSession: (row: FormationSessionApiRow) => void;
};

export function SessionsManager({ onEditSession, onViewSession }: Props) {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const lastAppliedDeeplinkRef = useRef('');
  const sessionIdParam = searchParams.get('sessionId')?.trim() ?? '';
  const formationSlugParam = searchParams.get('formationSlug')?.trim() ?? '';

  const queryClient = useQueryClient();
  const [listView, setListView] = useState<'table' | 'grid'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [trackTab, setTrackTab] = useState<TrackTab>('all');
  const [parcoursFilter, setParcoursFilter] = useState<FormationParcoursSpecialite | 'all'>('all');
  const [showPastSessions, setShowPastSessions] = useState(false);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'formationName', desc: false }]);
  const [rowSelection, setRowSelection] = useState({});

  const sessionsQuery = useQuery({
    queryKey: sessionsListQueryKey,
    queryFn: async (): Promise<{ items: FormationSessionApiRow[] }> => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions');
      if (!res.ok) throw new Error('Liste sessions indisponible.');
      const j = await res.json();
      if (!j?.success || !Array.isArray(j?.data?.items)) throw new Error('Réponse invalide.');
      return { items: j.data.items };
    },
    staleTime: 30_000,
  });

  const rawItems = sessionsQuery.data?.items ?? [];

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'sessions'] });
    queryClient.invalidateQueries({ queryKey: [...formationsCatalogQueryRoot] });
  }, [queryClient]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
  }, [trackTab, parcoursFilter, showPastSessions]);

  useEffect(() => {
    const key = sessionIdParam
      ? `id:${sessionIdParam}`
      : formationSlugParam
        ? `slug:${formationSlugParam}`
        : '';
    if (!key) return;
    if (lastAppliedDeeplinkRef.current === key) return;
    lastAppliedDeeplinkRef.current = key;
    setSearchQuery(sessionIdParam || formationSlugParam);
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [sessionIdParam, formationSlugParam]);

  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rawItems.filter((row) => {
      if (!showPastSessions && row.isExpired) return false;
      if (trackTab !== 'all' && row.formationTrack !== trackTab) return false;
      if (parcoursFilter !== 'all' && row.formationParcours !== parcoursFilter) return false;
      if (!q) return true;
      const blob =
        `${row.id} ${row.formationName} ${row.formationSlug} ${row.dateDisplayLabel} ${row.location} ${row.formationTag} ${sessionExamenSearchBlob(row)}`.toLowerCase();
      return blob.includes(q);
    });
  }, [rawItems, searchQuery, trackTab, parcoursFilter, showPastSessions]);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/sessions/${encodeURIComponent(id)}`,
        { method: 'DELETE' },
      );
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j?.error?.message ?? 'Suppression impossible.');
      return j;
    },
    onSuccess: () => {
      toast.success(t('sessions.deleted'));
      invalidateAll();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const requestDelete = (id: string) => {
    toast.message('Supprimer cette session ?', {
      description: 'Les inscriptions élèves associées seront effacées.',
      action: {
        label: 'Supprimer',
        onClick: () => deleteMutation.mutate(id),
      },
    });
  };

  const busyDelete = deleteMutation.isPending;

  const columns = useMemo<ColumnDef<FormationSessionApiRow>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 48,
        enableSorting: false,
      },
      {
        accessorKey: 'formationName',
        id: 'formationName',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-0 items-start gap-3 py-1">
            <FormationLogoThumb
              name={row.original.formationName}
              slug={row.original.formationSlug}
              logoUrl={row.original.formationVitrineOverview?.logoUrl}
              className="size-10 shrink-0 rounded-xl"
              imageClassName="object-cover"
            />
            <div className="min-w-0 space-y-0.5">
              <p className="font-semibold leading-tight text-foreground">{row.original.formationName}</p>
              <p className="truncate font-mono text-xs text-muted-foreground">{row.original.formationSlug}</p>
              {row.original.trainerName ? (
                <p className="truncate text-[11px] text-muted-foreground">
                  Formateur · {row.original.trainerName}
                </p>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'formationParcours',
        id: 'formationParcours',
        header: ({ column }) => <DataGridColumnHeader title="Parcours" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" appearance="light" size="sm">
            {FORMATION_PARCOURS_LABELS[row.original.formationParcours]}
          </Badge>
        ),
      },
      {
        accessorKey: 'examenFinal',
        id: 'examenFinal',
        header: ({ column }) => <DataGridColumnHeader title="Examen (parcours)" column={column} />,
        cell: ({ row }) =>
          formationParcoursHasExamenFinal(row.original.formationParcours) ? (
            <Badge variant="success" appearance="light" size="sm">
              {EXAMEN_FINAL_BADGE_LABEL}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">Non (MAC / RAN / …)</span>
          ),
      },
      {
        accessorKey: 'dateDisplayLabel',
        id: 'dateDisplayLabel',
        header: ({ column }) => <DataGridColumnHeader title="Dates (vitrine)" column={column} />,
        cell: ({ row }) => (
          <span className="inline-flex flex-wrap items-center gap-1.5 text-sm">
            <CalendarClock className="size-3.5 shrink-0 text-muted-foreground" />
            {row.original.dateDisplayLabel}
            {row.original.isExpired ? (
              <Badge variant="outline" size="sm" className="text-muted-foreground">
                Expirée
              </Badge>
            ) : null}
          </span>
        ),
      },
      {
        accessorKey: 'location',
        id: 'location',
        header: ({ column }) => <DataGridColumnHeader title="Lieu" column={column} />,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5 shrink-0" />
            {row.original.location}
          </span>
        ),
      },
      {
        id: 'participants',
        header: ({ column }) => <DataGridColumnHeader title="Élèves" column={column} />,
        cell: ({ row }) => {
          const parts = row.original.participants;
          if (parts.length === 0) {
            return <span className="text-sm tabular-nums text-muted-foreground">0</span>;
          }
          const maxShow = 4;
          const shown = parts.slice(0, maxShow);
          return (
            <div className="flex items-center gap-2 py-1">
              <div className="flex items-center -space-x-2">
                {shown.map((p) => (
                  <SessionUserAvatar
                    key={p.userId}
                    name={p.name}
                    email={p.email}
                    avatar={p.avatar}
                    sizeClassName="size-8 ring-2 ring-background"
                  />
                ))}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums">
                {parts.length > shown.length ? <>+{parts.length - shown.length} · </> : null}
                <span className="font-medium text-foreground">{parts.length}</span>
              </span>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => '',
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              type="button"
              variant="outline"
              mode="icon"
              size="sm"
              title="Voir"
              onClick={() => onViewSession(row.original)}
            >
              <Eye className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              mode="icon"
              size="sm"
              title="Éditer"
              onClick={() => onEditSession(row.original)}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              mode="icon"
              size="sm"
              title="Supprimer"
              disabled={busyDelete}
              onClick={() => requestDelete(row.original.id)}
            >
              <Trash2 className="size-4 text-destructive" />
            </Button>
          </div>
        ),
        size: 140,
        enableSorting: false,
      },
    ],
    [busyDelete, onEditSession, onViewSession],
  );

  const table = useReactTable({
    columns,
    data: filteredRows,
    getRowId: (row) => row.id,
    state: { pagination, sorting, rowSelection },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-foreground">Liste des sessions</h3>
            <p className="text-xs text-muted-foreground">
              Sessions planifiées sur les formations du catalogue actif. Filtrez par filière ou parcours
              pédagogique (Initial = examen en fin de parcours ; MAC / RAN = sans examen certifiant de ce type).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t('datagrid.search.session')}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
                className="h-10 ps-9"
              />
            </div>
            <Button
              type="button"
              variant={showPastSessions ? 'secondary' : 'outline'}
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => {
                setShowPastSessions((v) => !v);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
            >
              {showPastSessions ? 'Masquer passées' : 'Afficher passées'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-10 shrink-0"
              disabled={sessionsQuery.isFetching}
              onClick={() => void sessionsQuery.refetch()}
              aria-label={t('crud.refresh')}
            >
              <RefreshCw className={cn('size-4', sessionsQuery.isFetching && 'animate-spin')} />
            </Button>
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
                aria-selected={trackTab === 'all'}
                size="sm"
                variant={trackTab === 'all' ? 'secondary' : 'ghost'}
                className="text-xs sm:text-sm"
                onClick={() => {
                  setTrackTab('all');
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                Toutes filières
              </Button>
              {PRICING_TRACK_ORDER.map((track) => (
                <Button
                  key={track}
                  type="button"
                  role="tab"
                  aria-selected={trackTab === track}
                  size="sm"
                  variant={trackTab === track ? 'secondary' : 'ghost'}
                  className="text-xs sm:text-sm"
                  onClick={() => {
                    setTrackTab(track);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  {FORMATION_TRACK_LABELS[track]}
                </Button>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end lg:shrink-0">
              <Select
                value={parcoursFilter}
                onValueChange={(v) => {
                  setParcoursFilter(v as FormationParcoursSpecialite | 'all');
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger className="h-10 w-full sm:w-[200px]">
                  <SelectValue placeholder="Parcours pédagogique" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous parcours</SelectItem>
                  {(Object.keys(FORMATION_PARCOURS_LABELS) as FormationParcoursSpecialite[]).map((p) => (
                    <SelectItem key={p} value={p}>
                      {FORMATION_PARCOURS_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex h-10 items-center gap-2 rounded-lg border bg-muted/50 p-1 shadow-sm">
                <Button
                  type="button"
                  variant={listView === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setListView('table')}
                >
                  <List className="size-4" />
                  Liste
                </Button>
                <Button
                  type="button"
                  variant={listView === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setListView('grid')}
                >
                  <LayoutGrid className="size-4" />
                  Cartes
                </Button>
              </div>
            </div>
          </div>

          {!sessionsQuery.isLoading &&
          rawItems.length > 0 &&
          filteredRows.length === 0 ? (
            <p className="text-xs text-amber-700 dark:text-amber-500">
              Aucune session pour ces filtres ({rawItems.length} au total). Changez d&apos;onglet ou élargissez
              la recherche.
            </p>
          ) : null}
        </CardHeader>
      </Card>

      {sessionsQuery.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground px-1">
          <LoaderCircleIcon className="size-4 animate-spin" /> Chargement…
        </p>
      ) : sessionsQuery.error ? (
        <p className="text-sm text-destructive px-1">{(sessionsQuery.error as Error).message}</p>
      ) : rawItems.length === 0 ? (
        <p className="text-sm text-muted-foreground px-1">Aucune session pour le moment.</p>
      ) : listView === 'table' ? (
        <DataGrid
          table={table}
          recordCount={filteredRows.length}
          isLoading={sessionsQuery.isLoading}
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
        <DataGrid table={table} recordCount={filteredRows.length} isLoading={sessionsQuery.isLoading}>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {table.getRowModel().rows.map((row) => {
              const s = row.original;
              const selected = row.getIsSelected();
              return (
                <Card
                  key={s.id}
                  className={cn(
                    'group overflow-hidden border-border shadow-none transition-all duration-300 hover:border-primary/50',
                    selected &&
                      'border-primary ring-1 ring-primary/25 ring-offset-2 ring-offset-background',
                  )}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col items-center text-center">
                      <div className="relative mb-3 w-full">
                        <div className="relative mx-auto aspect-[4/3] w-full max-w-[260px] overflow-hidden rounded-2xl border-2 border-background shadow-lg">
                          <FormationLogoThumb
                            name={s.formationName}
                            slug={s.formationSlug}
                            logoUrl={s.formationVitrineOverview?.logoUrl}
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
                      {s.participants.length > 0 ? (
                        <div className="mb-3 flex items-center justify-center gap-1">
                          <div className="flex -space-x-2">
                            {s.participants.slice(0, 5).map((p) => (
                              <SessionUserAvatar
                                key={p.userId}
                                name={p.name}
                                email={p.email}
                                avatar={p.avatar}
                                sizeClassName="size-9 ring-2 ring-card"
                              />
                            ))}
                          </div>
                          {s.participants.length > 5 ? (
                            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-xs font-semibold text-muted-foreground shadow-sm ring-2 ring-card">
                              +{s.participants.length - 5}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="mb-4 space-y-1 w-full">
                        <h4 className="line-clamp-2 font-bold text-foreground">{s.formationName}</h4>
                        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                          <Clock className="size-3 shrink-0" />
                          <span className="max-w-[220px] truncate">{s.dateDisplayLabel}</span>
                        </div>
                      </div>
                      <div className="mb-6 flex flex-wrap justify-center gap-2">
                        {formationParcoursHasExamenFinal(s.formationParcours) ? (
                          <Badge variant="success" appearance="light" size="sm">
                            {EXAMEN_FINAL_BADGE_LABEL}
                          </Badge>
                        ) : null}
                        <Badge variant="outline" appearance="light" size="sm">
                          {FORMATION_PARCOURS_LABELS[s.formationParcours]}
                        </Badge>
                        <Badge variant="success" appearance="light" size="sm">
                          {FORMATION_TRACK_LABELS[s.formationTrack]}
                        </Badge>
                      </div>
                      <div className="flex w-full items-center justify-center gap-2 border-t border-dashed border-border pt-4">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          mode="icon"
                          onClick={() => onViewSession(s)}
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => onEditSession(s)}>
                          <Pencil className="size-4" />
                          Éditer
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          mode="icon"
                          disabled={busyDelete}
                          onClick={() => requestDelete(s.id)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card className="border-border shadow-none mt-4">
            <CardFooter className="border-t border-border py-4">
              <DataGridPagination />
            </CardFooter>
          </Card>
        </DataGrid>
      )}
    </>
  );
}
