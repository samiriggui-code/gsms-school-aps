'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Wrench, Calendar, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { buildDataGridListResponse } from '@/lib/gestion-ressources/datagrid-response';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { CardHeader } from '@repo/ui/card';
import { DataGridApiFetchParams, DataGridApiResponse } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { Input } from '@repo/ui/input';
import { MaintenanceEquipmentSheet } from './maintenance-equipment-sheet';
import { EquipmentDataGridCard } from '../../components/equipment-datagrid-card';
import { EquipmentRowActions } from '../../components/equipment-row-actions';
import { MaintenanceCompleteActions } from '../../components/maintenance-complete-actions';
import { formatEquipmentUnitLabel } from '@/lib/equipment-catalog';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import type { EquipmentSheetInput } from '@/app/models/equipment';

export interface MaintenanceUnitRow {
  id: string;
  label: string;
  serialNumber: string;
  status: string;
  type: string | null;
  assignedSite: { name: string } | null;
  updatedAt: string;
  openMaintenanceId?: string | null;
}

export function MaintenanceList({
  searchQuery = '',
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [selected, setSelected] = useState<MaintenanceUnitRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsDefaultTab, setDetailsDefaultTab] = useState('maintenance');
  const [isSyncing, setIsSyncing] = useState(false);

  const invalidateKeys = useMemo(
    () => [
      ['equipment-maintenance-list'],
      ['equipment-maintenance-stats'],
      ['equipment-catalog'],
    ],
    [],
  );

  const fetchRows = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<MaintenanceUnitRow>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      status: 'MAINTENANCE',
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });
    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/inventaire?${params}`,
    );
    if (!response.ok) throw new Error('Échec du chargement maintenance');
    const json = await response.json();
    const payload = json?.data;
    const rows = payload?.data ?? [];
    return buildDataGridListResponse(rows, {
      total: payload?.pagination?.total ?? rows.length,
      page: payload?.pagination?.page ?? pageIndex + 1,
    });
  };

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['equipment-maintenance-list', pagination, sorting, searchQuery],
    queryFn: () =>
      fetchRows({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
    refetchOnWindowFocus: false,
    gcTime: 5 * 60_000,
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const openSheet = useCallback((row: MaintenanceUnitRow, tab: string) => {
    setSelected(row);
    const normalized = tab === 'settings' ? 'parametres' : tab;
    setDetailsDefaultTab(normalized);
    setSheetOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<MaintenanceUnitRow>[]>(
    () => [
      {
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Équipement" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md border border-border/50 bg-amber-500/10 flex items-center justify-center">
              <Wrench className="size-4 text-amber-600" />
            </div>
            <div className="flex flex-col">
              <span
                className="font-semibold text-sm cursor-pointer hover:text-primary"
                onClick={() => openSheet(row.original, 'maintenance')}
              >
                {formatEquipmentUnitLabel(row.original.label, row.original.serialNumber)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">{row.original.serialNumber}</span>
            </div>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="État" column={column} />,
        cell: () => (
          <Badge variant="warning" appearance="light" className="font-bold uppercase text-[10px]">
            En maintenance
          </Badge>
        ),
        size: 140,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => <span className="text-sm">{row.original.type || '—'}</span>,
        size: 140,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Entrée atelier" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="size-3" />
            {formatDateTime(row.original.updatedAt)}
          </span>
        ),
        size: 180,
      },
      {
        id: 'complete',
        header: 'Clôture',
        cell: ({ row }) => (
          <MaintenanceCompleteActions
            maintenanceId={row.original.openMaintenanceId}
            equipmentId={row.original.id}
            equipmentStatus={row.original.status}
            invalidateKeys={invalidateKeys}
          />
        ),
        size: 130,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <EquipmentRowActions
            onView={() => openSheet(row.original, 'maintenance')}
            onEdit={() => openSheet(row.original, 'settings')}
          />
        ),
        size: 100,
        enableSorting: false,
        enableResizing: false,
      },
    ],
    [invalidateKeys, openSheet],
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
    getRowId: (row) => row.id,
  });

  const toolbar = (
    <CardHeader className="py-3">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold">Maintenance & atelier</h3>
          <p className="text-xs text-muted-foreground">
            Unités en intervention — clôturez pour remettre en stock ou classer HS.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder={t('datagrid.search.equipment')}
              value={searchQuery}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="ps-9 h-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-10 border-dashed"
            disabled={isSyncing || isRefetching}
            onClick={async () => {
              setIsSyncing(true);
              await refetch();
              setIsSyncing(false);
            }}
          >
            <RefreshCw className={cn('size-4', (isSyncing || isRefetching) && 'animate-spin')} />
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

      <MaintenanceEquipmentSheet
        key={selected?.id ?? 'maintenance-sheet'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        inventaire={selected as EquipmentSheetInput | null}
        defaultTab={detailsDefaultTab}
      />
    </>
  );
}
