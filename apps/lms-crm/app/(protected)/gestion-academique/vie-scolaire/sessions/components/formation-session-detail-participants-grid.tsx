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
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import { useTranslation } from '@/hooks/useTranslation';

export type SessionParticipantRow = FormationSessionApiRow['participants'][number];

export function FormationSessionDetailParticipantsGrid({ participants }: { participants: SessionParticipantRow[] }) {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>({ pageIndex: 0, pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'name', desc: false }]);

  const columns = useMemo<ColumnDef<SessionParticipantRow>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.trainee')} column={column} />
        ),
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
              <span className="font-medium text-foreground">{p.name?.trim() || t('vieScolaire.common.noName')}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'email',
        id: 'email',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('vieScolaire.common.email')} column={column} />
        ),
        cell: ({ row }) => (
          <span className="max-w-[280px] truncate text-muted-foreground">{row.original.email}</span>
        ),
      },
    ],
    [t],
  );

  const table = useReactTable({
    data: participants,
    columns,
    getRowId: (r) => r.userId,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (participants.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/10 px-4 py-10 text-center text-sm text-muted-foreground">
        <Users className="mx-auto mb-2 size-8 opacity-40" aria-hidden />
        {t('vieScolaire.sessions.noParticipants')}
      </div>
    );
  }

  return (
    <DataGrid table={table} recordCount={participants.length} isLoading={false}>
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
  );
}
