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
  ChevronDown,
  Copy,
  Download,
  Trash,
  Layers,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { cn } from '@/lib/utils';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { InventaireDetailsSheet } from './inventaire-details-sheet';

export interface IStockSummary {
  id: string;
  label: string;
  type: string | null;
  serialNumber: string;
  assignedSite: {
    name: string;
  } | null;
  stockStats?: {
    totalIn: number;
    totalOut: number;
    currentStock: number;
    maintenance: number;
    available: number;
  };
}

export function AllStockTable({ 
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
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [selectedInventaireForDetails, setSelectedInventaireForDetails] = useState<any>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const selectedRowsCount = Object.keys(rowSelection).length;

  const fetchStockSummary = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<IStockSummary>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      status: 'AVAILABLE',
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement du stock disponible');
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
    queryKey: ['equipment-stock-available', pagination, sorting, searchQuery],
    queryFn: () => fetchStockSummary({
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

  const columns = useMemo<ColumnDef<IStockSummary>[]>(
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
          <div className="flex items-center gap-3 min-w-0">
            <div className="size-9 shrink-0 rounded-md border border-border/50 bg-primary/10 flex items-center justify-center">
              <Package className="size-4 text-primary" />
            </div>
            <div className="flex flex-col min-w-0 overflow-hidden">
              <span 
                className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                onClick={() => handleOpenDetails(row.original)}
              >
                {row.original.label}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider truncate">{row.original.serialNumber}</span>
            </div>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.category')} column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="font-bold uppercase text-[10px] bg-muted/30 truncate max-w-[120px]">
            {row.original.type || '-'}
          </Badge>
        ),
        size: 130,
      },
      {
        accessorKey: 'assignedSite',
        header: ({ column }) => <DataGridColumnHeader title="Emplacement actuel" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-foreground/80 truncate">
            <span className="size-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="truncate">{row.original.assignedSite?.name || 'Dépôt Central'}</span>
          </div>
        ),
        size: 180,
      },
      {
        id: 'stockFlow',
        header: ({ column }) => <DataGridColumnHeader title="Stock Flow" column={column} />,
        cell: ({ row }) => {
          const stats = row.original.stockStats || { currentStock: 0, totalIn: 0, totalOut: 0 };
          return (
            <TooltipProvider delayDuration={0}>
              <div className="flex items-center gap-2.5 text-xs font-semibold text-foreground/70">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <Layers className="size-3.5 text-muted-foreground" />
                      <span className={cn(stats.currentStock > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                        {stats.currentStock}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white text-[10px] py-1 px-2 border-none">
                    En Stock
                  </TooltipContent>
                </Tooltip>

                <div className="h-3 w-px bg-border/60" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <ArrowDownLeft className="size-3.5 text-emerald-500" />
                      <span className={cn(stats.totalIn > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                        {stats.totalIn}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white text-[10px] py-1 px-2 border-none">
                    Affectations
                  </TooltipContent>
                </Tooltip>

                <div className="h-3 w-px bg-border/60" />

                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1 cursor-help">
                      <ArrowUpRight className="size-3.5 text-amber-500" />
                      <span className={cn(stats.totalOut > 0 ? "text-foreground" : "text-muted-foreground/40")}>
                        {stats.totalOut}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="bg-black text-white text-[10px] py-1 px-2 border-none">
                    En Maintenance
                  </TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          );
        },
        size: 160,
      },
      {
        id: 'actions',
        header: () => <div className="text-right px-4">Actions</div>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-2 px-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="size-8 p-0"
              onClick={() => handleOpenDetails(row.original)}
            >
              <Eye className="size-4 text-muted-foreground hover:text-primary" />
            </Button>
          </div>
        ),
        size: 100,
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
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const totalAvailableInStock = totalCount;

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
        defaultTab="mouvements"
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
