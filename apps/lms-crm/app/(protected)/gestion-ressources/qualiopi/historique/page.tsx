'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Container } from '@/components/common/container';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import {
  Toolbar,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
  ToolbarActions,
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { Card, CardHeader } from '@repo/ui/card';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type EventRow = {
  id: string;
  eventType: string;
  createdAt: string;
  itemCode: string | null;
  itemLabel: string | null;
  itemStatus: string | null;
  itemId: string | null;
  actorName: string | null;
};

type ListResponse = {
  items: EventRow[];
  pagination: { total: number; page: number; limit: number };
  summary: { totalEvents: number; openIssues: number };
};

export default function QualiopiHistoriquePage() {
  const { title, description } = usePageToolbarMeta('/gestion-ressources/qualiopi/historique');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data, isLoading } = useQuery({
    queryKey: ['qualiopi', 'events', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const page = pagination.pageIndex + 1;
      const res = await apiFetch(
        `/api/sections/gestion-ressources/qualiopi/events?page=${page}&limit=${pagination.pageSize}`,
      );
      if (!res.ok) throw new Error('Chargement historique impossible');
      return unwrapSectionApiData<ListResponse>(await res.json());
    },
  });

  const columns = useMemo<ColumnDef<EventRow>[]>(
    () => [
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Date" />,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: fr }),
        size: 150,
      },
      {
        accessorKey: 'eventType',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Événement" />,
        cell: ({ row }) => <Badge variant="secondary">{row.original.eventType}</Badge>,
      },
      {
        accessorKey: 'itemCode',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Indicateur" />,
        cell: ({ row }) =>
          row.original.itemCode ? (
            <div>
              <div className="font-medium">{row.original.itemCode}</div>
              <div className="text-muted-foreground text-xs line-clamp-1">
                {row.original.itemLabel}
              </div>
            </div>
          ) : (
            '—'
          ),
      },
      {
        accessorKey: 'itemStatus',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Statut pièce" />,
        cell: ({ row }) => row.original.itemStatus ?? '—',
        size: 110,
      },
      {
        accessorKey: 'actorName',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Acteur" />,
        cell: ({ row }) => row.original.actorName ?? '—',
      },
      {
        id: 'link',
        header: () => <span className="sr-only">Lien</span>,
        cell: ({ row }) =>
          row.original.itemCode ? (
            <Button size="sm" variant="ghost" asChild>
              <Link href={`/gestion-ressources/qualiopi/classeur#${row.original.itemCode}`}>
                Classeur
              </Link>
            </Button>
          ) : null,
        size: 90,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  const total = data?.summary.totalEvents ?? data?.pagination.total ?? 0;
  const openIssues = data?.summary.openIssues ?? 0;

  return (
    <Container className="space-y-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title}</ToolbarTitle>
          <ToolbarDescription>
            {description ||
              'Timeline ComplianceItemEvent (dossiers SCHOOL_QUALIOPI) — lecture seule, zéro nouveau modèle.'}
          </ToolbarDescription>
        </ToolbarHeading>
        <ToolbarActions>
          <Button variant="outline" asChild>
            <Link href="/gestion-ressources/qualiopi/classeur">Ouvrir le classeur</Link>
          </Button>
        </ToolbarActions>
      </Toolbar>

      <div className={MODULE_LANDING_STATS_GRID_ROW}>
        <Card className={cn(SECTION_KPI_CARD_ACCENTS[0])}>
          <CardHeader className="py-3">
            <div className="text-muted-foreground text-xs uppercase">Événements</div>
            <div className="text-2xl font-semibold tabular-nums">{total}</div>
          </CardHeader>
        </Card>
        <Card className={cn(SECTION_KPI_CARD_ACCENTS[1])}>
          <CardHeader className="py-3">
            <div className="text-muted-foreground text-xs uppercase">KO / à réparer</div>
            <div className="text-2xl font-semibold tabular-nums">{openIssues}</div>
          </CardHeader>
        </Card>
      </div>

      <ModuleDataGridShell
        table={table}
        recordCount={data?.pagination.total ?? 0}
        isLoading={isLoading}
        emptyMessage="Aucun événement Qualiopi"
      />
    </Container>
  );
}
