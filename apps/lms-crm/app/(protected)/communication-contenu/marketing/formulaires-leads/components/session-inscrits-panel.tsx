'use client';
import { MODULE_LANDING_DATAGRID_PAGE_SIZE } from '@/app/(protected)/securite-configuration/components/datagrid-standards';

import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { apiFetch } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Card, CardFooter, CardHeader, CardTable } from '@repo/ui/card';
import { DataGrid } from '@repo/ui/data-grid';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { DataGridPagination } from '@repo/ui/data-grid-pagination';
import { DataGridTable } from '@repo/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@repo/ui/scroll-area';
import { SessionUserAvatar } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-user-avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import type { FormationSessionApiRow } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/types/formation-session-api-row';

type ParticipantRow = FormationSessionApiRow['participants'][number];

async function unwrapSessions(json: Record<string, unknown>): Promise<FormationSessionApiRow[]> {
  if (!json.success || !json.data) return [];
  const inner = json.data as Record<string, unknown>;
  return Array.isArray(inner.items) ? (inner.items as FormationSessionApiRow[]) : [];
}

export function SessionInscritsPanel({
  leaderSlot,
  scopeTabs,
}: {
  leaderSlot?: ReactNode;
  scopeTabs: ReactNode;
}) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: MODULE_LANDING_DATAGRID_PAGE_SIZE,
  });

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['formation-sessions', 'inscrits-panel'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/sessions');
      const json = await res.json();
      if (!res.ok) throw new Error('Sessions indisponibles.');
      return unwrapSessions(json);
    },
    staleTime: 1000 * 60,
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedSession = useMemo(() => {
    if (!selectedId) return null;
    return sessions.find((s) => s.id === selectedId) ?? null;
  }, [sessions, selectedId]);

  const participantRows: ParticipantRow[] = selectedSession?.participants ?? [];

  const columns = useMemo<ColumnDef<ParticipantRow>[]>(
    () => [
      {
        accessorKey: 'name',
        id: 'name',
        header: ({ column }) => <DataGridColumnHeader title="Participant" column={column} />,
        cell: ({ row }) => {
          const u = row.original;
          return (
            <div className="flex items-center gap-3">
              <SessionUserAvatar name={u.name} email={u.email} avatar={u.avatar} sizeClassName="size-9" />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{u.name || '—'}</span>
                <span className="truncate text-xs text-muted-foreground">{u.email}</span>
              </div>
            </div>
          );
        },
        size: 280,
      },
      {
        id: 'badge',
        header: () => <span className="text-xs uppercase text-muted-foreground">Rattachement</span>,
        cell: () => (
          <Badge variant="secondary" appearance="light" className="text-xs">
            Liste session (aperçu catalogue)
          </Badge>
        ),
        size: 200,
      },
    ],
    [],
  );

  const table = useReactTable({
    columns,
    data: participantRows,
    pageCount: Math.max(1, Math.ceil(participantRows.length / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: false,
    getRowId: (r) => r.userId,
  });

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="space-y-4 py-4">
          {leaderSlot}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">Inscrits par session</h4>
            <p className="text-xs text-muted-foreground">
              Aperçu des participants rattachés côté fiche session (liste catalogue). Pour le flux dossier{' '}
              <strong>VALIDATED → session</strong>, utilisez ensuite l&apos;API participants avec{' '}
              <code className="text-[11px]">candidatureId</code>.
            </p>
          </div>
          <Select
            value={selectedId ?? '__none__'}
            onValueChange={(v) => setSelectedId(v === '__none__' ? null : v)}
            disabled={isLoading || sessions.length === 0}
          >
            <SelectTrigger className="h-10 w-full max-w-none">
              <SelectValue placeholder="Choisir une session…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">—</SelectItem>
              {sessions.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.formationName} — {s.dateDisplayLabel} ({s.location})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="min-w-0">{scopeTabs}</div>
          </div>
        </CardHeader>
      </Card>

      {!selectedSession ? (
        <Card className="border-border shadow-none">
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Sélectionnez une session pour afficher les inscrits.
          </div>
        </Card>
      ) : (
        <DataGrid
          table={table}
          recordCount={participantRows.length}
          isLoading={isLoading}
          tableLayout={{
            columnsResizable: true,
            columnsPinnable: false,
            columnsMovable: false,
            columnsVisibility: false,
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
      )}
    </>
  );
}
