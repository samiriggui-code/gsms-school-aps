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
import { Badge } from '@/components/ui/badge';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type QualiopiItem = {
  id: string;
  code: string;
  label: string;
  status: string;
};

type QualiopiBootstrap = {
  items: QualiopiItem[];
};

const STATUS_LABEL: Record<string, string> = {
  VALIDATED: 'OK',
  REJECTED: 'KO',
  REQUESTED: 'À réparer',
  WAIVED: 'N/A',
  RECEIVED: 'Reçu',
  MISSING: 'Manquant',
  EXPIRED: 'Expiré',
};

function statusVariant(status: string): 'success' | 'destructive' | 'warning' | 'secondary' {
  switch (status) {
    case 'VALIDATED':
    case 'WAIVED':
      return 'success';
    case 'REJECTED':
    case 'EXPIRED':
      return 'destructive';
    case 'REQUESTED':
    case 'MISSING':
      return 'warning';
    default:
      return 'secondary';
  }
}

/** Aperçu indicateurs à traiter — rangée data du module Qualiopi. */
export function QualiopiOverviewTable() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const { data = [], isLoading } = useQuery({
    queryKey: ['gestion-ressources', 'qualiopi', 'overview'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/qualiopi');
      if (!res.ok) throw new Error('fetch');
      const payload = unwrapSectionApiData<QualiopiBootstrap>(await res.json());
      return (payload?.items ?? []).filter((item) => !['VALIDATED', 'WAIVED'].includes(item.status));
    },
    staleTime: 30_000,
  });

  const columns = useMemo<ColumnDef<QualiopiItem>[]>(
    () => [
      {
        accessorKey: 'code',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Code" />,
        cell: ({ row }) => <span className="font-medium">{row.original.code}</span>,
        size: 90,
      },
      {
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Indicateur" />,
        cell: ({ row }) => (
          <span className="line-clamp-2 text-sm text-secondary-foreground">{row.original.label}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader column={column} title="Statut" />,
        cell: ({ row }) => (
          <Badge variant={statusVariant(row.original.status)}>
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 110,
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
      title="Indicateurs à traiter"
      viewAllHref="/gestion-ressources/qualiopi/classeur"
      viewAllLabel="Ouvrir le classeur"
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
    />
  );
}
