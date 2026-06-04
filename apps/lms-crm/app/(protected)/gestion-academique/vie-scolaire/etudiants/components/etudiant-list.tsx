'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState, type ReactNode } from 'react';
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
import { User as Etudiant, UserStatus } from '@/app/models/user';
import { getEtudiantStatusProps } from '../constants/status';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { etudiantsListQueryKey, etudiantsStatsQueryKey } from '../constants/query-keys';
import { EtudiantDetailsSheet } from './etudiant-details-sheet';


const EtudiantList = ({
  leaderSlot,
  scopeTabs,
}: {
  leaderSlot: ReactNode;
  scopeTabs: ReactNode;
}) => {
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
  const selectedRole = null as string | null;
  const selectedStatus = 'all';
  const selectedCategory = 'all';
  const [selectedEtudiantForDetails, setSelectedEtudiantForDetails] = useState<Etudiant | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await queryClient.invalidateQueries({ queryKey: [...etudiantsListQueryKey] });
    await queryClient.invalidateQueries({ queryKey: [...etudiantsStatsQueryKey] });

    setTimeout(() => {
      setIsSyncing(false);
      toast.custom(
        (toastId) => (
          <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
            <AlertIcon>
              <RiCheckboxCircleFill className="size-4 text-green-600" />
            </AlertIcon>
            <AlertTitle>{t('datagrid.syncSuccess')}</AlertTitle>
          </Alert>
        ),
        {
          duration: 3000,
          position: 'top-center',
        },
      );
    }, 800);
  };

  const deleteMutation = useMutation({
    mutationFn: async (EtudiantId: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/Etudiants/${EtudiantId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(
          (error as { message?: string })?.message ||
            "Échec de la suppression de l'étudiant.",
        );
      }
      return response.json();
    },
    onSuccess: (_, EtudiantId) => {
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon><RiCheckboxCircleFill className="size-4 text-green-600" /></AlertIcon>
          <AlertTitle>{t('crud.studentDeleted')}</AlertTitle>
        </Alert>
      ));
      queryClient.invalidateQueries({ queryKey: [...etudiantsListQueryKey] });
      queryClient.invalidateQueries({ queryKey: [...etudiantsStatsQueryKey] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const fetchEtudiants = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
    selectedRole,
    selectedStatus,
    selectedCategory,
  }: DataGridApiFetchParams & {
    selectedRole: string | null;
    selectedStatus: string | null;
    selectedCategory: string | null;
  }): Promise<DataGridApiResponse<Etudiant>> => {
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
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/rh/Etudiants?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des étudiants.');
    const result = await response.json();
    
    return {
      data: result.data || [],
      pagination: result.pagination || { total: 0, page: 1 },
      empty: !result.data || result.data.length === 0
    };
  };

  const { data, isLoading } = useQuery({
    queryKey: [
      ...etudiantsListQueryKey,
      pagination,
      sorting,
      searchQuery,
      selectedRole,
      selectedStatus,
      selectedCategory,
    ],
    queryFn: () =>
      fetchEtudiants({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        searchQuery,
        selectedRole,
        selectedStatus,
        selectedCategory,
      }),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenDetails = (Etudiant: Etudiant) => {
    setSelectedEtudiantForDetails(Etudiant);
    setIsDetailsSheetOpen(true);
  };

  const handleDeleteEtudiant = (Etudiant: Etudiant) => {
    if (confirm(t('crud.deleteStudentConfirm', { name: Etudiant.name ?? Etudiant.email ?? '' }))) {
      deleteMutation.mutate(Etudiant.id);
    }
  };

  const columns = useMemo<ColumnDef<Etudiant>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => <DataGridTableRowSelectAll table={table} />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 50,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Candidat" column={column} />,
        cell: ({ row }) => {
          const Etudiant = row.original;
          const initials = getInitials(Etudiant.name || Etudiant.email);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                {Etudiant.avatar && <AvatarImage src={Etudiant.avatar} alt={Etudiant.name || ''} />}
                <AvatarFallback>{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                   <AvatarStatus variant={Etudiant.status === 'ACTIVE' ? "online" : "offline"} className="size-2.5" />
                </AvatarIndicator>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(Etudiant)}>
                  {Etudiant.name}
                </span>
                <span className="text-muted-foreground text-xs">{Etudiant.email}</span>
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
          const raw = category != null ? String(category) : '';
          const label = raw
            ? t(`datagrid.categories.${raw}`, { defaultValue: raw })
            : '—';
          return <Badge variant="primary" appearance="light" size="sm" className="font-bold uppercase text-[10px] tracking-wider">{label}</Badge>;
        },
        size: 130,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const statusProps = getEtudiantStatusProps(row.original.status as UserStatus);
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
            <Button variant="ghost" mode="icon" className="size-8 text-destructive hover:text-destructive" onClick={() => handleDeleteEtudiant(row.original)}>
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
    getRowId: (row: Etudiant) => row.id,
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
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          {leaderSlot}
          <div className="relative w-full">
            <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('datagrid.search.candidate')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 ps-9"
            />
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0">{scopeTabs}</div>
            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end lg:shrink-0">
              <div className="flex h-10 shrink-0 items-center rounded-md border border-dashed border-border bg-muted/20 px-3 text-[11px] text-muted-foreground">
                Filtre : comptes rôle apprenant
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0 gap-2 border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
                <span className="text-[11px] font-bold uppercase tracking-wider">Synchroniser</span>
              </Button>
              <div className="flex h-10 shrink-0 items-center gap-2 rounded-lg border bg-muted/50 p-1 shadow-sm">
                <Button
                  type="button"
                  variant={view === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 gap-2"
                  onClick={() => setView('table')}
                >
                  <List className="size-4" />
                  {t('datagrid.listView')}
                </Button>
                <Button
                  type="button"
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

      <Tabs
        value={view}
        onValueChange={(v) => setView(v as 'table' | 'grid')}
        className="w-full"
      >
        <TabsContent value="table" className="mt-0">
           <DataGrid
             table={table}
             recordCount={data?.pagination?.total || 0}
             isLoading={isLoading}
             tableLayout={{ columnsResizable: true, columnsPinnable: true, columnsMovable: true, columnsVisibility: true }}
            tableClassNames={{
              bodyRow: (row) => cn(
                "transition-colors relative",
                row.getIsSelected() && "bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary"
              )
            }}
          >
            <Card className="border-border shadow-none">
              <CardTable>
                <ScrollArea>
                  <DataGridTable />
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </CardTable>
              <CardFooter className="border-t border-border">
                <DataGridPagination />
              </CardFooter>
            </Card>
          </DataGrid>
        </TabsContent>

        <TabsContent value="grid" className="mt-0 px-5 pb-5 pt-4">
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
                   {data?.data?.map((Etudiant: Etudiant) => {
                     const statusProps = getEtudiantStatusProps(Etudiant.status as UserStatus);
                     return (
                       <Card key={Etudiant.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
                         <CardContent className="p-6">
                           <div className="flex flex-col items-center text-center">
                             <div className="relative mb-4">
                               <Avatar className="size-20 border-2 border-background shadow-lg">
                                 {Etudiant.avatar && <AvatarImage src={Etudiant.avatar} alt={Etudiant.name || ''} />}
                                 <AvatarFallback className="text-xl">{getInitials(Etudiant.name || Etudiant.email)}</AvatarFallback>
                               </Avatar>
                               <AvatarIndicator className="-end-1 -top-1">
                                 <AvatarStatus variant={Etudiant.status === 'ACTIVE' ? "online" : "offline"} className="size-3.5 border-2 border-background" />
                               </AvatarIndicator>
                             </div>

                             <div className="space-y-1 mb-4">
                               <h4 className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(Etudiant)}>
                                 {Etudiant.name}
                               </h4>
                               <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                                 <Mail className="size-3" />
                                 <span className="truncate max-w-[180px]">{Etudiant.email}</span>
                               </div>
                             </div>

                             <div className="flex flex-wrap justify-center gap-2 mb-6">
                                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] font-bold uppercase">
                                  {(() => {
                                    const c = Etudiant.userCategory;
                                    const raw = c != null ? String(c) : '';
                                    return raw
                                      ? t(`datagrid.categories.${raw}`, { defaultValue: raw })
                                      : '—';
                                  })()}
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
                                 <span className="text-xs font-medium text-foreground/80">{Etudiant.jobFunction || '-' }</span>
                               </div>
                               <div className="flex gap-1">
                                 <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenDetails(Etudiant)}>
                                   <Eye className="size-4" />
                                 </Button>
                                 <Button variant="ghost" size="icon" className="size-8 text-destructive" onClick={() => handleDeleteEtudiant(Etudiant)}>
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
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="bg-popover text-popover-foreground rounded-xl px-4 py-2.5 flex items-center gap-6 shadow-2xl border border-border min-w-[500px]">
              <div className="text-sm font-medium border-r border-border pr-6">
                 <span className="text-muted-foreground">{selectedRowsCount} sur {Array.isArray(data?.data) ? data.data.length : 0} sélectionné(s)</span>
              </div>
              <div className="flex items-center gap-4">
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

      <EtudiantDetailsSheet 
        open={isDetailsSheetOpen} 
        onOpenChange={setIsDetailsSheetOpen} 
        Etudiant={selectedEtudiantForDetails} 
      />
    </>
  );
};

export default EtudiantList;




