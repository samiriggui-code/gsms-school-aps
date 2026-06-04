'use client';
import { useTranslation } from '@/hooks/useTranslation';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  VisibilityState,
  useReactTable,
} from '@tanstack/react-table';
import { Columns3, Eye, MapPin, Package, Search, SquarePen, Trash } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Card, CardFooter, CardTable } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import type { Equipment as Inventaire } from '@/app/models/equipment';
import { InventaireDetailsSheet } from '@/app/(protected)/gestion-ressources/equipements/inventaire/components/inventaire-details-sheet';
import { getEquipmentStatusProps } from '@/app/(protected)/gestion-ressources/equipements/inventaire/constants/status';
import { sessionsListQueryKey } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/sessions-manager';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

export type SessionEquipmentRow = FormationSessionApiRow['reservedEquipment'][number];

/** Colonnes secondaires masquées par défaut pour limiter la largeur du tableau. */
const DEFAULT_COLUMN_VISIBILITY: VisibilityState = {
  type: false,
  assignedSite: false,
  createdAt: false,
};

const OPTIONAL_COLUMN_LABELS: Record<string, string> = {
  type: 'Type technique',
  assignedSite: 'Site',
  createdAt: 'Ajouté le',
};

function rowToInventaireStub(row: SessionEquipmentRow): Inventaire {
  return {
    id: row.id,
    serialNumber: row.serialNumber,
    label: row.label,
    type: row.type,
    status: row.status,
    assignedSiteId: row.assignedSite?.id ?? null,
    assignedSite: row.assignedSite ?? null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
  };
}

export function FormationSessionDetailEquipmentGrid({
  sessionId,
  reservedEquipmentIds,
  equipment,
  onSessionRefreshed,
}: {
  sessionId: string;
  reservedEquipmentIds: string[];
  equipment: SessionEquipmentRow[];
  /** Met à jour le snapshot session dans le sheet parent après PATCH (ex. retrait équipement). */
  onSessionRefreshed?: (session: FormationSessionApiRow) => void;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'label', desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(DEFAULT_COLUMN_VISIBILITY);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsTab, setDetailsTab] = useState<string>('overview');
  const [selectedRow, setSelectedRow] = useState<SessionEquipmentRow | null>(null);
  const [removeTarget, setRemoveTarget] = useState<SessionEquipmentRow | null>(null);

  const removeMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const nextIds = reservedEquipmentIds.filter((id) => id !== equipmentId);
      const res = await apiFetch(`/api/sections/gestion-academique/vie-scolaire/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reservedEquipmentIds: nextIds }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j?.success) {
        throw new Error(j?.error?.message || 'Mise à jour impossible.');
      }
      return j.data?.item as FormationSessionApiRow;
    },
    onSuccess: (item) => {
      void queryClient.invalidateQueries({ queryKey: [...sessionsListQueryKey] });
      void queryClient.invalidateQueries({ queryKey: ['gestion-academique', 'vie-scolaire', 'sessions'] });
      if (item) onSessionRefreshed?.(item);
      toast.success(t('sessions.equipmentRemoved'));
      setRemoveTarget(null);
    },
    onError: (e: Error) => {
      toast.error(e.message || 'Échec du retrait.');
    },
  });

  const filteredEquipment = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return equipment;
    return equipment.filter((e) => {
      const statusLabel = getEquipmentStatusProps(e.status).label;
      const parts = [e.label, e.serialNumber, e.type, e.assignedSite?.name, statusLabel];
      return parts.some((p) => p && String(p).toLowerCase().includes(q));
    });
  }, [equipment, search]);

  useEffect(() => {
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  }, [search]);

  const openDetails = useCallback((row: SessionEquipmentRow, tab: string) => {
    setSelectedRow(row);
    setDetailsTab(tab);
    setDetailsOpen(true);
  }, []);

  const columns = useMemo<ColumnDef<SessionEquipmentRow>[]>(
    () => [
      {
        id: 'index',
        header: '#',
        cell: ({ row, table }) => {
          const { pageIndex, pageSize } = table.getState().pagination;
          const n = pageIndex * pageSize + row.index + 1;
          return <span className="tabular-nums text-muted-foreground">{n}</span>;
        },
        size: 48,
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'label',
        id: 'label',
        enableHiding: false,
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.categoryModel')} column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border/50 bg-muted/10">
              <Package className="size-5 text-muted-foreground" />
            </div>
            <div className="flex min-w-0 flex-col">
              <button
                type="button"
                className="text-left text-sm font-bold text-foreground transition-colors hover:text-primary"
                onClick={() => openDetails(row.original, 'overview')}
              >
                {row.original.label}
              </button>
              <span className="text-[10px] font-medium uppercase tracking-tight text-muted-foreground">
                Réf: {row.original.serialNumber?.trim() || 'N/A'}
              </span>
            </div>
          </div>
        ),
        size: 320,
      },
      {
        accessorKey: 'type',
        id: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type technique" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" size="sm" className="text-[9px] font-bold uppercase tracking-widest border-primary/20 bg-primary/5 px-2 text-primary">
            {row.original.type?.trim() || 'NON DÉFINI'}
          </Badge>
        ),
        size: 200,
      },
      {
        accessorKey: 'status',
        id: 'status',
        enableHiding: false,
        header: ({ column }) => <DataGridColumnHeader title="État stock" column={column} />,
        cell: ({ row }) => {
          const st = getEquipmentStatusProps(row.original.status);
          return (
            <div className="flex flex-wrap items-center gap-1.5">
              <Badge variant={st.variant} size="sm" appearance="light" className="font-bold uppercase text-[9px]">
                {st.label}
              </Badge>
              <Badge variant="secondary" size="sm" appearance="light" className="text-[9px] font-semibold uppercase">
                Réservé session
              </Badge>
            </div>
          );
        },
        size: 220,
      },
      {
        id: 'assignedSite',
        accessorFn: (r) => r.assignedSite?.name ?? '',
        header: ({ column }) => <DataGridColumnHeader title="Site" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="text-sm text-foreground/80">{row.original.assignedSite?.name || 'Non affecté'}</span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'createdAt',
        id: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Ajouté le" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.createdAt ? formatDateTime(new Date(row.original.createdAt)) : '—'}
          </span>
        ),
        size: 175,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-2 pe-2">
            <Button variant="ghost" mode="icon" className="size-8" onClick={() => openDetails(row.original, 'overview')}>
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button variant="ghost" mode="icon" className="size-8" onClick={() => openDetails(row.original, 'settings')}>
              <SquarePen className="size-4 text-muted-foreground" />
            </Button>
            <Button
              variant="ghost"
              mode="icon"
              className="size-8 text-destructive hover:text-destructive"
              disabled={removeMutation.isPending}
              onClick={() => setRemoveTarget(row.original)}
            >
              <Trash className="size-4" />
            </Button>
          </div>
        ),
        size: 130,
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [removeMutation.isPending, openDetails],
  );

  const table = useReactTable({
    data: filteredEquipment,
    columns,
    getRowId: (r) => r.id,
    state: { pagination, sorting, columnVisibility },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (equipment.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
        <Package className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
        Aucun équipement réservé pour cette session.
      </div>
    );
  }

  const toolbar = (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative min-w-0 flex-1 sm:max-w-[240px]">
        <Search className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Modèle, réf., type, site…"
          className="h-8 ps-8 text-xs"
          aria-label="Rechercher dans les équipements"
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 px-2.5 text-xs shrink-0">
            <Columns3 className="size-3.5" />
            Colonnes
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-[12rem]">
          <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
            Colonnes supplémentaires
          </DropdownMenuLabel>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => (
              <DropdownMenuCheckboxItem
                key={column.id}
                className="text-xs"
                checked={column.getIsVisible()}
                onSelect={(event) => event.preventDefault()}
                onCheckedChange={(value) => column.toggleVisibility(!!value)}
              >
                {OPTIONAL_COLUMN_LABELS[column.id] ?? column.id}
              </DropdownMenuCheckboxItem>
            ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );

  return (
    <>
      {toolbar}
      {filteredEquipment.length === 0 ? (
        <div className="rounded-xl border border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
          <Search className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
          Aucun équipement ne correspond à votre recherche.
        </div>
      ) : (
        <DataGrid table={table} recordCount={filteredEquipment.length} isLoading={false}>
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
      )}

      <InventaireDetailsSheet
        open={detailsOpen}
        onOpenChange={(o) => {
          setDetailsOpen(o);
          if (!o) setSelectedRow(null);
        }}
        inventaire={selectedRow ? rowToInventaireStub(selectedRow) : null}
        defaultTab={detailsTab}
        onEditClick={() => setDetailsTab('settings')}
      />

      <AlertDialog open={Boolean(removeTarget)} onOpenChange={(o) => !o && setRemoveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer l&apos;équipement de la session ?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;équipement « {removeTarget?.label} » sera retiré de la réservation pour cette session. Le matériel reste dans l&apos;inventaire ; seul le lien avec cette session est supprimé.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMutation.isPending || !removeTarget}
              onClick={() => removeTarget && removeMutation.mutate(removeTarget.id)}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
