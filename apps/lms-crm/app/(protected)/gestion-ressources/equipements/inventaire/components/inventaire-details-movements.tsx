'use client';

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
import { Equipment } from '@/app/models/equipment';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw } from 'lucide-react';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';

interface Movement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string | null;
  createdAt: string;
  user: {
    name: string | null;
  } | null;
}

interface InventaireDetailsMovementsProps {
  equipment: Equipment;
}

export function InventaireDetailsMovements({ equipment }: InventaireDetailsMovementsProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);

  const fetchMovements = async ({
    pageIndex,
    pageSize,
    sorting,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<Movement>> => {
    const sortField = sorting?.[0]?.id || 'createdAt';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      sort: sortField,
      dir: sortDirection,
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire/${equipment.id}/movements?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des mouvements');
    return response.json();
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['equipment-movements-details', equipment.id, pagination, sorting],
    queryFn: () => fetchMovements({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
    }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const columns = useMemo<ColumnDef<Movement>[]>(
    () => [
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => {
          const type = row.original.type;
          return (
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-full ${
                type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 
                type === 'OUT' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {type === 'IN' ? <ArrowDownLeft className="size-3" /> : 
                 type === 'OUT' ? <ArrowUpRight className="size-3" /> : <RefreshCcw className="size-3" />}
              </div>
              <span className="font-bold text-xs uppercase">
                {type === 'IN' ? 'Entrée' : type === 'OUT' ? 'Sortie' : 'Ajustement'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataGridColumnHeader title="Qté" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] font-bold">
            {row.original.quantity > 0 ? `+${row.original.quantity}` : row.original.quantity}
          </Badge>
        ),
      },
      {
        accessorKey: 'reason',
        header: ({ column }) => <DataGridColumnHeader title="Raison" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground truncate max-w-[150px] block">
            {row.original.reason || '-'}
          </span>
        ),
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
        cell: ({ row }) => (
          <span className="text-[10px] text-muted-foreground font-medium">
            {formatDateTime(row.original.createdAt)}
          </span>
        ),
      },
    ],
    []
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
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Historique des flux</h4>
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
