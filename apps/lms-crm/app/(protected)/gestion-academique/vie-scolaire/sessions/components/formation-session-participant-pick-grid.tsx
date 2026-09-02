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
import { Users } from 'lucide-react';
import { Card, CardFooter, CardTable } from '@repo/ui/card';
import { Checkbox } from '@repo/ui/checkbox';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';

export type ParticipantPickRow = {
  id: string;
  name: string | null;
  email: string;
  avatar?: string | null;
};

export function FormationSessionParticipantPickGrid({
  learners,
  selectedIds,
  onToggle,
  isLoading,
  emptyMessage = 'Aucun élève ou candidat éligible (comptes actifs).',
}: {
  learners: ParticipantPickRow[];
  selectedIds: Set<string>;
  onToggle: (userId: string, checked: boolean) => void;
  isLoading: boolean;
  emptyMessage?: string;
}) {
  const tableData = useMemo(() => {
    const rows = [...learners];
    rows.sort((a, b) => {
      const aSel = selectedIds.has(a.id) ? 0 : 1;
      const bSel = selectedIds.has(b.id) ? 0 : 1;
      if (aSel !== bSel) return aSel - bSel;
      const na = (a.name?.trim() || a.email).toLocaleLowerCase();
      const nb = (b.name?.trim() || b.email).toLocaleLowerCase();
      return na.localeCompare(nb, 'fr');
    });
    return rows;
  }, [learners, selectedIds]);

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<ParticipantPickRow>[]>(
    () => [
      {
        id: 'pick',
        header: () => <span className="text-xs font-normal text-muted-foreground">Inscrire</span>,
        cell: ({ row }) => (
          <Checkbox
            checked={selectedIds.has(row.original.id)}
            onCheckedChange={(v) => onToggle(row.original.id, v === true)}
            aria-label={`Inscrire ${row.original.name?.trim() || row.original.email}`}
          />
        ),
        size: 72,
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Stagiaire" column={column} />,
        sortingFn: (a, b) => {
          const na = (a.original.name?.trim() || a.original.email).toLocaleLowerCase();
          const nb = (b.original.name?.trim() || b.original.email).toLocaleLowerCase();
          return na.localeCompare(nb, 'fr');
        },
        cell: ({ row }) => {
          const p = row.original;
          return (
            <div className="flex items-center gap-3">
              <SessionUserAvatar name={p.name} email={p.email} avatar={p.avatar} sizeClassName="size-9" />
              <span className="font-medium text-foreground">{p.name?.trim() || 'Sans nom'}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        id: 'email',
        header: ({ column }) => <DataGridColumnHeader title="Email" column={column} />,
        cell: ({ row }) => (
          <span className="max-w-[280px] truncate text-muted-foreground">{row.original.email}</span>
        ),
      },
    ],
    [onToggle, selectedIds],
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

  if (!isLoading && learners.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted-foreground">
        Cochez les stagiaires à inscrire. Liste filtrée : dossier validé pour la formation de cette session.
        Validez avec <span className="font-medium text-foreground">Enregistrer la session</span>.
      </p>
      <DataGrid table={table} recordCount={tableData.length} isLoading={isLoading}>
        <Card className="border-border shadow-none">
          <CardTable>
            <ScrollArea>
              <div className="mb-2 flex items-center gap-2 px-2 pt-2 text-xs text-muted-foreground">
                <Users className="size-3.5 shrink-0" aria-hidden />
                <span>Apprenants éligibles (dossier validé)</span>
                {selectedIds.size > 0 ? (
                  <span className="font-medium text-foreground">· {selectedIds.size} sélectionné(s)</span>
                ) : null}
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
