'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { apiFetch } from '@/lib/api';
import { Equipment } from '@/app/models/equipment';
import { formatDateTime } from '@/lib/helpers';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, ExternalLink, MapPin, Undo2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';

interface SessionRow {
  id: string;
  sessionId: string;
  sessionTitle: string;
  formationName?: string;
  startDate: string;
  endDate: string;
  venueRoomName: string | null;
  location: string | null;
  trainerName: string | null;
}

export function AffectationDetailsSessions({ equipment }: { equipment: Equipment }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([{ id: 'startDate', desc: true }]);

  const fetchSessions = async ({
    pageIndex,
    pageSize,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<SessionRow>> => {
    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
    });
    const response = await apiFetch(
      `/api/sections/gestion-ressources/equipements/inventaire/${equipment.id}/sessions?${params}`,
    );
    if (!response.ok) throw new Error('Échec du chargement des sessions');
    const json = await response.json();
    const payload = json?.data ?? json;
    const rows = payload?.data ?? payload?.items ?? [];
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
    queryKey: ['affectation-equipment-sessions', equipment.id, pagination],
    queryFn: () =>
      fetchSessions({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
      }),
  });

  const items = response?.data ?? [];
  const totalCount = response?.pagination?.total ?? 0;

  const unassignMutation = useMutation({
    mutationFn: async (row: SessionRow) => {
      const res = await apiFetch(
        '/api/sections/gestion-ressources/equipements/affectations/unassign',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            equipmentId: equipment.id,
            sessionId: row.sessionId,
          }),
        },
      );
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j?.error?.message || 'Désaffectation impossible');
      }
      return res.json();
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['affectation-equipment-sessions', equipment.id] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-affectations-list'] });
      void queryClient.invalidateQueries({ queryKey: ['equipment-catalog'] });
      toast.success('Pièce désaffectée — retour stock si possible');
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<SessionRow>[]>(
    () => [
      {
        accessorKey: 'sessionTitle',
        header: ({ column }) => <DataGridColumnHeader title="Session" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs uppercase truncate max-w-[180px]">
              {row.original.sessionTitle}
            </span>
            {row.original.formationName && (
              <span className="text-[10px] text-muted-foreground truncate">
                {row.original.formationName}
              </span>
            )}
          </div>
        ),
      },
      {
        id: 'salle',
        header: ({ column }) => <DataGridColumnHeader title="Salle" column={column} />,
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-xs text-foreground/80">
            <MapPin className="size-3 shrink-0 text-muted-foreground" />
            <span className="truncate max-w-[140px]">
              {row.original.venueRoomName || row.original.location || '—'}
            </span>
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
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.trainer')} column={column} />,
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1 text-xs"
              disabled={unassignMutation.isPending}
              onClick={() => unassignMutation.mutate(row.original)}
            >
              <Undo2 className="size-3.5" />
              Retirer
            </Button>
            <Button variant="ghost" size="sm" className="h-8 gap-1 text-xs" asChild>
              <Link href={`/gestion-academique/vie-scolaire/sessions?highlight=${row.original.sessionId}`}>
                <ExternalLink className="size-3.5" />
                Session
              </Link>
            </Button>
          </div>
        ),
        size: 160,
      },
    ],
    [t, unassignMutation],
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
        Sessions où cette pièce est réservée. Utilisez « Retirer » pour désaffecter et remettre en stock,
        ou la fiche session (Vie scolaire) pour ajuster la réservation.
      </p>
      <DataGrid table={table} recordCount={totalCount} isLoading={isLoading}>
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <DataGridTable />
          <div className="p-2 border-t border-border bg-muted/20">
            <DataGridPagination />
          </div>
        </div>
      </DataGrid>
    </div>
  );
}
