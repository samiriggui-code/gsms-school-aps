'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { formatDateTime } from '@/lib/helpers';
import { Button } from '@/components/ui/button';
import { User, ExternalLink } from 'lucide-react';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import type { VenueRoomRow, VenueRoomSessionRow } from '../../types';

export function SalleDetailsSessions({ room }: { room: VenueRoomRow }) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startDate', desc: true }]);

  const fetchSessions = async ({
    pageIndex,
    pageSize,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<VenueRoomSessionRow>> => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
    });
    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/salles/${room.id}/sessions?${params}`,
    );
    if (!response.ok) throw new Error('Échec du chargement des sessions');
    const json = await response.json();
    const payload = json?.data ?? json;
    const rows = payload?.data ?? [];
    return {
      data: rows,
      empty: rows.length === 0,
      pagination: payload?.pagination ?? {
        total: rows.length,
        page: pageIndex + 1,
        limit: pageSize,
        totalPages: 1,
      },
    };
  };

  const { data: response, isLoading } = useQuery({
    queryKey: ['salle-equipment-sessions', room.id, pagination],
    queryFn: () =>
      fetchSessions({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
      }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const columns = useMemo<ColumnDef<VenueRoomSessionRow>[]>(
    () => [
      {
        accessorKey: 'sessionTitle',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase truncate max-w-[180px]">
              {row.original.sessionTitle}
            </span>
            {row.original.formationName ? (
              <span className="text-[10px] text-muted-foreground truncate">
                {row.original.formationName}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        accessorKey: 'startDate',
        header: ({ column }) => <DataGridColumnHeader title="Période" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col text-[10px] text-muted-foreground font-medium">
            <span>Du {formatDateTime(row.original.startDate)}</span>
            <span>Au {formatDateTime(row.original.endDate)}</span>
          </div>
        ),
      },
      {
        accessorKey: 'trainerName',
        header: ({ column }) => <DataGridColumnHeader title="Formateur" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs">
            <User className="size-3 text-muted-foreground" />
            <span className="truncate max-w-[100px]">{row.original.trainerName || '—'}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
            <Link
              href={`/gestion-academique/vie-scolaire/sessions?highlight=${row.original.sessionId}`}
            >
              <ExternalLink className="size-3.5" />
              Session
            </Link>
          </Button>
        ),
        size: 100,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    pageCount: Math.ceil(totalCount / pagination.pageSize) || 1,
    state: { pagination, sorting },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Sessions liées à cette salle via le référentiel (venueRoomId). Aucune donnée inventée côté
        interface.
      </p>
      {!isLoading && totalCount === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/10 px-6 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">Aucune session sur cette salle</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto">
            Associez une salle lors de la création ou modification d&apos;une session en Vie
            scolaire.
          </p>
        </div>
      ) : (
        <DataGrid table={table} recordCount={totalCount} isLoading={isLoading}>
          <div className="border border-border rounded-xl overflow-hidden bg-card">
            <DataGridTable />
            <div className="p-2 border-t border-border bg-muted/20">
              <DataGridPagination />
            </div>
          </div>
        </DataGrid>
      )}
    </div>
  );
}
