'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type CircuitRow = {
  id: string;
  circuitKey: string;
  status: string;
  startedAt: string;
  sessionId: string;
  formationName: string;
  sessionLabel: string;
};

const STATUS_LABEL: Record<string, string> = {
  RUNNING: 'En cours',
  COMPLETED: 'Terminé',
  FAILED: 'Échec',
  CANCELLED: 'Annulé',
};

async function fetchRecentCircuits(): Promise<CircuitRow[]> {
  const res = await apiFetch('/api/sections/gestion-academique/suivi-formations/circuits?take=15');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return unwrapSectionApiData<{ items: CircuitRow[] }>(json)?.items ?? [];
}

export function DocsCircuitsRunsTable() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const { data = [], isLoading } = useQuery({
    queryKey: ['docs-circuits-recent-runs'],
    queryFn: fetchRecentCircuits,
  });

  const columns = useMemo<ColumnDef<CircuitRow>[]>(
    () => [
      {
        accessorKey: 'formationName',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.formationName}</p>
            <p className="text-2xs text-muted-foreground truncate">{row.original.circuitKey}</p>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-2xs">
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'startedAt',
        header: ({ column }) => <DataGridColumnHeader title="Démarré" column={column} />,
        cell: ({ row }) => (
          <span className="text-2xs text-muted-foreground">
            {format(new Date(row.original.startedAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
          </span>
        ),
        size: 130,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link
              href={`/gestion-academique/suivi-formations/tableau?sessionId=${row.original.sessionId}`}
            >
              <Eye className="size-4" />
            </Link>
          </Button>
        ),
        size: 48,
      },
    ],
    [],
  );

  const table = useReactTable({
    data,
    columns,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <ModuleLandingDataGridShell
      title="Circuits récents"
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
      viewAllHref="/gestion-academique/suivi-formations/circuits"
      viewAllLabel="Tous les circuits"
    />
  );
}
