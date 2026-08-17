'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  createModuleLandingPagination,
  USER_MANAGEMENT_TABLE_CLASSNAMES,
  USER_MANAGEMENT_TABLE_LAYOUT,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { getInventaireStatusProps } from '../constants/status';
import { Loader2, ChevronRight, MapPin, Settings } from 'lucide-react';
import { EquipmentThumbnail } from './equipment-thumbnail';
import { Button } from '@/components/ui/button';
import type { EquipmentStatus } from '@/app/models/equipment';
import {
  EQUIPMENT_HEADQUARTERS_SITE_NAME,
  formatEquipmentUnitReference,
} from '@/lib/equipment-catalog';

export type CatalogUnitRow = {
  id: string;
  serialNumber: string;
  label: string;
  status: EquipmentStatus;
  type?: string | null;
  unitIndex: number | null;
  unitLabel: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  assignedSite?: { name?: string | null } | null;
  avatar?: string | null;
  metadata?: unknown;
  dispatch?: {
    location: string;
    roomName?: string | null;
    sessionIds?: string[];
  };
  roomAssignment?: { roomId: string; roomName: string; quantity: number } | null;
};

type InventaireCatalogUnitsTableProps = {
  catalogLabel: string;
  catalogKey?: string;
  filterStatus?: EquipmentStatus | EquipmentStatus[];
  emptyMessage?: string;
  onOpenUnit: (unit: CatalogUnitRow) => void;
  onEditUnit?: (unit: CatalogUnitRow) => void;
};

export function InventaireCatalogUnitsTable({
  catalogLabel,
  catalogKey,
  filterStatus,
  emptyMessage = 'Aucune unité pour cette catégorie.',
  onOpenUnit,
  onEditUnit,
}: InventaireCatalogUnitsTableProps) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data, isLoading } = useQuery({
    queryKey: ['equipment-catalog-units', catalogKey ?? catalogLabel],
    queryFn: async () => {
      const params = new URLSearchParams({
        mode: 'catalog-units',
        label: catalogLabel,
      });
      if (catalogKey) params.set('catalogKey', catalogKey);
      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`,
      );
      if (!response.ok) throw new Error('Chargement des unités impossible');
      const json = await response.json();
      return json.data as { units: CatalogUnitRow[] };
    },
    enabled: Boolean(catalogLabel),
  });

  const statuses = filterStatus
    ? Array.isArray(filterStatus)
      ? filterStatus
      : [filterStatus]
    : null;

  const units = useMemo(() => {
    const all = data?.units ?? [];
    return statuses ? all.filter((u) => statuses.includes(u.status)) : all;
  }, [data?.units, statuses]);

  const columns = useMemo<ColumnDef<CatalogUnitRow>[]>(
    () => [
      {
        accessorKey: 'serialNumber',
        header: ({ column }) => (
          <DataGridColumnHeader title="Référence unité" column={column} />
        ),
        cell: ({ row }) => {
          const unitRef = formatEquipmentUnitReference(
            row.original.serialNumber,
            row.original.label,
          );
          return (
            <button
              type="button"
              onClick={() => onOpenUnit(row.original)}
              className="flex items-center gap-3 text-left group w-full min-w-0"
            >
              <EquipmentThumbnail
                avatar={row.original.avatar}
                metadata={row.original.metadata}
                label={row.original.label}
                className="size-10 rounded-lg border border-border/50 shrink-0 group-hover:border-primary/40"
              />
              <div className="min-w-0">
                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors block truncate font-mono tracking-tight">
                  {unitRef}
                </span>
                <span className="text-[10px] text-muted-foreground block truncate">
                  {row.original.label}
                </span>
              </div>
            </button>
          );
        },
        size: 280,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const statusProps = getInventaireStatusProps(row.original.status);
          return (
            <Badge
              variant={statusProps.variant as 'success' | 'warning' | 'default' | 'outline'}
              appearance="light"
              size="sm"
              className="font-bold uppercase text-[9px]"
            >
              {statusProps.label}
            </Badge>
          );
        },
        size: 140,
      },
      {
        id: 'dispatch',
        header: ({ column }) => <DataGridColumnHeader title="Dispatch" column={column} />,
        cell: ({ row }) => {
          const d = row.original.dispatch;
          const room = row.original.roomAssignment?.roomName ?? d?.roomName;
          if (d?.location === 'ROOM_FIXED' && room) {
            return (
              <Badge variant="outline" className="text-[9px] font-semibold">
                Salle · {room}
              </Badge>
            );
          }
          if (d?.location === 'SESSION_RESERVED') {
            return (
              <Badge variant="outline" className="text-[9px] font-semibold text-sky-700">
                Session ({d.sessionIds?.length ?? 0})
              </Badge>
            );
          }
          if (d?.location === 'MAINTENANCE') {
            return <span className="text-xs text-amber-700">Maintenance</span>;
          }
          if (d?.location === 'AVAILABLE') {
            return <span className="text-xs text-emerald-700">Stock global</span>;
          }
          return <span className="text-xs text-muted-foreground">—</span>;
        },
        size: 160,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs font-medium text-foreground/80 uppercase">
            {row.original.type || '—'}
          </span>
        ),
        size: 120,
      },
      {
        id: 'site',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {row.original.assignedSite?.name || EQUIPMENT_HEADQUARTERS_SITE_NAME}
            </span>
          </div>
        ),
        size: 180,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Mis à jour" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.updatedAt
              ? formatDateTime(new Date(row.original.updatedAt))
              : '—'}
          </span>
        ),
        size: 160,
      },
      {
        id: 'open',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {onEditUnit && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                mode="icon"
                title="Paramètres"
                onClick={() => onEditUnit(row.original)}
              >
                <Settings className="size-4" />
              </Button>
            )}
            <button
              type="button"
              onClick={() => onOpenUnit(row.original)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Fiche
              <ChevronRight className="size-3.5" />
            </button>
          </div>
        ),
        size: onEditUnit ? 130 : 110,
        enableSorting: false,
      },
    ],
    [onOpenUnit, onEditUnit],
  );

  const table = useReactTable({
    data: units,
    columns,
    pageCount: Math.ceil(units.length / pagination.pageSize) || 1,
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (units.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-10 border border-dashed rounded-xl">
        {emptyMessage}
      </p>
    );
  }

  return (
    <DataGrid
      table={table}
      recordCount={units.length}
      tableLayout={USER_MANAGEMENT_TABLE_LAYOUT}
      tableClassNames={USER_MANAGEMENT_TABLE_CLASSNAMES}
    >
      <Card className="border border-border/60 shadow-none">
        <CardTable className="p-0">
          <ScrollArea>
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        <CardFooter className="border-t border-border/50 py-2">
          <DataGridPagination sizes={[5, 10, 20]} />
        </CardFooter>
      </Card>
    </DataGrid>
  );
}
