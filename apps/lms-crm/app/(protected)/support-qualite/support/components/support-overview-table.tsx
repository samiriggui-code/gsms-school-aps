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

type TicketRow = {
  id: string;
  referenceCode: string;
  subject: string;
  status: string;
  priority: string;
  requesterName: string;
  updatedAt: string;
};

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Ouvert',
  IN_PROGRESS: 'En cours',
  WAITING_CLIENT: 'Attente',
  RESOLVED: 'Résolu',
  CLOSED: 'Clôturé',
};

async function fetchRecentTickets(): Promise<TicketRow[]> {
  const res = await apiFetch('/api/sections/support-qualite/support/tickets?limit=15');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  const data = unwrapSectionApiData<{ items: TicketRow[] }>(json);
  return data?.items ?? [];
}

export function SupportOverviewTable() {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data = [], isLoading } = useQuery({
    queryKey: ['support-recent-tickets'] as const,
    queryFn: fetchRecentTickets,
  });

  const columns = useMemo<ColumnDef<TicketRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
        size: 100,
      },
      {
        accessorKey: 'subject',
        header: ({ column }) => <DataGridColumnHeader title="Sujet" column={column} />,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="font-medium truncate">{row.original.subject}</p>
            <p className="text-2xs text-muted-foreground">{row.original.requesterName}</p>
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
        size: 110,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title="MAJ" column={column} />,
        cell: ({ row }) => (
          <span className="text-2xs text-muted-foreground">
            {format(new Date(row.original.updatedAt), 'dd/MM/yyyy', { locale: fr })}
          </span>
        ),
        size: 100,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <Button variant="ghost" size="icon" className="size-8" asChild>
            <Link href={`/support-qualite/support/tickets?ticket=${row.original.id}`}>
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
      title="Tickets récents"
      viewAllHref="/support-qualite/support/tickets"
      table={table}
      recordCount={data.length}
      isLoading={isLoading}
    />
  );
}
