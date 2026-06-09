'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

/** Liste hub candidats — mêmes patterns que `EtudiantList` (sélection, tri serveur, onglets, barre sélection). */

import { useMemo, useState, type ReactNode } from 'react';
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
  Archive,
  ChevronDown,
  Copy,
  Download,
  Eye,
  LayoutGrid,
  List,
  Mail,
  MoreHorizontal,
  RefreshCw,
  Search,
  SquarePen,
  Trash,
  Trash2,
} from 'lucide-react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { CandidatureStatus } from '@repo/database/browser';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getInitials } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import {
  Avatar,
  AvatarFallback,
  AvatarIndicator,
  AvatarStatus,
} from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
import type { UserStatus } from '@/app/models/user';
import type { CandidatureDetailSheetInitialTab } from './candidature-detail-sheet';
import { getEtudiantStatusProps } from '../constants/status';
import {
  candidatHubDetailQueryKey,
  candidatHubListQueryKey,
  candidatHubStatsQueryKey,
  candidaturesListQueryKey,
} from '../constants/query-keys';

export type CandidatHubListRow = {
  userId: string;
  name: string | null;
  email: string;
  userStatus: string;
  roleSlug: string;
  roleName: string;
  updatedAt: string;
  dossierStatus: string | null;
  dossierLabel: string;
  candidatureId: string | null;
  formationName: string | null;
  sessionLabel: string;
  hasEnrollment: boolean;
  enrollmentCount: number;
  situation: string;
};

export type HubLifecycleFilter =
  | 'all'
  | 'session_inscrit'
  | 'dossier_valide'
  | 'dossier_en_attente'
  | 'sans_dossier';

const LIFECYCLE_FILTER_OPTIONS: { value: HubLifecycleFilter; label: string }[] = [
  { value: 'all', label: 'Tous les parcours' },
  { value: 'session_inscrit', label: 'Inscrit à une session' },
  { value: 'dossier_valide', label: 'Dossier validé' },
  { value: 'dossier_en_attente', label: 'Dossier en attente' },
  { value: 'sans_dossier', label: 'Sans dossier' },
];

interface CandidatHubListProps {
  leaderSlot?: ReactNode;
  onOpenCandidate: (row: CandidatHubListRow, tab: CandidatureDetailSheetInitialTab) => void;
}

export function CandidatHubList({ leaderSlot, onOpenCandidate }: CandidatHubListProps) {
  const { t } = useTranslation();

  const queryClient = useQueryClient();
  const [view, setView] = useState<'table' | 'grid'>('table');
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [lifecycle, setLifecycle] = useState<HubLifecycleFilter>('all');
  const [confirmStatus, setConfirmStatus] = useState<
    null | { row: CandidatHubListRow; status: typeof CandidatureStatus.ARCHIVED | typeof CandidatureStatus.REJECTED }
  >(null);
  const [isSyncing, setIsSyncing] = useState(false);

  const batchMutation = useMutation({
    mutationFn: async (input: { candidatureIds: string[]; action: 'archive' | 'reject' }) => {
      const res = await apiFetch('/api/sections/gestion-ressources/rh/CandidatHub/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((body as { error?: { message?: string } }).error?.message ?? 'Action groupée impossible.');
      }
      return (body as { data?: { updated?: number; errors?: string[] } }).data;
    },
    onSuccess: (data, vars) => {
      void queryClient.invalidateQueries({ queryKey: [...candidatHubListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubStatsQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubDetailQueryKey] });
      setRowSelection({});
      const n = data?.updated ?? 0;
      toast.success(
        vars.action === 'archive'
          ? `${n} dossier(s) archivé(s).`
          : `${n} dossier(s) refusé(s).`,
      );
      if (data?.errors?.length) toast.warning(data.errors.slice(0, 2).join(' · '));
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const patchStatusMutation = useMutation({
    mutationFn: async (input: { candidatureId: string; status: string }) => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/Candidatures/${input.candidatureId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: input.status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error((body as { message?: string }).message ?? 'Mise à jour impossible.');
      return body;
    },
    onSuccess: (_d, vars) => {
      void queryClient.invalidateQueries({ queryKey: [...candidatHubListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubStatsQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidaturesListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: [...candidatHubDetailQueryKey] });
      setConfirmStatus(null);
      toast.success(vars.status === CandidatureStatus.ARCHIVED ? 'Dossier archivé.' : 'Dossier refusé / retiré.');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const queryKey = [
    ...candidatHubListQueryKey,
    pagination.pageIndex,
    pagination.pageSize,
    searchQuery,
    lifecycle,
    sorting,
  ] as const;

  const sortId = sorting[0]?.id;
  const apiSort =
    sortId === 'name' || sortId === 'email' || sortId === 'updatedAt' ? sortId : 'updatedAt';
  const apiDir = sorting[0]?.desc ? 'desc' : 'asc';

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(pagination.pageIndex + 1),
        limit: String(pagination.pageSize),
        sort: apiSort,
        dir: apiDir,
        ...(searchQuery.trim() ? { query: searchQuery.trim() } : {}),
        ...(lifecycle !== 'all' ? { lifecycle } : {}),
      });
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/CandidatHub?${params.toString()}`);
      if (!res.ok) throw new Error('Échec du chargement des candidats.');
      const json = await res.json();
      return {
        data: (json.data ?? []) as CandidatHubListRow[],
        total: json.pagination?.total ?? 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });

  const handleSync = async () => {
    setIsSyncing(true);
    await queryClient.invalidateQueries({ queryKey: [...candidatHubListQueryKey] });
    await queryClient.invalidateQueries({ queryKey: [...candidatHubStatsQueryKey] });
    setTimeout(() => {
      setIsSyncing(false);
      toast.custom(
        (t) => (
          <Alert variant="mono" icon="success" onClose={() => toast.dismiss(t)}>
            <AlertIcon>
              <RiCheckboxCircleFill className="size-4 text-green-600" />
            </AlertIcon>
            <AlertTitle>Liste candidats synchronisée</AlertTitle>
          </Alert>
        ),
        { duration: 3000, position: 'top-center' },
      );
    }, 600);
  };

  function canTerminalAct(r: CandidatHubListRow) {
    if (!r.candidatureId || !r.dossierStatus) return false;
    return (
      r.dossierStatus !== CandidatureStatus.ARCHIVED &&
      r.dossierStatus !== CandidatureStatus.REJECTED
    );
  }

  const RowActions = ({ r }: { r: CandidatHubListRow }) => (
    <div className="flex items-center justify-end gap-0.5 pe-2">
      <Button
        type="button"
        variant="ghost"
        mode="icon"
        className="size-8"
        title="Voir le détail"
        onClick={() => onOpenCandidate(r, 'overview')}
      >
        <Eye className="size-4 text-muted-foreground" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        mode="icon"
        className="size-8"
        title="Éditer le pipeline"
        disabled={!r.candidatureId}
        onClick={() => onOpenCandidate(r, 'pipeline')}
      >
        <SquarePen className="size-4 text-muted-foreground" />
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            mode="icon"
            className="size-8"
            title="Autres actions"
          >
            <MoreHorizontal className="size-4 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            disabled={!canTerminalAct(r)}
            className="gap-2"
            onClick={() => setConfirmStatus({ row: r, status: CandidatureStatus.ARCHIVED })}
          >
            <Archive className="size-4" />
            Archiver le dossier
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!canTerminalAct(r)}
            variant="destructive"
            className="gap-2"
            onClick={() => setConfirmStatus({ row: r, status: CandidatureStatus.REJECTED })}
          >
            <Trash2 className="size-4" />
            Refuser le dossier
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  const columns = useMemo<ColumnDef<CandidatHubListRow>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => <DataGridTableRowSelectAll table={table} />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 48,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Candidat" column={column} />,
        cell: ({ row }) => {
          const r = row.original;
          const initials = getInitials(r.name || r.email);
          return (
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback>{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                  <AvatarStatus
                    variant={r.userStatus === 'ACTIVE' ? 'online' : 'offline'}
                    className="size-2.5"
                  />
                </AvatarIndicator>
              </Avatar>
              <div className="flex min-w-0 flex-col">
                <button
                  type="button"
                  className="truncate text-left text-sm font-semibold text-foreground transition-colors hover:text-primary"
                  onClick={() => onOpenCandidate(r, 'overview')}
                >
                  {r.name || '—'}
                </button>
                <span className="truncate text-xs text-muted-foreground">{r.email}</span>
              </div>
            </div>
          );
        },
        size: 280,
        meta: {
          cellClassName: 'max-w-[min(28rem,calc(100vw-14rem))]',
        },
      },
      {
        id: 'roleSlug',
        header: ({ column }) => <DataGridColumnHeader title="Rôle" column={column} />,
        cell: ({ row }) => (
          <Badge variant="primary" appearance="light" size="sm" className="text-[10px] font-bold uppercase tracking-wider">
            {row.original.roleSlug}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'dossierLabel',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.fileStatus')} column={column} />,
        cell: ({ row }) => {
          const has = Boolean(row.original.candidatureId);
          return has ?
              <Badge variant="secondary" appearance="light" className="max-w-[240px] text-xs font-medium whitespace-normal">
                {row.original.dossierLabel}
              </Badge>
            : <Badge variant="outline" appearance="light" size="sm" className="text-[10px] font-bold uppercase">
                Sans dossier
              </Badge>;
        },
        size: 160,
        meta: { cellClassName: 'max-w-[16rem]' },
      },
      {
        accessorKey: 'updatedAt',
        id: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="Mise à jour" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap text-xs">
            {formatDateTime(row.original.updatedAt)}
          </span>
        ),
        size: 148,
      },
      {
        id: 'actions',
        header: '',
        size: 128,
        minSize: 128,
        cell: ({ row }) => <RowActions r={row.original} />,
        enableSorting: false,
      },
    ],
    [onOpenCandidate],
  );

  const table = useReactTable({
    columns,
    data: data?.data ?? [],
    pageCount: Math.max(1, Math.ceil((data?.total ?? 0) / pagination.pageSize)),
    state: { pagination, sorting, rowSelection },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getRowId: (r) => r.userId,
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
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPagination((p) => ({ ...p, pageIndex: 0 }));
              }}
              className="h-10 ps-9"
            />
          </div>

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0 flex-1">
              <label htmlFor="candidat-hub-lifecycle-filter" className="sr-only">
                Filtrer par parcours
              </label>
              <Select
                value={lifecycle}
                onValueChange={(v) => {
                  setLifecycle(v as HubLifecycleFilter);
                  setPagination((p) => ({ ...p, pageIndex: 0 }));
                }}
              >
                <SelectTrigger id="candidat-hub-lifecycle-filter" className="h-10 w-full max-w-md">
                  <SelectValue placeholder="Parcours" />
                </SelectTrigger>
                <SelectContent>
                  {LIFECYCLE_FILTER_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end lg:shrink-0">
              <div className="flex h-10 shrink-0 items-center rounded-md border border-dashed border-border bg-muted/20 px-3 text-[11px] text-muted-foreground">
                Liste unifiée : candidats + élèves
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-10 shrink-0 gap-2 border-dashed hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                type="button"
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

      <AlertDialog
        open={confirmStatus !== null}
        onOpenChange={(o) => {
          if (!o) setConfirmStatus(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmStatus?.status === CandidatureStatus.ARCHIVED ?
                'Archiver ce dossier ?'
              : 'Refuser ce dossier ?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStatus ?
                <>
                  Statut CRM pour{' '}
                  <span className="font-medium text-foreground">{confirmStatus.row.email}</span>.
                  Les dossiers peuvent également provenir du site public.
                </>
              : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" type="button" disabled={patchStatusMutation.isPending}>
                Annuler
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant={confirmStatus?.status === CandidatureStatus.REJECTED ? 'destructive' : 'primary'}
                disabled={patchStatusMutation.isPending || !confirmStatus?.row.candidatureId}
                onClick={(e) => {
                  e.preventDefault();
                  if (!confirmStatus?.row.candidatureId) return;
                  patchStatusMutation.mutate({
                    candidatureId: confirmStatus.row.candidatureId,
                    status: confirmStatus.status,
                  });
                }}
              >
                Confirmer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs value={view} onValueChange={(v) => setView(v as 'table' | 'grid')} className="w-full">
        <TabsContent value="table" className="mt-0">
          <DataGrid
            table={table}
            recordCount={data?.total ?? 0}
            isLoading={isLoading}
            tableLayout={{
              columnsResizable: true,
              columnsPinnable: true,
              columnsMovable: true,
              columnsVisibility: true,
              width: 'auto',
            }}
            tableClassNames={{
              bodyRow: (row) =>
                cn(
                  'transition-colors relative',
                  typeof row.getIsSelected === 'function' &&
                    row.getIsSelected() &&
                    'bg-primary/5 before:absolute before:start-0 before:top-0 before:bottom-0 before:w-[3px] before:bg-primary',
                ),
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
          <DataGrid table={table} recordCount={data?.total ?? 0} isLoading={isLoading}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {isLoading ?
                Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="h-64 animate-pulse bg-muted/20" />
                ))
              : table.getRowModel().rows.map(({ original: EtudiantRow }) => {
                  const statusProps = getEtudiantStatusProps(EtudiantRow.userStatus as UserStatus);
                  return (
                    <Card key={EtudiantRow.userId} className="overflow-hidden shadow-none transition-all duration-300 group hover:border-primary/50 border-border">
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center">
                          <div className="relative mb-4">
                            <Avatar className="size-20 border-2 border-background shadow-lg">
                              <AvatarFallback className="text-xl">
                                {getInitials(EtudiantRow.name || EtudiantRow.email)}
                              </AvatarFallback>
                            </Avatar>
                            <AvatarIndicator className="-end-1 -top-1">
                              <AvatarStatus
                                variant={EtudiantRow.userStatus === 'ACTIVE' ? 'online' : 'offline'}
                                className="size-3.5 border-2 border-background"
                              />
                            </AvatarIndicator>
                          </div>
                          <div className="mb-4 space-y-1">
                            <h4
                              role="button"
                              tabIndex={0}
                              className="line-clamp-2 cursor-pointer font-bold text-foreground transition-colors group-hover:text-primary"
                              onClick={() => onOpenCandidate(EtudiantRow, 'overview')}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  onOpenCandidate(EtudiantRow, 'overview');
                                }
                              }}
                            >
                              {EtudiantRow.name || '—'}
                            </h4>
                            <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                              <Mail className="size-3 shrink-0" />
                              <span className="max-w-[220px] truncate">{EtudiantRow.email}</span>
                            </div>
                          </div>
                          <div className="mb-6 flex flex-wrap justify-center gap-2">
                            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-[10px] font-bold uppercase tracking-wide text-primary">
                              {EtudiantRow.roleSlug}
                            </Badge>
                            <Badge variant="secondary" appearance="light" className="max-w-[200px] text-[10px] font-bold uppercase">
                              {EtudiantRow.candidatureId ? EtudiantRow.dossierLabel : 'Sans dossier'}
                            </Badge>
                            <Badge
                              variant={statusProps.variant as 'success' | 'warning' | 'destructive'}
                              appearance="light"
                              size="sm"
                              className="text-[10px] font-bold uppercase"
                            >
                              {statusProps.label}
                            </Badge>
                          </div>
                          <div className="flex w-full justify-end border-t border-dashed border-border pt-4">
                            <RowActions r={EtudiantRow} />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              }
            </div>
            <div className="mt-8 flex justify-center">
              <DataGridPagination />
            </div>
          </DataGrid>
        </TabsContent>
      </Tabs>

      <AnimatePresence>
        {selectedRowsCount > 0 ?
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 start-1/2 z-50 -translate-x-1/2"
          >
            <div className="bg-popover text-popover-foreground border-border flex min-w-[520px] max-w-[90vw] items-center gap-6 rounded-xl border px-4 py-2.5 shadow-2xl">
              <div className="border-border border-e pe-6 text-sm font-medium">
                <span className="text-muted-foreground">
                  {selectedRowsCount} sur {table.getRowModel().rows.length || 0} sélectionné(s)
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="flex items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
                    >
                      Actions groupées <ChevronDown className="size-3" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-popover text-popover-foreground border-border">
                    <DropdownMenuItem
                      onClick={() => {
                        const ids = table
                          .getSelectedRowModel()
                          .rows.map((r) => r.original.candidatureId)
                          .filter((id): id is string => Boolean(id));
                        if (!ids.length) {
                          toast.error('Aucun dossier candidature sur la sélection.');
                          return;
                        }
                        batchMutation.mutate({ candidatureIds: ids, action: 'archive' });
                      }}
                    >
                      Archiver la sélection
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const ids = table
                          .getSelectedRowModel()
                          .rows.map((r) => r.original.candidatureId)
                          .filter((id): id is string => Boolean(id));
                        if (!ids.length) {
                          toast.error('Aucun dossier candidature sur la sélection.');
                          return;
                        }
                        batchMutation.mutate({ candidatureIds: ids, action: 'reject' });
                      }}
                    >
                      Refuser la sélection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <button type="button" className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
                  <Copy className="size-4" /> Copier emails
                </button>
                <button type="button" className="flex items-center gap-2 text-sm font-semibold hover:text-primary">
                  <Download className="size-4" /> Export
                </button>
                <button
                  type="button"
                  className="ms-4 flex items-center gap-2 text-sm font-semibold text-red-400 hover:text-red-300"
                  onClick={() => setRowSelection({})}
                >
                  <Trash className="size-4" /> Effacer la sélection
                </button>
              </div>
            </div>
          </motion.div>
        : null}
      </AnimatePresence>
    </>
  );
}
