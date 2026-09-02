'use client';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { AlertTriangle, Package } from 'lucide-react';
import { Badge } from '@repo/ui/badge';
import { Card, CardFooter, CardTable } from '@repo/ui/card';
import { Checkbox } from '@repo/ui/checkbox';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import {
  buildEquipmentPickRows,
  equipmentInventoryLabel,
  type EquipmentPickRowModel,
} from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-equipment-availability';

type InvRow = { id: string; label: string; serialNumber: string; status: string };

export function FormationSessionEquipmentPickGrid({
  inventory,
  sessions,
  selectedIds,
  onToggle,
  rangeStart,
  rangeEnd,
  excludeSessionId,
  isLoadingInventory,
  isLoadingSessions,
}: {
  inventory: InvRow[];
  sessions: FormationSessionApiRow[];
  selectedIds: Set<string>;
  onToggle: (id: string, checked: boolean) => void;
  rangeStart: Date | null;
  rangeEnd: Date | null;
  excludeSessionId: string | null;
  isLoadingInventory: boolean;
  isLoadingSessions: boolean;
}) {
  /** Sans mémo, un nouvel objet à chaque rendu relançait `buildEquipmentPickRows` (O équipements × sessions) en boucle. */
  const draftRange = useMemo(() => {
    if (!rangeStart || !rangeEnd) return null;
    if (rangeStart.getTime() > rangeEnd.getTime()) return null;
    return { start: rangeStart, end: rangeEnd };
  }, [rangeStart?.getTime(), rangeEnd?.getTime()]);

  const tableData = useMemo(
    () => buildEquipmentPickRows(inventory, sessions, draftRange, excludeSessionId, selectedIds),
    [inventory, sessions, draftRange, excludeSessionId, selectedIds],
  );

  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<EquipmentPickRowModel>[]>(
    () => [
      {
        id: 'pick',
        header: () => <span className="text-xs font-normal text-muted-foreground">Réserver</span>,
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(v) => onToggle(row.original.id, v === true)}
            disabled={!row.original.isSelectableInventory}
            aria-label={`Réserver ${row.original.label}`}
          />
        ),
        size: 72,
        enableSorting: false,
      },
      {
        accessorKey: 'label',
        id: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Équipement" column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-foreground">{row.original.label}</span>
            <span className="font-mono text-xs text-muted-foreground">{row.original.serialNumber}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        id: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut inventaire" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant={row.original.isSelectableInventory ? 'success' : 'secondary'}
            appearance="light"
            size="sm"
            className="w-fit"
          >
            {equipmentInventoryLabel(row.original.status)}
          </Badge>
        ),
      },
      {
        id: 'window',
        header: ({ column }) => <DataGridColumnHeader title="Disponibilité session" column={column} />,
        enableSorting: false,
        cell: ({ row }) => {
          if (!draftRange) {
            return (
              <span className="text-xs text-amber-700 dark:text-amber-500">
                Indiquez début + fin de session pour tester les chevauchements.
              </span>
            );
          }
          if (row.original.conflictHint) {
            return (
              <span className="inline-flex items-start gap-1 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span>Réservé ailleurs : {row.original.conflictHint}</span>
              </span>
            );
          }
          if (!row.original.isSelectableInventory) {
            return <span className="text-xs text-muted-foreground">Non disponible au catalogue matériel.</span>;
          }
          return <span className="text-xs text-emerald-700 dark:text-emerald-400">Libre sur cette période</span>;
        },
      },
    ],
    [draftRange, onToggle, selectedIds],
  );

  const table = useReactTable({
    data: tableData,
    columns,
    getRowId: (r) => r.id,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const busy = isLoadingInventory || isLoadingSessions;

  if (!busy && inventory.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">Aucun équipement listé dans l&apos;inventaire.</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Les lignes sont triées : sélection en tête, puis matériel libre sur la période (si dates renseignées),
        statut « disponible » en priorité. Les réservations sur d&apos;autres sessions qui chevauchent vos dates
        sont signalées.
      </p>
      <DataGrid table={table} recordCount={tableData.length} isLoading={busy}>
        <Card className="border-border shadow-none">
          <CardTable>
            <ScrollArea>
              <div className="mb-2 flex items-center gap-2 px-2 pt-2 text-xs text-muted-foreground">
                <Package className="size-3.5 shrink-0" aria-hidden />
                <span>Inventaire équipements</span>
              </div>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter className="border-t border-border">
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>
    </div>
  );
}
