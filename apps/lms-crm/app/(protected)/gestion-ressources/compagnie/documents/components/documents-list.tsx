'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import {
  Building2,
  Columns2,
  Download,
  Eye,
  FileText,
  FolderOpen,
  Landmark,
  LayoutGrid,
  Loader2,
  Pencil,
  RefreshCw,
  Scale,
  Scan,
  Search,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react';
import { RiCheckboxCircleFill } from '@remixicon/react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  ADMIN_DOCUMENT_GROUPS,
  type AdminDocumentGroupId,
} from '@/lib/admin-document-slots';
import { cn } from '@/lib/utils';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardHeader, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridColumnVisibility } from '@/components/ui/data-grid-column-visibility';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable, DataGridTableRowSelect, DataGridTableRowSelectAll } from '@/components/ui/data-grid-table';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Alert, AlertIcon, AlertTitle } from '@/components/ui/alert';
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
import { DossierSlotSheet } from './dossier-slot-sheet';
import { DossierFileViewerDialog, type DossierViewerFile } from './dossier-file-viewer-dialog';
import type { DossierAdministratifResponse, DossierActor, DossierSlotPayload } from './dossier-types';

type DossierVolet = 'all' | AdminDocumentGroupId;

const DOSSIER_VOLET_ORDER: AdminDocumentGroupId[] = [
  'juridique',
  'conformite',
  'locaux',
  'finances',
  'rh',
  'divers',
];

const voletTriggerClass =
  'flex h-auto flex-col items-center gap-1 rounded-lg px-2 py-2.5 text-center text-[11px] font-semibold leading-tight data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:flex-row sm:gap-2 sm:px-3 sm:text-left sm:text-xs md:text-sm';

function actorDisplayName(a: DossierActor): string {
  const p = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
  if (p) return p;
  return (a.name || '').trim() || a.email || '—';
}

const VOLET_ICONS: Record<AdminDocumentGroupId, typeof Scale> = {
  juridique: Scale,
  conformite: ShieldCheck,
  locaux: Building2,
  finances: Landmark,
  rh: Users,
  divers: FolderOpen,
};

function toDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('fr-FR');
}

function rowStatus(row: DossierSlotPayload): { label: string; variant: 'success' | 'warning' | 'destructive' | 'secondary' } {
  const exp = row.fiche.expiresAt;
  if (!exp) return { label: 'Sans échéance', variant: 'secondary' };
  const d = new Date(exp);
  if (Number.isNaN(d.getTime())) return { label: '—', variant: 'secondary' };
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - t0.getTime()) / (86400 * 1000));
  if (diff < 0) return { label: 'Expiré', variant: 'destructive' };
  if (diff <= 60) return { label: 'À renouveler', variant: 'warning' };
  return { label: 'À jour', variant: 'success' };
}

export function DocumentsList() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE });
  const [rowSelection, setRowSelection] = useState({});
  const [searchQuery, setSearchQuery] = useState('');
  const [volet, setVolet] = useState<DossierVolet>('all');

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'compagnieDocuments',
    queryKeys: [['dossier-administratif']],
  });

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetSlot, setSheetSlot] = useState<DossierSlotPayload | null>(null);
  const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view');
  const [slotToDetach, setSlotToDetach] = useState<DossierSlotPayload | null>(null);
  const [viewerFile, setViewerFile] = useState<DossierViewerFile | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    reference: false,
    issuedAt: false,
    expiresAt: false,
    actor: false,
  });

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dossier-administratif'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif');
      if (!res.ok) throw new Error('fetch');
      const json = await res.json();
      return unwrapSectionApiData<DossierAdministratifResponse>(json);
    },
    staleTime: 1000 * 60,
  });

  const settingsId = data?.settingsId ?? null;
  const filteredRows = useMemo(() => {
    const slots = data?.slots ?? [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return slots;
    return slots.filter((s) => {
      const g = ADMIN_DOCUMENT_GROUPS[s.definition.group]?.title ?? '';
      return (
        s.definition.title.toLowerCase().includes(q) ||
        s.definition.description.toLowerCase().includes(q) ||
        g.toLowerCase().includes(q) ||
        (s.fiche.reference || '').toLowerCase().includes(q)
      );
    });
  }, [data?.slots, searchQuery]);

  const rowsForVolet = useMemo(() => {
    if (volet === 'all') return filteredRows;
    return filteredRows.filter((s) => s.definition.group === volet);
  }, [filteredRows, volet]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
    setRowSelection({});
  }, [volet, searchQuery]);

  const openSheet = useCallback((row: DossierSlotPayload, mode: 'view' | 'edit') => {
    setSheetSlot(row);
    setSheetMode(mode);
    setSheetOpen(true);
  }, []);

  const requestDetach = useCallback((row: DossierSlotPayload) => {
    setSlotToDetach(row);
  }, []);

  const detachMutation = useMutation({
    mutationFn: async (row: DossierSlotPayload) => {
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: row.definition.id,
          patch: { fileAssetId: null },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: { message?: string } }).error?.message || 'Suppression impossible');
      }
    },
    onSuccess: () => {
      toast.success(t('documents.detached'));
      setSlotToDetach(null);
      void queryClient.invalidateQueries({ queryKey: ['dossier-administratif'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<DossierSlotPayload>[]>(() => {
    const showThematique = volet === 'all';
    const selectCol: ColumnDef<DossierSlotPayload> = {
      id: 'select',
      header: () => <DataGridTableRowSelectAll />,
      cell: ({ row }) => <DataGridTableRowSelect row={row} />,
      size: 44,
      enableHiding: false,
    };
    const groupCol: ColumnDef<DossierSlotPayload> = {
      id: 'group',
      accessorFn: (r) => ADMIN_DOCUMENT_GROUPS[r.definition.group]?.title ?? r.definition.group,
      header: ({ column }) => <DataGridColumnHeader title="Thématique" column={column} />,
      cell: ({ row }) => (
        <span className="text-sm font-medium text-muted-foreground">
          {ADMIN_DOCUMENT_GROUPS[row.original.definition.group]?.title}
        </span>
      ),
      size: 160,
      enableHiding: true,
      meta: { headerTitle: 'Thématique' },
    };
    const rest: ColumnDef<DossierSlotPayload>[] = [
      {
        id: 'title',
        accessorFn: (r) => r.definition.title,
        header: ({ column }) => <DataGridColumnHeader title="Document" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2">
              <FileText className="size-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">{row.original.definition.title}</p>
              {row.original.definition.recommended ? (
                <p className="text-[10px] font-bold uppercase tracking-wide text-primary/80">Pièce courante</p>
              ) : null}
            </div>
          </div>
        ),
        size: 260,
        enableHiding: false,
        meta: { headerTitle: 'Document' },
      },
      {
        id: 'reference',
        accessorFn: (r) => r.fiche.reference,
        header: ({ column }) => <DataGridColumnHeader title="Référence" column={column} />,
        cell: ({ row }) => (
          <span className="font-mono text-xs text-foreground/90">
            {(row.original.fiche.reference || '').trim() || '—'}
          </span>
        ),
        size: 140,
        enableHiding: true,
        meta: { headerTitle: 'Référence' },
      },
      {
        id: 'issuedAt',
        accessorFn: (r) => r.fiche.issuedAt,
        header: ({ column }) => <DataGridColumnHeader title="Émission" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{toDisplayDate(row.original.fiche.issuedAt)}</span>
        ),
        size: 110,
        enableHiding: true,
        meta: { headerTitle: 'Émission' },
      },
      {
        id: 'expiresAt',
        accessorFn: (r) => r.fiche.expiresAt,
        header: ({ column }) => <DataGridColumnHeader title="Expiration" column={column} />,
        cell: ({ row }) => (
          <span className="text-xs text-muted-foreground">{toDisplayDate(row.original.fiche.expiresAt)}</span>
        ),
        size: 110,
        enableHiding: true,
        meta: { headerTitle: 'Expiration' },
      },
      {
        id: 'status',
        accessorFn: (r) => rowStatus(r).label,
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => {
          const s = rowStatus(row.original);
          return (
            <Badge variant={s.variant} appearance="light" size="sm" className="font-semibold">
              {s.label}
            </Badge>
          );
        },
        size: 120,
        enableHiding: true,
        meta: { headerTitle: 'Statut' },
      },
      {
        id: 'actor',
        accessorFn: (r) => (r.lastActor ? actorDisplayName(r.lastActor) : ''),
        header: ({ column }) => <DataGridColumnHeader title="Dernière action" column={column} />,
        cell: ({ row }) => {
          const a = row.original.lastActor;
          const when = row.original.lastUpdatedAt;
          if (!a) {
            return <span className="text-xs text-muted-foreground">—</span>;
          }
          const label = actorDisplayName(a);
          const initials = getInitials(label);
          return (
            <div className="flex min-w-0 max-w-[220px] items-center gap-2">
              <Avatar className="size-9 shrink-0 border border-border/60">
                {a.avatar ? <AvatarImage src={getAvatarUrl(a.avatar)} alt={label} /> : null}
                <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                <AvatarIndicator className="-end-0.5 -top-0.5">
                  <AvatarStatus
                    variant={a.status === 'ACTIVE' ? 'online' : 'offline'}
                    className="size-2.5"
                  />
                </AvatarIndicator>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{label}</p>
                {when ? (
                  <p className="truncate text-[11px] text-muted-foreground">{formatDateTime(new Date(when))}</p>
                ) : null}
              </div>
            </div>
          );
        },
        size: 200,
        enableHiding: true,
        meta: { headerTitle: 'Dernière action' },
      },
      {
        id: 'file',
        accessorFn: (r) => r.file?.originalName ?? '',
        header: ({ column }) => <DataGridColumnHeader title="Fichier" column={column} />,
        cell: ({ row }) =>
          row.original.file ? (
            <div className="flex flex-wrap items-center gap-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-xs"
                title="Voir le document"
                onClick={() =>
                  setViewerFile({
                    url: row.original.file!.url,
                    mimeType: row.original.file!.mimeType,
                    originalName: row.original.file!.originalName,
                  })
                }
              >
                <Scan className="size-3.5" />
                Voir
              </Button>
              <Button variant="ghost" size="sm" className="h-auto px-0 text-xs text-primary underline-offset-4 hover:underline" asChild>
                <a href={row.original.file.url} target="_blank" rel="noopener noreferrer">
                  <Download className="me-1 size-3.5" />
                  Télécharger
                </a>
              </Button>
            </div>
          ) : (
            <span className="text-xs italic text-muted-foreground">Non joint</span>
          ),
        size: 160,
        enableHiding: true,
        meta: { headerTitle: 'Fichier' },
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        size: 132,
        enableHiding: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5 pe-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              title="Détails"
              onClick={() => openSheet(row.original, 'view')}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="size-8 p-0"
              title="Éditer"
              onClick={() => openSheet(row.original, 'edit')}
            >
              <Pencil className="size-4 text-muted-foreground" />
            </Button>
            {row.original.file ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="size-8 p-0 text-destructive hover:text-destructive"
                title="Détacher le fichier"
                onClick={() => requestDetach(row.original)}
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ),
      },
    ];
    return showThematique ? [selectCol, groupCol, ...rest] : [selectCol, ...rest];
  }, [volet, openSheet, requestDetach]);

  const table = useReactTable({
    columns,
    data: rowsForVolet,
    pageCount: Math.ceil(rowsForVolet.length / pagination.pageSize) || 1,
    getRowId: (row) => row.definition.id,
    state: { pagination, rowSelection, columnVisibility },
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
  });

  if (isError) {
    return (
      <Card className="border-destructive/40 p-8 text-center text-sm">
        <p className="font-medium text-destructive">Impossible de charger le dossier administratif.</p>
        <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
          Réessayer
        </Button>
      </Card>
    );
  }

  return (
    <>
      <Card className="mb-5">
        <CardHeader className="py-3">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
              <div>
                <h3 className="text-base font-semibold text-foreground">Dossier administratif</h3>
                <p className="text-xs text-muted-foreground">
                  Pièces officielles classées par thématique ; consultez, joignez et tracez chaque document.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="relative w-full sm:w-80">
                  <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
                  <Input
                    placeholder="Rechercher par pièce, thématique ou référence…"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                    className="ps-9 h-10"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-sm"
                  onClick={handleSync}
                  disabled={isSyncing}
                >
                  <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">Actualiser</span>
                </Button>
                <DataGridColumnVisibility
                  table={table}
                  trigger={
                    <Button type="button" variant="outline" size="sm" className="h-10 gap-2 border-dashed shadow-sm">
                      <Columns2 className="size-4 shrink-0" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Colonnes</span>
                    </Button>
                  }
                />
              </div>
            </div>

            <Tabs
              value={volet}
              onValueChange={(v) => setVolet(v as DossierVolet)}
              className="w-full"
            >
              <TabsList
                className={cn(
                  'grid h-auto w-full gap-2 rounded-xl border border-border/70 bg-muted/30 p-2',
                  'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
                )}
              >
                <TabsTrigger value="all" className={voletTriggerClass}>
                  <LayoutGrid className="size-4 shrink-0 text-primary" aria-hidden />
                  <span className="leading-tight">Toutes les pièces</span>
                </TabsTrigger>
                {DOSSIER_VOLET_ORDER.map((id) => {
                  const Icon = VOLET_ICONS[id];
                  const meta = ADMIN_DOCUMENT_GROUPS[id];
                  return (
                    <TabsTrigger key={id} value={id} className={voletTriggerClass}>
                      <Icon className="size-4 shrink-0 text-slate-600 dark:text-slate-400" aria-hidden />
                      <span className="leading-tight">{meta.title}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
      </Card>

      {volet !== 'all' ? (
        <p className="mb-4 rounded-lg border border-border/60 bg-muted/15 px-4 py-3 text-sm text-muted-foreground">
          {ADMIN_DOCUMENT_GROUPS[volet].description}
        </p>
      ) : null}

      {!isLoading && rowsForVolet.length === 0 ? (
        <Card className="mb-4 border-dashed border-border/80 bg-muted/20 px-4 py-6 text-center text-sm text-muted-foreground">
          {searchQuery.trim()
            ? 'Aucun document ne correspond à votre recherche pour ce volet.'
            : volet === 'all'
              ? 'Aucune pièce à afficher pour le moment.'
              : 'Aucune pièce dans ce volet pour le moment.'}
        </Card>
      ) : null}

      <DataGrid table={table} recordCount={rowsForVolet.length} isLoading={isLoading}>
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

      <AlertDialog open={!!slotToDetach} onOpenChange={(o) => !o && setSlotToDetach(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Détacher le fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              {slotToDetach ? (
                <>
                  Le fichier ne sera plus lié à la fiche « {slotToDetach.definition.title} ». Les références, dates et
                  notes sont conservées.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={detachMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={detachMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                if (slotToDetach) detachMutation.mutate(slotToDetach);
              }}
            >
              {detachMutation.isPending ? (
                <>
                  <Loader2 className="me-2 size-4 animate-spin" />
                  Détachement…
                </>
              ) : (
                'Détacher'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DossierSlotSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        settingsId={settingsId}
        slot={sheetSlot}
        initialMode={sheetMode}
      />

      <DossierFileViewerDialog
        open={!!viewerFile}
        onOpenChange={(o) => {
          if (!o) setViewerFile(null);
        }}
        file={viewerFile}
      />
    </>
  );
}
