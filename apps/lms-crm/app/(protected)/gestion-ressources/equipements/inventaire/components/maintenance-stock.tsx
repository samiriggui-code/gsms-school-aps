'use client';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { 
  Search, 
  Eye, 
  Package,
  RefreshCw,
  Wrench,
  Calendar
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { InventaireDetailsSheet } from './inventaire-details-sheet';
import { formatEquipmentUnitLabel } from '@/lib/equipment-catalog';

export interface IMaintenanceStock {
  id: string;
  label: string;
  serialNumber: string;
  status: string;
  type: string | null;
  assignedSite: {
    name: string;
  } | null;
  updatedAt: string;
}

export function MaintenanceStockTable({ 
  searchQuery = '', 
  onSearchChange 
}: { 
  searchQuery?: string; 
  onSearchChange?: (val: string) => void 
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState([
    { id: 'updatedAt', desc: true }
  ]);
  const [selectedInventaireForDetails, setSelectedInventaireForDetails] = useState<any>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const fetchMaintenanceStock = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<IMaintenanceStock>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      status: 'MAINTENANCE',
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement du matériel en maintenance');
    const json = await response.json();
    const payload = json?.data ?? json;
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return {
      data: rows,
      pagination: payload?.pagination ?? {
        total: rows.length,
        page: pageIndex + 1,
        limit: pageSize,
        totalPages: 1,
      },
    };
  };

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['equipment-maintenance-stock', pagination, sorting, searchQuery],
    queryFn: () => fetchMaintenanceStock({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      searchQuery,
    }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const handleOpenDetails = (item: any) => {
    setSelectedInventaireForDetails(item);
    setIsDetailsSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<IMaintenanceStock>[]>(
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
                className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer"
                onClick={() => handleOpenDetails(row.original)}
              >
                {formatEquipmentUnitLabel(row.original.label, row.original.serialNumber)}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">{row.original.serialNumber}</span>
            </div>
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="État" column={column} />,
        cell: () => (
          <Badge variant="warning" appearance="light" className="font-bold uppercase text-[10px] tracking-wider">
            En Maintenance
          </Badge>
        ),
        size: 150,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.type || '-'}</span>,
        size: 150,
      },
      {
        accessorKey: 'assignedSite',
        header: ({ column }) => <DataGridColumnHeader title="Provenance" column={column} />,
        cell: ({ row }) => <span className="text-sm text-foreground/80">{row.original.assignedSite?.name || 'Inconnue'}</span>,
        size: 175,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Entrée atelier" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="size-3" />
            {formatDateTime(row.original.updatedAt)}
          </div>
        ),
        size: 180,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end pr-2">
            <Button variant="ghost" mode="icon" className="size-8" onClick={() => handleOpenDetails(row.original)}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ),
        size: 80,
      },
    ],
    []
  );

  const table = useReactTable({
    data: items,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize),
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  return (
    <>
      <CardTable>
        <DataGrid table={table} recordCount={totalCount}>
          <DataGridTable />
          <CardFooter className="px-0 py-0 bg-transparent border-none">
            <DataGridPagination />
          </CardFooter>
        </DataGrid>
      </CardTable>

      <InventaireDetailsSheet 
        open={isDetailsSheetOpen} 
        onOpenChange={setIsDetailsSheetOpen} 
        inventaire={selectedInventaireForDetails} 
        defaultTab="maintenance"
      />
    </>
  );
}

export default MaintenanceStockTable;
