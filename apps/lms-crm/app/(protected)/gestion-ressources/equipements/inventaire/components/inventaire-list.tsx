'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { buildDataGridListResponse } from '@/lib/gestion-ressources/datagrid-response';
import { useCallback, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
  RefreshCw,
  List,
  LayoutGrid,
  ChevronDown,
  MapPin,
  Eye,
  SquarePen,
  Trash,
} from 'lucide-react';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@repo/ui/card';
import { DataGridApiFetchParams, DataGridApiResponse } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTableRowSelect, DataGridTableRowSelectAll } from '@repo/ui/data-grid-table';
import { EquipmentDataGridCard } from '../../components/equipment-datagrid-card';
import { EquipmentRowActions } from '../../components/equipment-row-actions';
import { EquipmentDeleteDialog } from '../../components/equipment-delete-dialog';
import {
  createModuleLandingPagination,
  DATAGRID_SELECTION_BAR_WRAPPER,
  DATAGRID_SELECTION_BAR_INNER,
  DATAGRID_SELECTION_BAR_ACTIONS,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/dropdown-menu';
import { Input } from '@repo/ui/input';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { InventaireDetailsSheet } from './inventaire-details-sheet';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { EquipmentStockStatsCell } from './equipment-stock-stats-cell';
import { EquipmentThumbnail } from './equipment-thumbnail';
import { EQUIPMENT_HEADQUARTERS_SITE_NAME } from '@/lib/equipment-catalog';

const InventaireList = ({ 
  searchQuery = '', 
  onSearchChange 
}: { 
  searchQuery?: string; 
  onSearchChange?: (val: string) => void 
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  
  const [selectedInventaireForDetails, setSelectedInventaireForDetails] = useState<any>(null);
  const [detailsDefaultTab, setDetailsDefaultTab] = useState('overview');
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'equipements',
    queryKeys: [['equipment-catalog'], ['inventaire-stats']],
  });
  const selectedRowsCount = Object.keys(rowSelection).length;

  const deleteMutation = useMutation({
    mutationFn: async (target: {
      id: string;
      label: string;
      catalogKey?: string;
      isCatalogEntry?: boolean;
    }) => {
      if (target.isCatalogEntry) {
        const response = await apiFetch(
          '/api/sections/gestion-ressources/equipements/inventaire/catalog',
          {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ label: target.catalogKey || target.label }),
          },
        );
        if (!response.ok) {
          const j = await response.json();
          throw new Error(j?.error?.message || 'delete_failed');
        }
        return;
      }
      const response = await apiFetch(
        `/api/sections/gestion-ressources/equipements/inventaire/${target.id}`,
        { method: 'DELETE' },
      );
      if (!response.ok) throw new Error('delete_failed');
    },
    onSuccess: async () => {
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      await queryClient.invalidateQueries({ queryKey: ['inventaire-stats'] });
      toast.success(t('equipment.deletedSuccess'));
    },
    onError: (e: Error) => {
      toast.error(e.message === 'delete_failed' ? t('equipment.deleteFailed') : e.message);
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async (payload: {
      action: 'delete-catalog' | 'set-status-by-label';
      labels: string[];
      status?: string;
    }) => {
      const response = await apiFetch(
        '/api/sections/gestion-ressources/equipements/inventaire/bulk',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        },
      );
      if (!response.ok) {
        const j = await response.json();
        throw new Error(j?.error?.message || 'Action groupée impossible');
      }
      return response.json();
    },
    onSuccess: async (json) => {
      setRowSelection({});
      await queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      await queryClient.invalidateQueries({ queryKey: ['inventaire-stats'] });
      toast.success(json?.data?.message ?? 'Action effectuée');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const fetchCatalog = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<any>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      mode: 'catalog',
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/equipements/inventaire?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement du catalogue');
    const json = await response.json();
    const payload = json?.data ?? json;
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return buildDataGridListResponse(rows, {
      total: payload?.pagination?.total ?? rows.length,
      page: payload?.pagination?.page ?? pageIndex + 1,
    });
  };

  const { data: response, isLoading, error, isError } = useQuery({
    queryKey: ['equipment-catalog', pagination, sorting, searchQuery],
    queryFn: () => fetchCatalog({
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
      sorting,
      searchQuery,
    }),
    retry: 0,
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const handleOpenDetails = useCallback((item: any, tab = 'overview') => {
    setSelectedInventaireForDetails(item);
    setDetailsDefaultTab(tab);
    setIsDetailsSheetOpen(true);
  }, []);

  const handleOpenEdit = useCallback((item: any) => {
    handleOpenDetails(item, 'settings');
  }, [handleOpenDetails]);

  const handleRequestDelete = useCallback((item: any) => {
    setDeleteTarget(item);
  }, []);

  const columns = useMemo<ColumnDef<any>[]>(
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
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.categoryModel')} column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <EquipmentThumbnail
              avatar={row.original.avatar}
              metadata={row.original.metadata}
              label={row.original.label}
              className="size-12 rounded-lg border border-border/50"
            />
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(row.original)}>
                {row.original.label}
              </span>
              <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                {row.original.isCatalogEntry
                  ? `${row.original.unitCount ?? 0} unité(s) au stock école`
                  : `Réf. ${row.original.serialNumber || 'N/A'}`}
              </span>
            </div>
          </div>
        ),
        size: 350,
      },
      {
        id: 'stockBreakdown',
        header: ({ column }) => <DataGridColumnHeader title="Stock & répartition" column={column} />,
        meta: {
          headerTitle: 'Compteurs par statut (disponibles / en utilisation / maintenance)',
        },
        cell: ({ row }) => (
          <EquipmentStockStatsCell
            stats={row.original.stockStats}
            unitCount={row.original.unitCount}
            catalogView
          />
        ),
        size: 220,
      },
      {
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type Technique" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" size="sm" className="font-bold uppercase text-[9px] tracking-widest text-primary border-primary/20 bg-primary/5 px-2">
            {row.original.type || 'NON DÉFINI'}
          </Badge>
        ),
        size: 200,
      },
      {
        accessorKey: 'assignedSite',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-muted-foreground" />
            <span className="text-sm text-foreground/80">
              {row.original.assignedSite?.name || EQUIPMENT_HEADQUARTERS_SITE_NAME}
            </span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Ajouté le" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt ? formatDateTime(new Date(row.original.createdAt)) : '-'}
          </span>
        ),
        size: 200,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <EquipmentRowActions
            onView={() => handleOpenDetails(row.original)}
            onEdit={() => handleOpenEdit(row.original)}
            onDelete={() => handleRequestDelete(row.original)}
          />
        ),
        size: 120,
        enableSorting: false,
        enableResizing: false,
      },
    ],
    [handleOpenDetails, handleOpenEdit, handleRequestDelete],
  );

  const table = useReactTable({
    columns,
    data: items,
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

  const getSelectedCatalogLabels = useCallback(() => {
    return table
      .getSelectedRowModel()
      .rows.map((row) => row.original.catalogKey || row.original.label)
      .filter(Boolean);
  }, [table]);

  const listToolbar = (
    <CardHeader className="py-3">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
              <div>
                <h3 className="text-base font-semibold text-foreground">Catalogue du matériel</h3>
                <p className="text-xs text-muted-foreground">
                  Référentiel par catégorie — vue liste ou cartes, fiche détail par équipement.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Badge variant="outline" className="h-10 px-3 border-dashed font-bold text-foreground/60 uppercase text-[10px]">
                  {totalCount} Catégorie{totalCount > 1 ? 's' : ''}
                </Badge>
                <div className="relative w-full sm:w-80">
                  <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder={t('datagrid.search.equipment')}
                    value={searchQuery}
                    onChange={(e) => onSearchChange?.(e.target.value)}
                    className="ps-9 h-10"
                  />
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border h-10 shadow-sm">
                    <Button
                      variant={view === 'table' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-8 gap-2 px-3"
                      onClick={() => setView('table')}
                    >
                      <List className="size-4" />
                      Liste
                    </Button>
                    <Button
                      variant={view === 'grid' ? 'secondary' : 'ghost'}
                      size="sm"
                      className="h-8 gap-2 px-3"
                      onClick={() => setView('grid')}
                    >
                      <LayoutGrid className="size-4" />
                      Cartes
                    </Button>
                  </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
                  <span className="font-bold uppercase tracking-wider text-[11px]">{t('datagrid.sync')}</span>
                </Button>
              </div>
            </div>
          </div>
    </CardHeader>
  );

  const gridViewBody =
    view === 'grid' ? (
      <>
        <CardContent className="border-t border-border p-5">
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          >
{isLoading ? (
               Array.from({ length: 8 }).map((_, i) => (
                 <Card key={i} className="animate-pulse h-64 bg-muted/20" />
               ))
             ) : items.length > 0 ? (
               items.map((item: any) => (
                <Card key={item.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden flex flex-col">
                  <EquipmentThumbnail
                    avatar={item.avatar}
                    metadata={item.metadata}
                    label={item.label}
                    className="w-full aspect-[4/3] border-0 border-b border-border/50 bg-muted/15"
                  />
                  <CardContent className="p-5 flex flex-col flex-1">
                    <div className="flex flex-col items-center text-center">
                      <h4 className="font-bold text-foreground mb-1 line-clamp-2">{item.label}</h4>
                      <p className="text-xs text-muted-foreground mb-4 uppercase tracking-widest">{item.type || 'SANS TYPE'}</p>
                      
                      <div className="flex flex-col gap-2 w-full py-3 border-y border-border/50 mb-4">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter text-center">
                          {item.isCatalogEntry
                            ? `${item.unitCount ?? 0} unité(s) au stock école`
                            : `Réf. ${item.serialNumber || 'N/A'}`}
                        </p>
                        <div className="flex justify-center">
                          <EquipmentStockStatsCell
                            stats={item.stockStats}
                            unitCount={item.unitCount}
                            compact
                            catalogView={Boolean(item.isCatalogEntry)}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full mt-auto">
                        <Button variant="outline" size="sm" className="flex-1 h-9" onClick={() => handleOpenDetails(item)}>
                          <Eye className="size-3.5 mr-2" />
                          Détails
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="size-9 p-0 bg-primary/5 border-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <SquarePen className="size-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="size-9 p-0 bg-destructive/5 border-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all"
                          onClick={() => handleRequestDelete(item)}
                        >
                          <Trash className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
))
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  Aucun équipement trouvé.
                </div>
              )}
          </motion.div>
        </CardContent>
        <CardFooter>
          <DataGridPagination />
        </CardFooter>
      </>
    ) : undefined;

  return (
    <div className="w-full">
      <EquipmentDataGridCard
        table={table}
        recordCount={totalCount}
        isLoading={isLoading}
        toolbar={listToolbar}
        alternateBody={gridViewBody}
      />

      <InventaireDetailsSheet
        key={
          selectedInventaireForDetails?.catalogKey ??
          selectedInventaireForDetails?.id ??
          'catalog-sheet'
        }
        open={isDetailsSheetOpen}
        onOpenChange={setIsDetailsSheetOpen}
        inventaire={selectedInventaireForDetails}
        defaultTab={detailsDefaultTab}
      />

      <EquipmentDeleteDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        label={deleteTarget?.label}
        unitCount={deleteTarget?.unitCount}
        isCatalogEntry={deleteTarget?.isCatalogEntry !== false}
        isPending={deleteMutation.isPending}
        onConfirm={() => {
          if (deleteTarget?.id) {
            deleteMutation.mutate({
              id: deleteTarget.id,
              label: deleteTarget.label,
              catalogKey: deleteTarget.catalogKey,
              isCatalogEntry: deleteTarget.isCatalogEntry !== false,
            });
          }
        }}
      />

      <AnimatePresence>
        {selectedRowsCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className={DATAGRID_SELECTION_BAR_WRAPPER}
          >
            <div className={DATAGRID_SELECTION_BAR_INNER}>
              <div className="text-sm font-medium sm:border-r sm:border-border sm:pr-6">
                <span className="text-muted-foreground">{selectedRowsCount} sur {items.length} sélectionnés</span>
              </div>
              <div className={DATAGRID_SELECTION_BAR_ACTIONS}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                      {t('datagrid.changeStatus')} <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem
                      className="hover:bg-accent font-bold uppercase text-[10px]"
                      onClick={() => {
                        const labels = getSelectedCatalogLabels();
                        if (labels.length) {
                          bulkMutation.mutate({
                            action: 'set-status-by-label',
                            labels,
                            status: 'AVAILABLE',
                          });
                        }
                      }}
                    >
                      Disponible
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-accent font-bold uppercase text-[10px]"
                      onClick={() => {
                        const labels = getSelectedCatalogLabels();
                        if (labels.length) {
                          bulkMutation.mutate({
                            action: 'set-status-by-label',
                            labels,
                            status: 'MAINTENANCE',
                          });
                        }
                      }}
                    >
                      En Maintenance
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="hover:bg-accent font-bold uppercase text-[10px] text-destructive"
                      onClick={() => {
                        const labels = getSelectedCatalogLabels();
                        if (labels.length) {
                          bulkMutation.mutate({
                            action: 'set-status-by-label',
                            labels,
                            status: 'OUT_OF_SERVICE',
                          });
                        }
                      }}
                    >
                      Hors Service
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300 transition-colors ml-4"
                  disabled={bulkMutation.isPending}
                  onClick={() => {
                    const labels = getSelectedCatalogLabels();
                    if (
                      labels.length &&
                      window.confirm(
                        `Supprimer ${labels.length} catégorie(s) et toutes leurs pièces ?`,
                      )
                    ) {
                      bulkMutation.mutate({ action: 'delete-catalog', labels });
                    }
                  }}
                >
                  <Trash className="size-4" /> {t('datagrid.delete')}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventaireList;
