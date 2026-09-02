'use client';

import { useMemo, useState } from 'react';
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
} from '@/components/common/toolbar';
import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { Badge } from '@repo/ui/badge';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type RunRow = {
  id: string;
  useCase: string;
  status: string;
  provider: string;
  model: string;
  promptTokens: number | null;
  completionTokens: number | null;
  errorMessage: string | null;
  artifactCount: number;
  createdAt: string;
  completedAt: string | null;
};

type ListResponse = {
  items: RunRow[];
  pagination: { total: number; page: number; limit: number };
};

function runVariant(status: string): 'success' | 'destructive' | 'warning' | 'secondary' | 'info' {
  switch (status) {
    case 'SUCCEEDED':
      return 'success';
    case 'FAILED':
      return 'destructive';
    case 'RUNNING':
    case 'PENDING':
      return 'warning';
    default:
      return 'secondary';
  }
}

export default function IaHistoriquePage() {
  const { title, description } = usePageToolbarMeta('/pilotage-supervision/ia/historique');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data, isLoading } = useQuery({
    queryKey: ['ia', 'runs', pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const page = pagination.pageIndex + 1;
      const res = await apiFetch(
        `/api/sections/pilotage-supervision/ia/runs?page=${page}&limit=${pagination.pageSize}`,
      );
      if (!res.ok) throw new Error('Chargement historique impossible');
      return unwrapSectionApiData<ListResponse>(await res.json());
    },
  });

  const columns = useMemo<ColumnDef<RunRow>[]>(
    () => [
      {
        accessorKey: 'useCase',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Cas d'usage" />,
        cell: ({ row }) => <span className="font-medium">{row.original.useCase}</span>,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => (
          <Badge variant={runVariant(row.original.status)}>{row.original.status}</Badge>
        ),
        size: 110,
      },
      {
        accessorKey: 'provider',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Provider" />,
        cell: ({ row }) => (
          <span className="text-muted-foreground text-sm">
            {row.original.provider}/{row.original.model}
          </span>
        ),
      },
      {
        accessorKey: 'artifactCount',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Artefacts" />,
        size: 90,
      },
      {
        id: 'tokens',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Tokens" />,
        cell: ({ row }) => {
          const p = row.original.promptTokens;
          const c = row.original.completionTokens;
          if (p == null && c == null) return '—';
          return `${p ?? 0} / ${c ?? 0}`;
        },
        size: 100,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Créé" />,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: fr }),
        size: 150,
      },
      {
        accessorKey: 'errorMessage',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Erreur" />,
        cell: ({ row }) =>
          row.original.errorMessage ? (
            <span className="text-destructive line-clamp-2 text-xs" title={row.original.errorMessage}>
              {row.original.errorMessage}
            </span>
          ) : (
            '—'
          ),
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

  return (
    <Container className="space-y-5">
      <Toolbar>
        <ToolbarHeading>
          <ToolbarTitle>{title}</ToolbarTitle>
          <ToolbarDescription>
            {description || 'Journal AiRun — provider, statut, tokens, erreurs (sans secrets).'}
          </ToolbarDescription>
        </ToolbarHeading>
      </Toolbar>
      <ModuleDataGridShell
        table={table}
        recordCount={data?.pagination.total ?? 0}
        isLoading={isLoading}
        emptyMessage="Aucun run IA"
      />
    </Container>
  );
}
