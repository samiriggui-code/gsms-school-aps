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
import { Calendar, User } from 'lucide-react';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';

interface Affectation {
  id: string;
  sessionId: string;
  sessionTitle: string;
  startDate: string;
  endDate: string;
  clientSiteName: string | null;
  trainerName: string | null;
}

interface InventaireDetailsAffectationsProps {
  equipment: Equipment;
}

export function InventaireDetailsAffectations({ equipment }: InventaireDetailsAffectationsProps) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'startDate', desc: true }
  ]);

  const fetchAffectations = async ({
    pageIndex,
    pageSize,
    sorting,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<Affectation>> => {
    const sortField = sorting?.[0]?.id || 'startDate';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      sort: sortField,
      dir: sortDirection,
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire/${equipment.id}/sessions?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des affectations');
    return response.json();
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['equipment-affectations-details', equipment.id, pagination, sorting],
    queryFn: () => fetchAffectations({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
    }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const columns = useMemo<ColumnDef<Affectation>[]>(
    () => [
      {
        accessorKey: 'sessionTitle',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-bold text-xs uppercase truncate max-w-[150px]">
              {row.original.sessionTitle}
            </span>
            <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
              {row.original.clientSiteName || 'Site non spécifié'}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
            <span>Du {formatDateTime(row.original.startDate)}</span>
            <span>Au {formatDateTime(row.original.endDate)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'trainerName',
        header: ({ column }) => <DataGridColumnHeader title="Intervenant" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs">
            <User className="size-3 text-muted-foreground" />
            <span className="truncate max-w-[100px]">{row.original.trainerName || '-'}</span>
          </div>
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
        <h4 className="text-sm font-bold uppercase tracking-widest text-foreground/70">Affectations aux sessions</h4>
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
