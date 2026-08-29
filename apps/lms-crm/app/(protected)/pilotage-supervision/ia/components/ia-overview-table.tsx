'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type ArtifactRow = {
  id: string;
  status: string;
  useCase: string;
  targetEntityType: string | null;
  createdAt: string;
  provider: string;
  model: string;
};

const STATUS_LABEL: Record<string, string> = {
  PROPOSED: 'À valider',
  APPROVED: 'Approuvé',
  APPLIED: 'Appliqué',
  REJECTED: 'Rejeté',
};

function statusVariant(status: string): 'warning' | 'success' | 'info' | 'destructive' | 'secondary' {
  switch (status) {
    case 'PROPOSED':
      return 'warning';
    case 'APPROVED':
    case 'APPLIED':
      return 'success';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

export function IaOverviewTable() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const { data = [], isLoading } = useQuery({
    queryKey: ['pilotage-supervision', 'ia', 'artifacts-overview'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/pilotage-supervision/ia/artifacts?take=15');
      if (!res.ok) return [];
      return unwrapSectionApiData<{ items: ArtifactRow[] }>(await res.json())?.items ?? [];
    },
    staleTime: 30_000,
  });

  const columns = useMemo<ColumnDef<ArtifactRow>[]>(
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
          <Badge variant={statusVariant(row.original.status)}>
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 120,
      },
      {
        accessorKey: 'targetEntityType',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Cible" />,
        cell: ({ row }) => row.original.targetEntityType ?? '—',
        size: 120,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Créé" />,
        cell: ({ row }) =>
          format(new Date(row.original.createdAt), 'dd MMM yyyy HH:mm', { locale: fr }),
        size: 150,
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
      title="Artefacts récents"
      viewAllHref="/pilotage-supervision/ia/brouillons"
      viewAllLabel="Voir les brouillons"
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
    />
  );
}
