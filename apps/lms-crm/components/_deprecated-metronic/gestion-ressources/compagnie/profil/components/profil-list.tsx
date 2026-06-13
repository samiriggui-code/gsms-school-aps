'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

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
  Phone,
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
import { UserStatus } from '@/app/models/user';
import { getCollaborateurStatusProps } from '../constants/status';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import { ProfilDetailsSheet } from './profil-details-sheet';

const resolveProfilContact = (profil: any) => {
  const email = profil?.email || profil?.contactEmail || '';
  const phone = profil?.phone || profil?.contactPhone || '';
  return { email, phone };
};

export const ProfilList = () => {
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
  const selectedRole = null;
  const selectedStatus = 'all';
  const selectedCategory = 'all';
  
  const [selectedProfilForDetails, setSelectedProfilForDetails] = useState<any | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSync = async () => {
    setIsSyncing(true);
    await queryClient.invalidateQueries({ queryKey: ['profils-list'] });
    
    setTimeout(() => {
      setIsSyncing(false);
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon><RiCheckboxCircleFill className="size-4 text-green-600" /></AlertIcon>
          <AlertTitle>{t('datagrid.syncSuccess')}</AlertTitle>
        </Alert>
      ), {
        duration: 3000,
        position: 'top-center'
      });
    }, 800);
  };

  const deleteMutation = useMutation({
    mutationFn: async (profilId: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/prestataires/${profilId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Échec de la suppression du prestataire');
      }
      return response.json();
    },
    onSuccess: (_, profilId) => {
      toast.custom((toastId) => (
        <Alert variant="mono" icon="success" onClose={() => toast.dismiss(toastId)}>
          <AlertIcon><RiCheckboxCircleFill className="size-4 text-green-600" /></AlertIcon>
          <AlertTitle>{t('crud.vendorDeleted')}</AlertTitle>
        </Alert>
      ));
      queryClient.invalidateQueries({ queryKey: ['profils-list'] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const fetchProfils = async ({
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
  }): Promise<DataGridApiResponse<any>> => {
    const sortField = sorting?.[0]?.id || '';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(selectedRole && selectedRole !== 'all' ? { roleId: selectedRole } : {}),
      ...(selectedStatus && selectedStatus !== 'all' ? { status: selectedStatus } : {}),
      ...(selectedCategory && selectedCategory !== 'all' ? { category: selectedCategory } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/partenaires/prestataires?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des prestataires');
    return response.json();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['profils-list', pagination, sorting, searchQuery, selectedRole, selectedStatus, selectedCategory],
    queryFn: () => fetchProfils({ pageIndex: pagination.pageIndex, pageSize: pagination.pageSize, sorting, searchQuery, selectedRole, selectedStatus, selectedCategory }),
    staleTime: 1000 * 60 * 5,
  });

  const handleOpenDetails = (profil: any) => {
    setSelectedProfilForDetails(profil);
    setIsDetailsSheetOpen(true);
  };

  const handleDeleteProfil = (profil: any) => {
    if (confirm(t('crud.deleteVendorConfirm', { name: profil.name ?? '' }))) {
      deleteMutation.mutate(profil.id);
    }
  };

  const columns = useMemo<ColumnDef<any>[]>(
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
          header: ({ column }) => <DataGridColumnHeader title="Entreprise / Partenaire" column={column} />,
          cell: ({ row }) => {
            const profil = row.original;
            const { email } = resolveProfilContact(profil);
            const initials = getInitials(profil.name || email);
            return (
              <div className="flex items-center gap-3">
                <Avatar className="size-9 rounded-lg">
                  {profil.avatar && <AvatarImage src={profil.avatar} alt={profil.name || ''} />}
                  <AvatarFallback className="rounded-lg">{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                   <AvatarStatus variant={profil.status === 'ACTIVE' ? "online" : "offline"} className="size-2.5" />
                </AvatarIndicator>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(profil)}>
                  {profil.name}
                </span>
                <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-tighter">SIRET: {profil.siret || 'N/A'}</span>
              </div>
            </div>
          );
        },
        size: 250,
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type / Métier" column={column} />,
        cell: ({ row }) => {
          const profil = row.original;
          const isSub = profil.type === 'SUBCONTRACTOR';
          return (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <Badge variant={isSub ? "warning" : "info"} appearance="light" size="sm" className="font-bold text-[9px] uppercase">
                  {isSub ? 'Sous-traitant' : 'Prestataire'}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground font-medium truncate max-w-[150px]">
                {isSub ? 'Sécurité Privée' : (profil.service || 'Services Généraux')}
              </span>
            </div>
          );
        },
        size: 200,
      },
        {
          id: 'email',
          accessorFn: (row) => resolveProfilContact(row).email,
          header: ({ column }) => <DataGridColumnHeader title="Contact" column={column} />,
          cell: ({ row }) => {
            const profil = row.original;
            const { email, phone } = resolveProfilContact(profil);
            const emailLabel = email || 'N/A';
            const phoneLabel = phone || 'N/A';
            return (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5 text-xs font-medium">
                  <Mail className="size-3 text-muted-foreground" />
                  {emailLabel}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <Phone className="size-3" />
                  {phoneLabel}
                </div>
              </div>
            );
          },
          size: 200,
        },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusProps = status === 'ACTIVE' ? { label: 'Actif', variant: 'success' } : { label: 'Inactif', variant: 'warning' };
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
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Date d'ajout" column={column} />,
        cell: (info) => info.getValue() ? formatDateTime(new Date(info.getValue() as string)) : <span className="text-muted-foreground text-xs">N/A</span>,
        size: 175,
      },
      {
        id: 'actions',
        header: '',
        size: 130,
        minSize: 130,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pr-2">
            <Button variant="ghost" className="size-8 p-0" onClick={() => handleOpenDetails(row.original)}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="size-8 p-0" onClick={() => handleOpenDetails(row.original)}>
              <SquarePen className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" className="size-8 p-0 text-destructive hover:text-destructive" onClick={() => handleDeleteProfil(row.original)}>
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
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: any) => row.id,
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
              <h3 className="text-base font-semibold text-foreground">Liste des partenaires</h3>
              <p className="text-xs text-muted-foreground">
                Partenaires, prestataires et contacts externes de l'établissement.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.partner')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10"
                />
              </div>
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
            recordCount={data?.pagination.total || 0}
            isLoading={isLoading}
            tableLayout={{ columnsResizable: true, columnsPinnable: true, columnsMovable: true, columnsVisibility: true }}
            tableClassNames={{
              bodyRow: (row) => cn(
                "transition-colors relative",
                row.getIsSelected() && "bg-primary/5 before:absolute before:left-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary"
              )
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
            recordCount={data?.pagination.total || 0}
            isLoading={isLoading}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse h-64 bg-muted/20" />
                ))
              ) : (
                  data?.data.map((profil: any) => {
                    const statusProps = profil.status === 'ACTIVE' ? { label: 'Actif', variant: 'success' } : { label: 'Inactif', variant: 'warning' };
                    const isSub = profil.type === 'SUBCONTRACTOR';
                    const { email } = resolveProfilContact(profil);
                    const emailLabel = email || 'N/A';
                    return (
                      <Card key={profil.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden bg-background/50 backdrop-blur-sm">
                        <CardContent className="p-6">
                          <div className="flex flex-col items-center text-center">
                            <div className="relative mb-4">
                              <Avatar className="size-20 rounded-2xl border-2 border-background shadow-xl">
                                {profil.avatar && <AvatarImage src={profil.avatar} alt={profil.name || ''} />}
                                <AvatarFallback className="rounded-2xl text-2xl font-bold bg-muted/50">{getInitials(profil.name || email)}</AvatarFallback>
                              </Avatar>
                              <AvatarIndicator className="-end-1 -top-1">
                                <AvatarStatus variant={profil.status === 'ACTIVE' ? "online" : "offline"} className="size-4 border-2 border-background" />
                              </AvatarIndicator>
                            </div>

                          <div className="space-y-1.5 mb-5 w-full">
                            <h4 className="font-bold text-foreground text-base line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(profil)}>
                              {profil.name}
                            </h4>
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground font-medium">
                                  <Mail className="size-3" />
                                  <span className="truncate max-w-[180px]">{emailLabel}</span>
                                </div>
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">SIRET: {profil.siret || 'N/A'}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap justify-center gap-2 mb-6">
                            <Badge variant={isSub ? "warning" : "info"} appearance="light" className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5">
                              {isSub ? 'Sous-traitant' : 'Prestataire'}
                            </Badge>
                            <Badge 
                              variant={statusProps.variant as any} 
                              appearance="light"
                              className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5"
                            >
                              {statusProps.label}
                            </Badge>
                          </div>

                          <div className="w-full pt-5 border-t border-border/50 flex items-center justify-between gap-2">
                            <div className="flex flex-col items-start text-left">
                              <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tight">Métier / Secteur</span>
                              <span className="text-xs font-semibold text-foreground/90 truncate max-w-[120px]">
                                {isSub ? 'Sécurité Privée' : (profil.service || 'Services Généraux')}
                              </span>
                            </div>
                            <div className="flex gap-1.5">
                              <Button variant="outline" size="icon" className="size-8 rounded-lg hover:bg-primary/5 hover:text-primary transition-colors" onClick={() => handleOpenDetails(profil)}>
                                <Eye className="size-4" />
                              </Button>
                              <Button variant="outline" size="icon" className="size-8 rounded-lg hover:bg-destructive/5 hover:text-destructive transition-colors" onClick={() => handleDeleteProfil(profil)}>
                                <Trash className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
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
                <span className="text-muted-foreground">{selectedRowsCount} sur {data?.data.length} sélectionnés</span>
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

      <ProfilDetailsSheet 
        open={isDetailsSheetOpen} 
        onOpenChange={setIsDetailsSheetOpen} 
        profil={selectedProfilForDetails} 
      />
    </>
  );
};

export default ProfilList;
