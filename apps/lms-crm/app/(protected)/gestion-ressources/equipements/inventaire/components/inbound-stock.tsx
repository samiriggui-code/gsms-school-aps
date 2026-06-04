'use client';

import { useTranslation } from '@/hooks/useTranslation';
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
  ArrowDownLeft,
  ArrowUpRight,
  History,
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
import { Input } from '@/components/ui/input';
import { InventaireDetailsSheet } from './inventaire-details-sheet';

export interface IMovement {
  id: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  reason: string | null;
  createdAt: string;
  equipment: {
    id: string;
    label: string;
    serialNumber: string;
  };
  user: {
    name: string | null;
  } | null;
}

export function InboundStockTable() {
  const { t } = useTranslation();

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInventaireForDetails, setSelectedInventaireForDetails] = useState<any>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const selectedRowsCount = Object.keys(rowSelection).length;

  const fetchMovements = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<IMovement>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire/movements?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des mouvements');
    return response.json();
  };

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['equipment-movements', pagination, sorting, searchQuery],
    queryFn: () => fetchMovements({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      searchQuery,
    }),
  });

  const handleOpenDetails = (item: any) => {
    setSelectedInventaireForDetails(item.equipment);
    setIsDetailsSheetOpen(true);
  };

  const columns = useMemo<ColumnDef<IMovement>[]>(
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
        accessorKey: 'equipment.label',
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
                {row.original.equipment.label}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium">{row.original.equipment.serialNumber}</span>
            </div>
          </div>
        ),
        size: 250,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1 rounded-full",
              row.original.type === 'IN' ? "bg-emerald-100 text-emerald-700" : 
              row.original.type === 'OUT' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
            )}>
              {row.original.type === 'IN' ? <ArrowDownLeft className="size-3" /> : 
               row.original.type === 'OUT' ? <ArrowUpRight className="size-3" /> : <History className="size-3" />}
            </div>
            <span className="text-sm font-bold">
              {row.original.type === 'IN' ? 'Entrée' : row.original.type === 'OUT' ? 'Sortie' : 'Ajustement'}
            </span>
          </div>
        ),
        size: 150,
      },
      {
        accessorKey: 'quantity',
        header: ({ column }) => <DataGridColumnHeader title="Quantité" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className={cn("font-bold", row.original.quantity > 0 ? "text-emerald-600 border-emerald-100 bg-emerald-50" : "text-amber-600 border-amber-100 bg-amber-50")}>
            {row.original.quantity > 0 ? `+${row.original.quantity}` : row.original.quantity}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'reason',
        header: ({ column }) => <DataGridColumnHeader title="Motif" column={column} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground italic truncate max-w-[200px] inline-block">{row.original.reason || '-'}</span>,
        size: 200,
      },
      {
        accessorKey: 'user.name',
        header: ({ column }) => <DataGridColumnHeader title="Auteur" column={column} />,
        cell: ({ row }) => <span className="text-sm font-medium">{row.original.user?.name || 'Système'}</span>,
        size: 150,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Date" column={column} />,
        cell: ({ row }) => <span className="text-sm text-muted-foreground">{formatDateTime(row.original.createdAt)}</span>,
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
    data: data?.data || [],
    columns,
    pageCount: Math.ceil((data?.pagination?.total || 0) / pagination.pageSize),
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
      <Card>
        <CardHeader className="py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">Historique des Mouvements</h3>
              <p className="text-xs text-muted-foreground">Suivi détaillé des flux de matériel (entrées, sorties, ajustements)</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.equipment')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-9"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2 border-dashed"
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
              >
                <RefreshCw className={cn("size-4", (isLoading || isRefetching) && "animate-spin")} />
                <span className="font-bold uppercase tracking-wider text-[10px]">Actualiser</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardTable>
          <DataGrid 
            table={table} 
            recordCount={data?.pagination?.total ?? 0}
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
      </Card>

      <InventaireDetailsSheet 
        open={isDetailsSheetOpen} 
        onOpenChange={setIsDetailsSheetOpen} 
        inventaire={selectedInventaireForDetails} 
      />

      <AnimatePresence>
        {selectedRowsCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-popover text-popover-foreground rounded-xl px-4 py-2.5 flex items-center gap-6 shadow-2xl border border-border min-w-[300px]">
              <div className="text-sm font-medium border-r border-border pr-6">
                <span className="text-muted-foreground">{selectedRowsCount} sur {data?.data.length} sélectionnés</span>
              </div>
              <div className="flex items-center gap-4">
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

export default InboundStockTable;
