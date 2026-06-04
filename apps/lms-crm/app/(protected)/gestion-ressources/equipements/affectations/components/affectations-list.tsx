'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Search, Calendar, RefreshCw } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardHeader } from '@/components/ui/card';
import {
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { Input } from '@/components/ui/input';
import { AffectationEquipmentSheet } from './affectation-equipment-sheet';
import { EquipmentDataGridCard } from '../../components/equipment-datagrid-card';
import { EquipmentRowActions } from '../../components/equipment-row-actions';
import type { EquipmentAffectationRow } from '@/lib/hooks/equipment';
import type { EquipmentSheetInput } from '@/app/models/equipment';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { EquipmentThumbnail } from '../../inventaire/components/equipment-thumbnail';

export function AffectationsList({
  searchQuery = '',
  onSearchChange,
}: {
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}) {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startDate', desc: true }]);
  const [selected, setSelected] = useState<EquipmentAffectationRow | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [detailsDefaultTab, setDetailsDefaultTab] = useState('sessions');
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAffectations = async ({
    pageIndex,
    pageSize,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<EquipmentAffectationRow>> => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
    });
    if (searchQuery) params.set('query', searchQuery);

    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/affectations?${params}`,
    );
    if (!response.ok) throw new Error('Échec du chargement des affectations');
    const json = await response.json();
    const payload = json?.data;
    return {
      data: payload?.data ?? [],
      pagination: payload?.pagination ?? { total: 0, page: 1, limit: pageSize, totalPages: 1 },
    };
  };

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['equipment-affectations-list', pagination, searchQuery],
    queryFn: () =>
      fetchAffectations({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
      }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const openEquipmentSheet = useCallback((row: EquipmentAffectationRow, tab: string) => {
    setSelected(row);
    const normalized =
      tab === 'affectations' ? 'sessions' : tab === 'settings' ? 'parametres' : tab;
    setDetailsDefaultTab(normalized);
    setSheetOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<EquipmentAffectationRow>[]>(
    () => [
      {
        accessorKey: 'equipmentLabel',
        header: ({ column }) => <DataGridColumnHeader title="Équipement" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <EquipmentThumbnail
              avatar={row.original.equipmentAvatar}
              label={row.original.equipmentLabel}
              className="size-10 rounded-md border border-border/50"
            />
            <div className="flex flex-col min-w-0">
              <span
                className="font-semibold text-sm text-foreground hover:text-primary cursor-pointer truncate"
                onClick={() => openEquipmentSheet(row.original, 'affectations')}
              >
                {row.original.equipmentLabel}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase">
                {row.original.equipmentSerial}
              </span>
            </div>
          </div>
        ),
        size: 260,
      },
      {
        accessorKey: 'sessionTitle',
        header: ({ column }) => <DataGridColumnHeader title="Session / Réservation" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-bold uppercase text-[10px] max-w-[220px] truncate">
            {row.original.sessionTitle}
          </Badge>
        ),
        size: 220,
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="size-3" />
              {formatDateTime(row.original.startDate)}
            </span>
            <span className="pl-4">→ {formatDateTime(row.original.endDate)}</span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'clientSiteName',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-foreground/80">
            {row.original.clientSiteName || 'Non renseigné'}
          </span>
        ),
        size: 160,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <EquipmentRowActions
            onView={() => openEquipmentSheet(row.original, 'affectations')}
            onEdit={() => openEquipmentSheet(row.original, 'settings')}
          />
        ),
        size: 120,
        enableSorting: false,
        enableResizing: false,
      },
    ],
    [openEquipmentSheet],
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
          <h3 className="text-base font-semibold text-foreground">Affectations aux sessions</h3>
          <p className="text-xs text-muted-foreground">
            Matériel réservé ou mobilisé par session (formateur / collaborateur).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Rechercher session ou équipement..."
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

      <AffectationEquipmentSheet
        key={selected?.equipmentId ?? 'affectation-sheet'}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        inventaire={
          selected
            ? ({
                id: selected.equipmentId,
                label: selected.equipmentLabel,
                serialNumber: selected.equipmentSerial,
                avatar: selected.equipmentAvatar ?? undefined,
              } satisfies EquipmentSheetInput)
            : null
        }
        defaultTab={detailsDefaultTab}
      />
    </>
  );
}
