'use client';
import { useTranslation } from '@/hooks/useTranslation';
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
  Calendar,
  ChevronDown,
  Copy,
  Download,
  Trash
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { InventaireDetailsSheet } from './inventaire-details-sheet';
import { formatEquipmentUnitLabel } from '@/lib/equipment-catalog';

export interface ICurrentStock {
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

export function CurrentStockTable({ 
  searchQuery = '', 
  onSearchChange 
}: { 
  searchQuery?: string; 
  onSearchChange?: (val: string) => void 
}) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updatedAt', desc: true }
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedInventaireForDetails, setSelectedInventaireForDetails] = useState<any>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const selectedRowsCount = Object.keys(rowSelection).length;

  const fetchCurrentStock = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<ICurrentStock>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      status: 'IN_USE',
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des équipements en utilisation');
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
    queryKey: ['equipment-current-stock', pagination, sorting, searchQuery],
    queryFn: () => fetchCurrentStock({
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

  const columns = useMemo<ColumnDef<ICurrentStock>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Équipement" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-md border border-border/50 bg-primary/10 flex items-center justify-center">
              <Package className="size-4 text-primary" />
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
        header: ({ column }) => <DataGridColumnHeader title="État Actuel" column={column} />,
        cell: ({ row }) => (
          <Badge 
            variant={row.original.status === 'IN_USE' ? 'primary' : 'warning'} 
            appearance="light" 
            className="font-bold uppercase text-[10px] tracking-wider"
          >
            {row.original.status === 'IN_USE' ? 'En Formation' : 'En Maintenance'}
          </Badge>
        ),
        size: 150,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <Badge variant="primary" appearance="light" size="sm" className="font-bold uppercase text-[10px]">
            {row.original.type || '-'}
          </Badge>
        ),
        size: 130,
      },
      {
        accessorKey: 'assignedSite',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.assignedSite?.name || 'Non affecté'}</span>,
        size: 175,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Dernier Mouvement" column={column} />,
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
    getRowId: (row) => row.id,
    state: { pagination, sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
  });

  return (
    <>
      <CardTable>
        <DataGrid 
          table={table} 
          recordCount={totalCount}
          isLoading={isLoading}
          tableLayout={{ columnsResizable: true, columnsPinnable: true, columnsMovable: true, columnsVisibility: true }}
          tableClassNames={{
            bodyRow: (row) => cn(
              "transition-colors relative",
              row.getIsSelected() && "bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary"
            )
          }}
        >
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
        defaultTab="affectations"
      />

      <AnimatePresence>
        {selectedRowsCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-popover text-popover-foreground rounded-xl px-4 py-2.5 flex items-center gap-6 shadow-2xl border border-border min-w-[500px]">
              <div className="text-sm font-medium border-r border-border pr-6">
                <span className="text-muted-foreground">{selectedRowsCount} sur {items.length} sélectionnés</span>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                      {t('datagrid.changeStatus')} <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem className="hover:bg-accent font-bold uppercase text-[10px]">Disponible</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent font-bold uppercase text-[10px]">En Maintenance</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent font-bold uppercase text-[10px] text-destructive">Hors Service</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                  <Copy className="size-4" /> {t('datagrid.duplicate')}
                </button>
                <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                  <Download className="size-4" />{t('common.actions.export')}</button>
                <button className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors ml-4">
                  <Trash className="size-4" /> {t('datagrid.delete')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CurrentStockTable;
