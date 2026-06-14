'use client';

import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Calendar, Users, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { RiCheckboxCircleFill, RiErrorWarningFill } from '@remixicon/react';
import { apiFetch } from '@/lib/api';
import { buildDataGridListResponse } from '@/lib/gestion-ressources/datagrid-response';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import { DataGridApiFetchParams, DataGridApiResponse } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { Input } from '@/components/ui/input';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { EquipmentDataGridCard } from '../../../components/equipment-datagrid-card';
import { EquipmentRowActions } from '../../../components/equipment-row-actions';
import { EquipmentDeleteDialog } from '../../../components/equipment-delete-dialog';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { getSalleStatusProps } from '../constants/status';
import { SalleEquipmentSheet } from './salle-equipment-sheet';
import { SalleThumbnail } from './salle-thumbnail';
import type { VenueRoomRow } from '../types';

export function SallesList({
  searchQuery = '',
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}) {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);
  const [selected, setSelected] = useState<VenueRoomRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsDefaultTab, setDetailsDefaultTab] = useState('overview');
  const [deleteTarget, setDeleteTarget] = useState<VenueRoomRow | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchRows = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<VenueRoomRow>> => {
    const sortField = sorting?.[0]?.id || 'name';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      sort: sortField,
      dir: sortDirection,
      ...(searchQuery ? { query: searchQuery } : {}),
    });
    const res = await apiFetch(
      `/api/sections/gestion-ressources/equipements/salles?${params}`,
    );
    if (!res.ok) throw new Error('Échec du chargement des salles');
    const json = await res.json();
    const payload = json?.data;
    const rows = payload?.data ?? [];
    return buildDataGridListResponse(rows, {
      total: payload?.pagination?.total ?? rows.length,
      page: payload?.pagination?.page ?? pageIndex + 1,
    });
  };

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['venue-rooms-list', pagination, sorting, searchQuery],
    queryFn: () =>
      fetchRows({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/salles/${id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) {
        const j = await response.json();
        throw new Error(j?.error?.message || 'Suppression impossible');
      }
      return response.json();
    },
    onSuccess: (json) => {
      setDeleteTarget(null);
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-list'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['venue-rooms-planning'] });
      const msg = json?.data?.message ?? 'Salle supprimée';
      toast.custom(
        () => (
          <Alert variant="mono" icon="success">
            <AlertIcon>
              <RiCheckboxCircleFill />
            </AlertIcon>
            <AlertTitle>{msg}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
    onError: (e: Error) => {
      toast.custom(
        () => (
          <Alert variant="mono" icon="destructive">
            <AlertIcon>
              <RiErrorWarningFill />
            </AlertIcon>
            <AlertTitle>{e.message}</AlertTitle>
          </Alert>
        ),
        { position: 'top-center' },
      );
    },
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const openSheet = useCallback((row: VenueRoomRow, tab: string) => {
    setSelected(row);
    setDetailsDefaultTab(tab === 'settings' ? 'parametres' : tab);
    setSheetOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<VenueRoomRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Salle" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <SalleThumbnail
              imageUrl={row.original.imageUrl}
              label={row.original.name}
              className="size-10 rounded-md border border-border/50"
            />
            <div className="flex flex-col min-w-0">
              <span
                className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer truncate"
                onClick={() => openSheet(row.original, 'overview')}
              >
                {row.original.name}
              </span>
              {row.original.shortCode ? (
                <span className="text-[10px] text-muted-foreground uppercase">
                  {row.original.shortCode}
                </span>
              ) : null}
            </div>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: 'floorLabel',
        header: ({ column }) => <DataGridColumnHeader title="Zone" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">{row.original.floorLabel || '—'}</span>
        ),
        size: 140,
      },
      {
        accessorKey: 'capacity',
        header: ({ column }) => <DataGridColumnHeader title="Capacité" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm flex items-center gap-1">
            <Users className="size-3 text-muted-foreground" />
            {row.original.capacity ?? '—'}
          </span>
        ),
        size: 100,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => {
          const props = getSalleStatusProps(row.original.status);
          return (
            <Badge
              variant={props.variant}
              appearance="light"
              className="font-bold uppercase text-[10px]"
            >
              {props.label}
            </Badge>
          );
        },
        size: 130,
      },
      {
        id: 'sessions',
        header: ({ column }) => <DataGridColumnHeader title="Sessions" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">
            {row.original.activeSessionsCount} en cours · {row.original.upcomingSessionsCount} à venir
          </span>
        ),
        size: 180,
        enableSorting: false,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="MAJ" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            {row.original.updatedAt ? formatDateTime(row.original.updatedAt) : '—'}
          </span>
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <EquipmentRowActions
            onView={() => openSheet(row.original, 'overview')}
            onEdit={() => openSheet(row.original, 'parametres')}
            onDelete={() => setDeleteTarget(row.original)}
          />
        ),
        size: 120,
        enableSorting: false,
        enableResizing: false,
      },
    ],
    [openSheet],
  );

  const table = useReactTable({
    data: items,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getRowId: (row) => row.id,
  });

  const toolbar = (
    <CardHeader className="py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Référentiel des salles</h3>
          <p className="text-xs text-muted-foreground">
            Salles de formation, disponibilité et réservations session.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher une salle…"
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="ps-9 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 gap-2 border-dashed"
            disabled={isSyncing || isRefetching}
            onClick={async () => {
              setIsSyncing(true);
              await refetch();
              setIsSyncing(false);
            }}
          >
            <RefreshCw className={cn('size-4', (isSyncing || isRefetching) && 'animate-spin')} />
            <span className="font-bold uppercase text-[11px]">Sync</span>
          </Button>
        </div>
      </div>
    </CardHeader>
  );

  return (
    <>
      <EquipmentDataGridCard
        table={table}
        recordCount={totalCount}
        isLoading={isLoading}
        toolbar={toolbar}
      />

      <SalleEquipmentSheet
        key={selected?.id ?? 'salle-sheet'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        room={selected}
        defaultTab={detailsDefaultTab}
      />

      <EquipmentDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        label={deleteTarget?.name}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget?.id) deleteMutation.mutate(deleteTarget.id);
        }}
      />
    </>
  );
}
