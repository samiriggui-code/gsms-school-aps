'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { apiFetch } from '@/lib/api';
import { buildDataGridListResponse } from '@/lib/gestion-ressources/datagrid-response';
import { Equipment } from '@/app/models/equipment';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@repo/ui/badge';
import { MaintenanceCompleteActions } from '../../components/maintenance-complete-actions';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';

interface MaintenanceItem {
  id: string;
  type: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'SCHEDULED' | 'OVERDUE';
  description: string;
  cost: number | null;
  startDate: string | null;
  endDate: string | null;
  technician: string | null;
}

interface InventaireDetailsMaintenanceProps {
  equipment: Equipment;
}

export function InventaireDetailsMaintenance({ equipment }: InventaireDetailsMaintenanceProps) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startDate', desc: true }
  ]);

  const fetchMaintenance = async ({
    pageIndex,
    pageSize,
    sorting,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<MaintenanceItem>> => {
    const sortField = sorting?.[0]?.id || 'startDate';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      sort: sortField,
      dir: sortDirection,
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire/${equipment.id}/maintenance?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement de la maintenance');
    const json = await response.json();
    const payload = json?.data ?? json;
    const rows = payload?.data ?? payload?.items ?? [];
    return buildDataGridListResponse(rows, {
      total: payload?.pagination?.total ?? rows.length,
      page: payload?.pagination?.page ?? pageIndex + 1,
    });
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['equipment-maintenance-details', equipment.id, pagination, sorting],
    queryFn: () => fetchMaintenance({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
    }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const completeInvalidateKeys = useMemo(
    () => [
      ['equipment-maintenance-details', equipment.id],
      ['equipment-maintenance-list'],
      ['equipment-catalog'],
    ],
    [equipment.id],
  );

  const columns = useMemo<ColumnDef<MaintenanceItem>[]>(
    () => [
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Intervention" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase truncate max-w-[120px]">
              {row.original.type}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
              {row.original.technician || 'Non assigné'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <Badge variant="outline" className={`text-[10px] font-bold ${
              status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
              status === 'IN_PROGRESS' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
              'bg-amber-50 text-amber-700 border-amber-100'
            }`}>
              {status === 'COMPLETED' ? 'Terminé' : status === 'IN_PROGRESS' ? 'En cours' : status === 'SCHEDULED' ? 'Planifié' : 'Attente'}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'cost',
        header: ({ column }) => <DataGridColumnHeader title="Coût" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs font-bold">
            {row.original.cost ? `${row.original.cost}€` : '-'}
          </span>
        ),
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
        cell: ({ row }) => (
          <span className="text-[10px] text-muted-foreground">
            {row.original.startDate ? formatDateTime(row.original.startDate) : '-'}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => {
          const done = row.original.status === 'COMPLETED';
          if (done) return null;
          return (
            <MaintenanceCompleteActions
              maintenanceId={row.original.id}
              equipmentId={equipment.id}
              equipmentStatus={equipment.status}
              invalidateKeys={completeInvalidateKeys}
            />
          );
        },
        size: 130,
      },
    ],
    [completeInvalidateKeys, equipment.id, equipment.status, t]
  );

  const table = useReactTable({
    data: items,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Interventions techniques</h4>
        {equipment.status === 'MAINTENANCE' && (
          <MaintenanceCompleteActions
            maintenanceId={items.find((i) => i.status !== 'COMPLETED')?.id}
            equipmentId={equipment.id}
            equipmentStatus={equipment.status}
            invalidateKeys={completeInvalidateKeys}
            layout="buttons"
            size="sm"
          />
        )}
      </div>
      <DataGrid 
        table={table} 
        recordCount={totalCount}
        isLoading={isLoading}
      >
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <DataGridTable />
          <div className="p-2 border-t border-border bg-muted/20">
            <DataGridPagination />
          </div>
        </div>
      </DataGrid>
    </div>
  );
}
