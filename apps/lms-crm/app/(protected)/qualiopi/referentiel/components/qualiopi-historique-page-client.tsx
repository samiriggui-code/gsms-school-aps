'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Loader2 } from 'lucide-react';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';

type QualiopiEventRow = {
  id: string;
  eventType: string;
  createdAt: string;
  itemCode: string | null;
  itemLabel: string | null;
  itemStatus: string | null;
  itemId: string | null;
  actorName: string | null;
};

type QualiopiEventsPayload = {
  items: QualiopiEventRow[];
  pagination: { total: number; page: number; limit: number };
  summary: { totalEvents: number; openIssues: number };
};

const STATUS_LABEL: Record<string, string> = {
  VALIDATED: 'OK',
  REJECTED: 'KO',
  REQUESTED: 'À réparer',
  WAIVED: 'N/A',
  MISSING: 'Manquant',
  RECEIVED: 'Reçu',
  EXPIRED: 'Expiré',
};

export function QualiopiHistoriquePageClient() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const eventsQuery = useQuery({
    queryKey: [
      'gestion-ressources',
      'qualiopi',
      'events',
      pagination.pageIndex,
      pagination.pageSize,
    ],
    queryFn: async () => {
      const page = pagination.pageIndex + 1;
      const res = await apiFetch(
        `/api/sections/gestion-ressources/qualiopi/events?page=${page}&limit=${pagination.pageSize}`,
      );
      if (!res.ok) throw new Error('events');
      return unwrapSectionApiData<QualiopiEventsPayload>(await res.json());
    },
    staleTime: 30_000,
  });

  const columns = useMemo<ColumnDef<QualiopiEventRow>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">
            {new Date(row.original.createdAt).toLocaleString('fr-FR')}
          </span>
        ),
      },
      {
        accessorKey: 'eventType',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Événement" />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="font-mono text-xs">
            {row.original.eventType}
          </Badge>
        ),
      },
      {
        accessorKey: 'itemCode',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Indicateur" />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-mono text-xs text-muted-foreground">
              {row.original.itemCode ?? '—'}
            </p>
            <p className="truncate text-sm">{row.original.itemLabel ?? '—'}</p>
          </div>
        ),
      },
      {
        accessorKey: 'itemStatus',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => {
          const status = row.original.itemStatus;
          if (!status) return '—';
          return (
            <Badge variant={status === 'REJECTED' ? 'destructive' : 'outline'}>
              {STATUS_LABEL[status] ?? status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'actorName',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Acteur" />,
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {row.original.actorName ?? 'Système'}
          </span>
        ),
      },
    ],
    [],
  );

  const table = useReactTable({
    data: eventsQuery.data?.items ?? [],
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    pageCount: Math.max(
      1,
      Math.ceil((eventsQuery.data?.pagination.total ?? 0) / pagination.pageSize),
    ),
  });

  if (eventsQuery.isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de l&apos;historique Qualiopi…
      </div>
    );
  }

  if (eventsQuery.isError) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm">
        <p className="font-medium text-destructive">Impossible de charger l&apos;historique.</p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => void eventsQuery.refetch()}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  const summary = eventsQuery.data?.summary;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <Badge variant="outline">{summary?.totalEvents ?? 0} événements</Badge>
        <Badge variant={summary && summary.openIssues > 0 ? 'destructive' : 'secondary'}>
          {summary?.openIssues ?? 0} écarts ouverts
        </Badge>
        <Button asChild variant="ghost" size="sm" className="ms-auto">
          <Link href="/qualiopi/referentiel/classeur">Voir le classeur</Link>
        </Button>
      </div>

      <ModuleLandingDataGridShell
        title="Timeline ComplianceItemEvent"
        viewAllHref="/qualiopi/referentiel/classeur"
        viewAllLabel="Classeur"
        table={table}
        recordCount={eventsQuery.data?.pagination.total ?? 0}
        isLoading={eventsQuery.isFetching}
      />
    </div>
  );
}
