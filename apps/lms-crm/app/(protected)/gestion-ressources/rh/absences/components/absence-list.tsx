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
  CheckCircle2, 
  XCircle, 
  Trash, 
  Calendar,
  Filter,
  RefreshCw,
  LayoutGrid,
  List,
  Copy,
  Download,
  ChevronDown
} from 'lucide-react';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { AnimatePresence, motion } from 'framer-motion';
import { apiFetch } from '@/lib/api';
import { formatDate, formatDateTime, getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@repo/ui/avatar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import {
  DataGrid,
} from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@repo/ui/data-grid-table';
import { Input } from '@repo/ui/input';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { Absence, AbsenceStatus } from '@/app/models/absence';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import AbsenceDetailsSheet from './absence-details-sheet';
import { ABSENCE_TYPES, ABSENCE_STATUSES } from '../constants';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@repo/ui/dropdown-menu';
import { Tabs, TabsContent } from '@repo/ui/tabs';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';

const AbsenceList = () => {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [absenceToDelete, setAbsenceToDelete] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rowSelection, setRowSelection] = useState({});

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'rhAbsences',
    queryKeys: [
      ['rh-absences'],
      ['rh-collaborators'],
      ['rh-formateurs'],
      ['gestion-academique', 'vie-scolaire', 'etudiants'],
      ['dashboard-stats', 'rh'],
    ],
  });

  const normalizeAbsences = (payload: unknown): Absence[] => {
    if (!payload || typeof payload !== 'object') return [];
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as Absence[];
    if (record.data && typeof record.data === 'object') {
      const nested = record.data as Record<string, unknown>;
      if (Array.isArray(nested.items)) return nested.items as Absence[];
    }
    if (Array.isArray(record.items)) return record.items as Absence[];
    return [];
  };

  const fetchAbsences = async () => {
    const params = new URLSearchParams({
      ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    });

    const response = await apiFetch(`/api/sections/gestion-ressources/rh/absences?${params.toString()}`);
    if (!response.ok) throw new Error('Échec du chargement des absences');
    return response.json();
  };

  const { data: queryData, isLoading } = useQuery({
    queryKey: ['rh-absences', statusFilter],
    queryFn: fetchAbsences,
    staleTime: 1000 * 60 * 5,
  });

  const tableData = useMemo(() => normalizeAbsences(queryData), [queryData]);

  const handleOpenDetails = (id: string) => {
    setSelectedAbsenceId(id);
    setDetailsOpen(true);
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: AbsenceStatus }) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/absences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Échec de la mise à jour du statut');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Statut mis à jour", {
        description: "Le statut de l'absence a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ['rh-absences'] });
      queryClient.invalidateQueries({ queryKey: ['rh-collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['rh-formateurs'] });
      queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/sections/gestion-ressources/rh/absences/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Échec de la suppression');
      return response.json();
    },
    onSuccess: () => {
      toast.success("Absence supprimée", {
        description: "La demande a été définitivement supprimée.",
      });
      queryClient.invalidateQueries({ queryKey: ['rh-absences'] });
      queryClient.invalidateQueries({ queryKey: ['rh-collaborators'] });
      queryClient.invalidateQueries({ queryKey: ['rh-formateurs'] });
      queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'etudiants'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats', 'rh'] });
    },
    onError: (error: Error) => {
      toast.error(`Erreur: ${error.message}`);
    },
  });

  const columns = useMemo<ColumnDef<Absence>[]>(
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
        accessorKey: 'User',
        id: 'user',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.staffMember')} column={column} />,
        cell: ({ row }) => {
          const user = row.original.User || (row.original as any).tenantUser;
          if (!user) {
            // Tentative de récupération via userId si User est manquant
            return <span className="text-muted-foreground italic text-xs">ID: {row.original.userId?.substring(0, 8)}...</span>;
          }
          const name = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
          const initials = getInitials(name);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                {user.avatar && <AvatarImage src={user.avatar} alt={name} />}
                <AvatarFallback className="bg-muted text-muted-foreground">{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                   <AvatarStatus variant={user.status === 'ACTIVE' ? "online" : user.status === 'ABSENT' ? "away" : "offline"} className="size-2.5" />
                </AvatarIndicator>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-foreground hover:text-primary transition-colors cursor-pointer" onClick={() => handleOpenDetails(row.original.id)}>
                  {name}
                </span>
                <span className="text-muted-foreground text-xs">{user.email}</span>
              </div>
            </div>
          );
        },
        size: 220,
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => {
          const type = ABSENCE_TYPES.find(t => t.id === row.original.type) || ABSENCE_TYPES[3];
          const Icon = type.icon;
          return (
            <div className="flex items-center gap-2">
               <div className={cn("p-1.5 rounded-md border border-border/50 shadow-xs", type.bg)}>
                  <Icon className={cn("size-3.5", type.color)} />
               </div>
               <span className="text-2sm font-semibold text-foreground/90">{type.label}</span>
            </div>
          );
        },
        size: 150,
      },
      {
        accessorKey: 'startDate',
        id: 'dates',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => {
          const start = new Date(row.original.startDate);
          const end = new Date(row.original.endDate);
          const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-2sm font-bold text-foreground">
                <Calendar className="size-3.5 text-foreground/40" />
                <span>{formatDate(start)} - {formatDate(end)}</span>
              </div>
              <div className="flex items-center gap-1.5 ml-5">
                <Badge variant="outline" appearance="light" size="xs" className="font-bold uppercase text-[9px] tracking-wider">
                    {days} jours
                </Badge>
              </div>
            </div>
          );
        },
        size: 240,
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const status = ABSENCE_STATUSES.find(s => s.id === row.original.status) || ABSENCE_STATUSES[0];
          const isActive = row.original.isActive;
          return (
            <div className="flex flex-col gap-1">
              <Badge variant={status.variant as any} appearance="light" size="sm" className="font-bold uppercase text-[10px] tracking-wider">
                {status.label}
              </Badge>
              {isActive ? (
                <Badge variant="destructive" appearance="light" size="xs" className="w-fit font-bold uppercase text-[9px] tracking-wider">
                  En cours
                </Badge>
              ) : null}
            </div>
          );
        },
        size: 130,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Demandé le" column={column} />,
        cell: (info) => (
          <div className="flex flex-col">
            <span className="text-2sm text-foreground font-semibold">
              {formatDate(new Date(info.getValue() as string))}
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              {formatDateTime(new Date(info.getValue() as string)).split(' ')[1]}
            </span>
          </div>
        ),
        size: 150,
      },
      {
        id: 'actions',
        header: '',
        size: 150,
        cell: ({ row }) => {
          const absence = row.original;
          return (
            <div className="flex items-center justify-end gap-1.5 pr-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="size-8 p-0 text-muted-foreground hover:text-info hover:bg-info/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenDetails(absence.id);
                }}
              >
                <Eye className="size-4" />
              </Button>
              {absence.status === 'PENDING' && (
                <>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="size-8 p-0 text-success/60 hover:text-success hover:bg-success/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({ id: absence.id, status: 'APPROVED' });
                    }}
                  >
                    <CheckCircle2 className="size-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="size-8 p-0 text-destructive/60 hover:text-destructive hover:bg-destructive/10 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateStatusMutation.mutate({ id: absence.id, status: 'REJECTED' });
                    }}
                  >
                    <XCircle className="size-4" />
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="size-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setAbsenceToDelete(absence.id);
                  setDeleteConfirmOpen(true);
                }}
              >
                <Trash className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    // Removed unstable mutation objects from dependencies
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const table = useReactTable({
    columns,
    data: tableData,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      pagination,
      sorting,
      globalFilter: searchQuery,
      rowSelection,
    },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onGlobalFilterChange: setSearchQuery,
  });
  const selectedRowsCount = Object.keys(rowSelection).length;

  return (
    <div className="space-y-4">
      <Card className="mb-5">
        <CardHeader className="py-3">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">Liste des absences</h3>
              <p className="text-xs text-muted-foreground">Raccourcis: recherche, filtres statut, synchronisation, vue liste/cartes</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                <Input
                  placeholder={t('datagrid.search.absence')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-9 h-10 border-border shadow-none"
                />
              </div>
              <div className="flex items-center gap-2 p-1 border border-border rounded-xl shadow-none overflow-x-auto w-full sm:w-auto no-scrollbar">
                {ABSENCE_STATUSES.map((status) => (
                  <Button
                    key={status.id}
                    variant={statusFilter === status.id ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setStatusFilter(status.id)}
                    className={cn(
                      "text-xs font-semibold h-8 px-3 whitespace-nowrap",
                      statusFilter === status.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {status.label}
                  </Button>
                ))}
                <Button
                  variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className={cn(
                    "text-xs font-semibold h-8 px-3",
                    statusFilter === 'all' ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  Tous
                </Button>
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
                <Button variant={view === 'table' ? 'secondary' : 'ghost'} size="sm" className="h-8 gap-2" onClick={() => setView('table')}>
                  <List className="size-4" />
                  {t('datagrid.listView')}
                </Button>
                <Button variant={view === 'grid' ? 'secondary' : 'ghost'} size="sm" className="h-8 gap-2" onClick={() => setView('grid')}>
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
          <DataGrid table={table} recordCount={tableData.length} isLoading={isLoading}>
            <Card className="border-border shadow-sm overflow-hidden">
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
          <DataGrid table={table} recordCount={tableData.length} isLoading={isLoading}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {tableData.map((absence) => {
                const user = absence.User || (absence as any).tenantUser;
                const type = ABSENCE_TYPES.find((t) => t.id === absence.type) || ABSENCE_TYPES[3];
                const status = ABSENCE_STATUSES.find((s) => s.id === absence.status) || ABSENCE_STATUSES[0];
                const initials = getInitials(`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'NA');
                return (
                  <Card key={absence.id} className="group hover:border-primary/50 transition-all duration-300 overflow-hidden">
                    <CardFooter className="p-6 flex-col items-stretch gap-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {user?.avatar && <AvatarImage src={user.avatar} alt={user?.email || ''} />}
                          <AvatarFallback>{initials}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'Utilisateur'}</p>
                          <p className="text-xs text-muted-foreground truncate">{user?.email || '-'}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase">{type.label}</Badge>
                        <Badge variant={status.variant as any} appearance="light" size="sm" className="font-bold uppercase text-[10px] tracking-wider">{status.label}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDate(new Date(absence.startDate))} - {formatDate(new Date(absence.endDate))}
                      </div>
                      <div className="flex justify-end">
                        <Button variant="ghost" size="icon" className="size-8" onClick={() => handleOpenDetails(absence.id)}>
                          <Eye className="size-4" />
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                );
              })}
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
                <span className="text-muted-foreground">{selectedRowsCount} absence(s) sélectionnée(s)</span>
              </div>
              <div className={DATAGRID_SELECTION_BAR_ACTIONS}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-sm font-semibold hover:text-primary transition-colors">
                      {t('datagrid.changeStatus')} <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem className="hover:bg-accent">Approuvé</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent">En attente</DropdownMenuItem>
                    <DropdownMenuItem className="hover:bg-accent text-destructive">Refusé</DropdownMenuItem>
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

      <AbsenceDetailsSheet 
        absenceId={selectedAbsenceId}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Cela supprimera définitivement la demande d'absence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setAbsenceToDelete(null)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (absenceToDelete) {
                  deleteMutation.mutate(absenceToDelete);
                  setAbsenceToDelete(null);
                }
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AbsenceList;
