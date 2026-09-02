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
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type SurveyRow = {
  id: string;
  timing: string;
  status: string;
  createdAt: string;
  sessionId: string;
  sessionLabel: string;
  formationName: string;
  participantName: string;
};

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  SENT: 'Envoyée',
  COMPLETED: 'Complétée',
  EXPIRED: 'Expirée',
};

async function fetchRecentSurveys(): Promise<SurveyRow[]> {
  const res = await apiFetch('/api/sections/gestion-academique/suivi-formations/satisfaction?take=15');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return unwrapSectionApiData<{ items: SurveyRow[] }>(json)?.items ?? [];
}

export function DocsCircuitsSurveysTable() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const { data = [], isLoading } = useQuery({
    queryKey: ['docs-circuits-recent-surveys'],
    queryFn: fetchRecentSurveys,
  });

  const columns = useMemo<ColumnDef<SurveyRow>[]>(
    () => [
      {
        accessorKey: 'formationName',
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.formationName}</p>
            <p className="text-2xs text-muted-foreground truncate">{row.original.participantName}</p>
          </div>
        ),
      },
      {
        accessorKey: 'timing',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <Badge variant="secondary" className="text-2xs">
            {row.original.timing === 'HOT' ? 'À chaud' : 'À froid'}
          </Badge>
        ),
        size: 90,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-2xs">
            {STATUS_LABEL[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 100,
      },
      {
        accessorKey: 'createdAt',
        header: ({ column }) => <DataGridColumnHeader title="Créée" column={column} />,
        cell: ({ row }) => (
          <span className="text-2xs text-muted-foreground">
            {format(new Date(row.original.createdAt), 'dd/MM/yyyy', { locale: fr })}
          </span>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: () => (
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href="/gestion-academique/suivi-formations/satisfaction">
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
      title="Enquêtes récentes"
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
      viewAllHref="/gestion-academique/suivi-formations/satisfaction"
      viewAllLabel="Toutes les enquêtes"
    />
  );
}
