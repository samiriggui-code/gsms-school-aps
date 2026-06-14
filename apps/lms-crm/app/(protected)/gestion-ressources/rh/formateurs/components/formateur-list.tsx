'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE, DATAGRID_SELECTION_BAR_WRAPPER, DATAGRID_SELECTION_BAR_INNER, DATAGRID_SELECTION_BAR_ACTIONS } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
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
  Eye, 
  SquarePen, 
  Trash, 
  Info,
  Download,
  Copy,
  ChevronDown,
  LayoutGrid,
  List,
  Mail,
  Briefcase,
  ExternalLink,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { RiCheckboxCircleFill } from '@remixicon/react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { User as Formateur, UserStatus } from '@/app/models/user';
import { getFormateurStatusProps } from '../constants/status';
import { userPresenceAvatarVariant } from '@/lib/rh/user-absence-ui';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { FormateurDetailsSheet } from './formateur-details-sheet';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';

const FormateurList = () => {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileType] = useState<'formateur'>('formateur');
  const selectedRole = null;
  const selectedStatus = 'all';
  const selectedCategory = 'all';
  
  const [selectedFormateurForDetails, setSelectedFormateurForDetails] = useState<Formateur | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'rhPersonnel',
    queryKeys: [['rh-formateurs'], ['rh-formateurs-stats'], ['dashboard-stats', 'rh']],
  });

  const deleteMutation = useMutation({
    mutationFn: async (collaborateurId: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/collaborateurs/${collaborateurId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec de la suppression du formateur');
      }
      return response.json();
    },
    onSuccess: (_, collaborateurId) => {
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon><RiCheckboxCircleFill className="size-4 text-green-600" /></AlertIcon>
          <AlertTitle>{t('crud.trainerDeleted')}</AlertTitle>
        </Alert>
      ));
      queryClient.invalidateQueries({ queryKey: ['rh-formateurs'] });
      queryClient.invalidateQueries({ queryKey: ['rh-formateurs-stats'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const fetchFormateurs = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
    selectedRole,
    selectedStatus,
    selectedCategory,
    selectedProfileType,
  }: DataGridApiFetchParams & {
    selectedRole: string | null;
    selectedStatus: string | null;
    selectedCategory: string | null;
    selectedProfileType: 'all' | 'collaborateur' | 'formateur' | 'interne';
  }): Promise<DataGridApiResponse<Formateur>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(selectedRole && selectedRole !== 'all' ? { roleId: selectedRole } : {}),
      ...(selectedStatus && selectedStatus !== 'all' ? { status: selectedStatus } : {}),
      ...(selectedCategory && selectedCategory !== 'all' ? { userCategory: selectedCategory } : {}),
      ...(selectedProfileType && selectedProfileType !== 'all'
        ? { profileType: selectedProfileType }
        : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/rh/collaborateurs?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des formateurs');
    const result = await response.json();
    
    return {
      data: result.data || [],
      pagination: result.pagination || { total: 0, page: 1 },
      empty: !result.data || result.data.length === 0
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      'rh-formateurs',
      pagination,
      sorting,
      searchQuery,
      selectedRole,
      selectedStatus,
      selectedCategory,
      selectedProfileType,
    ],
    queryFn: () =>
      fetchFormateurs({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
        selectedRole,
        selectedStatus,
        selectedCategory,
        selectedProfileType,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenDetails = (formateur: Formateur) => {
    setSelectedFormateurForDetails(formateur);
    setIsDetailsSheetOpen(true);
  };

  const handleDeleteFormateur = (formateur: Formateur) => {
    if (confirm(t('crud.deleteTrainerConfirm', { name: formateur.name ?? formateur.email ?? '' }))) {
      deleteMutation.mutate(formateur.id);
    }
  };

  const columns = useMemo<ColumnDef<Formateur>[]>(
    () => [
      {
        id: 'select',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.trainer')} column={column} />,
        cell: ({ row }) => {
          const formateur = row.original;
          const initials = getInitials(formateur.name || formateur.email);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                {formateur.avatar && <AvatarImage src={formateur.avatar} alt={formateur.name || ''} />}
                <AvatarFallback>{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                   <AvatarStatus variant={userPresenceAvatarVariant(formateur)} className="size-2.5" />
                </AvatarIndicator>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(formateur)}>
                  {formateur.name}
                </span>
                <span className="text-muted-foreground text-xs">{formateur.email}</span>
              </div>
            </div>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'qualification',
        id: 'qualification',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.qualification')} column={column} />,
        cell: ({ row }) => {
          const qualification = row.original.qualification;
          return qualification ? (
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-3.5 text-primary" />
              <span className="text-sm font-medium">{qualification}</span>
            </div>
          ) : '-';
        },
        size: 200,
      },
      {
        accessorKey: 'userCategory',
        id: 'userCategory',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.category')} column={column} />,
        cell: ({ row }) => {
          const category = row.original.userCategory;
          const label = { 'INTERNAL': 'Interne', 'CLIENT': 'Client', 'SUBCONTRACTOR': 'Sous-traitant' }[category as string] || category;
          return <Badge variant="primary" appearance="light" size="sm" className="font-bold uppercase text-[10px] tracking-wider">{label}</Badge>;
        },
        size: 130,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const statusProps = getFormateurStatusProps(row.original.status as UserStatus);
          return (
            <Badge 
              variant={statusProps.variant as any} 
              appearance="light"
              size="sm"
              className="font-bold uppercase text-[10px] tracking-wider"
            >
              {statusProps.label}
            </Badge>
          );
        },
        size: 120,
      },
      {
        accessorKey: 'lastSignInAt',
        id: 'lastSignInAt',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.lastLogin')} column={column} />,
        cell: (info) => info.getValue() ? formatDateTime(new Date(info.getValue() as string)) : <span className="text-muted-foreground text-xs">Jamais</span>,
        size: 175,
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        minSize: 130,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pr-2">
            <Button variant="ghost" mode="icon" className="size-8" onClick={() => handleOpenDetails(row.original)}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" mode="icon" className="size-8" onClick={() => handleOpenDetails(row.original)}>
              <SquarePen className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" mode="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDeleteFormateur(row.original)}>
              <Trash className="size-4" />
            </Button>
          </div>
        ),
      },
    ],
    [],
  );

   const table = useReactTable({
    columns,
    data: Array.isArray(data?.data) ? data.data : [],
    pageCount: Math.ceil(((Array.isArray(data?.data) && data?.pagination?.total) || 0) / pagination.pageSize),
    getRowId: (row: Formateur) => row.id,
    state: { pagination, sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
  });

  const selectedRowsCount = Object.keys(rowSelection).length;

  return (
    <>
      <Card className="mb-5">
        <CardHeader className="py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">Liste des formateurs</h3>
              <p className="text-xs text-muted-foreground">Comptes avec le rôle formateur · recherche et vues liste/cartes</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.trainer')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10"
                />
              </div>
              <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-3 h-10 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                Filtre actif&nbsp;: rôle formateur
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-10 gap-2 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn("size-4", isSyncing && "animate-spin")} />
                <span className="font-bold uppercase tracking-wider text-[11px]">{t('datagrid.sync')}</span>
              </Button>
              <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-lg border h-10 shadow-sm">
                <Button
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setView('table')}
                >
                  <List className="size-4" />
                  {t('datagrid.listView')}
                </Button>
                <Button
                  variant={view === 'grid' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setView('grid')}
                >
                  <LayoutGrid className="size-4" />
                  {t('datagrid.gridView')}
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')} className="w-full">
        <TabsContent value="table" className="mt-0">
           <DataGrid
             table={table}
             recordCount={data?.pagination?.total || 0}
             isLoading={isLoading}
             tableLayout={{ columnsResizable: true, columnsPinnable: true, columnsMovable: true, columnsVisibility: true }}
            tableClassNames={{
              bodyRow: 'transition-colors relative',
            }}
          >
            <Card>
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
              <CardFooter>
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </TabsContent>

         <TabsContent value="grid" className="mt-0">
           <DataGrid
             table={table}
             recordCount={data?.pagination?.total || 0}
             isLoading={isLoading}
           >
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {isLoading ? (
                 Array.from({ length: 8 }).map((_, i) => (
                   <Card key={i} className="animate-pulse h-64 bg-muted/20" />
                 ))
               ) : (
                 <>
                   {data?.data?.map((formateur: Formateur) => {
                     const statusProps = getFormateurStatusProps(formateur.status as UserStatus);
                     return (
                       <Card key={formateur.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
                         <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                             <div className="relative mb-4">
                               <Avatar className="size-20 border-2 border-background shadow-lg">
                                 {formateur.avatar && <AvatarImage src={formateur.avatar} alt={formateur.name || ''} />}
                                 <AvatarFallback className="text-xl">{getInitials(formateur.name || formateur.email)}</AvatarFallback>
                               </Avatar>
                               <AvatarIndicator className="-end-1 -top-1">
                                 <AvatarStatus variant={userPresenceAvatarVariant(formateur)} className="size-3.5 border-2 border-background" />
                               </AvatarIndicator>
                             </div>

                             <div className="space-y-1 mb-4">
                               <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(formateur)}>
                                 {formateur.name}
                               </h4>
                               <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                 <Mail className="size-3" />
                                 <span className="truncate max-w-[180px]">{formateur.email}</span>
                               </div>
                             </div>

                             <div className="flex flex-wrap justify-center gap-2 mb-6">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase">
                                  {({ 'INTERNAL': 'Interne', 'CLIENT': 'Client', 'SUBCONTRACTOR': 'Sous-traitant' } as any)[formateur.userCategory as string] || formateur.userCategory}
                                </Badge>
                               <Badge 
                                 variant={statusProps.variant as any} 
                                 className={cn(
                                   "text-[10px] font-bold uppercase",
                                   statusProps.variant === 'success' && "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none",
                                   statusProps.variant === 'warning' && "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none",
                                   statusProps.variant === 'destructive' && "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none"
                                 )}
                               >
                                 {statusProps.label}
                               </Badge>
                             </div>

                             <div className="w-full pt-4 border-t border-dashed border-border flex items-center justify-between gap-2">
                               <div className="flex flex-col items-start">
                                 <span className="text-[10px] text-muted-foreground uppercase font-semibold">Fonction</span>
                                 <span className="text-xs font-medium text-foreground/80">{formateur.jobFunction || '-' }</span>
                               </div>
                               <div className="flex gap-1">
                                 <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenDetails(formateur)}>
                                   <Eye className="size-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteFormateur(formateur)}>
                                   <Trash className="size-4" />
                                 </Button>
                               </div>
                             </div>
                           </div>
                         </CardContent>
                       </Card>
                     );
                   })}
                 </>
               )}
             </div>
             <div className="mt-8 flex justify-center">
               <DataGridPagination />
            </div>
           </DataGrid>
         </TabsContent>
      </Tabs>

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
                 <span className="text-muted-foreground">{selectedRowsCount} sur {Array.isArray(data?.data) ? data.data.length : 0} sélectionnés</span>
              </div>
              <div className={DATAGRID_SELECTION_BAR_ACTIONS}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                      {t('datagrid.changeStatus')} <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem className="hover:bg-accent">Actif</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent">Inactif</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent text-destructive">Suspendu</DropdownMenuItem>
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

      <FormateurDetailsSheet 
        open={isDetailsSheetOpen} 
        onOpenChange={setIsDetailsSheetOpen} 
        collaborateur={selectedFormateurForDetails} 
      />
    </>
  );
};

export default FormateurList;
