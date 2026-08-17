'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import type { FinanceOperationRow } from '@/lib/finance/finance-operations-feed';

function getStatusColor(status: FinanceOperationRow['statusUi']) {
  switch (status) {
    case 'PAID':
    case 'ACCEPTED':
      return 'success';
    case 'PENDING':
    case 'SENT':
      return 'warning';
    case 'OVERDUE':
    case 'FAILED':
      return 'destructive';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getStatusLabel(row: FinanceOperationRow) {
  switch (row.statusUi) {
    case 'PAID':
      return 'PAYÉ';
    case 'PENDING':
      return 'EN ATTENTE';
    case 'OVERDUE':
      return 'EN RETARD';
    case 'DRAFT':
      return 'BROUILLON';
    case 'SENT':
      return 'ENVOYÉ';
    case 'ACCEPTED':
      return 'ACCEPTÉ';
    case 'FAILED':
      return 'ÉCHEC';
    default:
      return row.status || 'INCONNU';
  }
}

async function fetchOperations(): Promise<FinanceOperationRow[]> {
  const res = await apiFetch('/api/sections/administration-facturation/finance/operations?limit=20');
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (json as { error?: { message?: string } }).error?.message ?? 'Chargement impossible',
    );
  }
  const data = unwrapSectionApiData<{ items: FinanceOperationRow[] }>(json);
  return data?.items ?? [];
}

export function FinanceOperationsTable() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { data = [], isLoading, isError } = useQuery({
    queryKey: ['finance-operations-feed'] as const,
    queryFn: fetchOperations,
  });

  const columns = useMemo<ColumnDef<FinanceOperationRow>[]>(
    () => [
      {
        accessorKey: 'reference',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => (
          <span className="font-bold text-2sm text-muted-foreground">{row.original.reference}</span>
        ),
        size: 110,
      },
      {
        accessorKey: 'typeLabel',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <Badge appearance="light" className="font-bold uppercase text-2xs">
            {row.original.typeLabel}
          </Badge>
        ),
        size: 100,
      },
      {
        id: 'client',
        header: ({ column }) => <DataGridColumnHeader title="Client" column={column} />,
        cell: ({ row }) => (
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-sm text-foreground truncate">{row.original.client}</span>
            <span className="text-2xs text-muted-foreground italic">
              {row.original.dueDate
                ? `Échéance ${format(new Date(row.original.dueDate), 'dd/MM/yyyy', { locale: fr })}`
                : 'Sans échéance'}
            </span>
          </div>
        ),
        size: 200,
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="Montant" column={column} />,
        cell: ({ row }) => (
          <span className="text-sm font-bold text-foreground">
            {row.original.amount.toLocaleString('fr-FR')} €
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'statusUi',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => (
          <Badge
            appearance="light"
            className="font-bold uppercase text-2xs"
            color={getStatusColor(row.original.statusUi) as 'success'}
          >
            {getStatusLabel(row.original)}
          </Badge>
        ),
        size: 120,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="size-8 hover:bg-primary/10 hover:text-primary"
              asChild
            >
              <Link href={row.original.href}>
                <Eye className="size-4" />
              </Link>
            </Button>
          </div>
        ),
        size: 60,
        enableSorting: false,
      },
    ],
    [t],
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(data.length / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[240px] items-center justify-center rounded-xl border border-border bg-card">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Impossible de charger le flux financier récent.
      </div>
    );
  }

  return (
    <ModuleLandingDataGridShell
      title="Flux financier récent"
      viewAllHref="/administration-facturation/finance/devis"
      table={table}
      recordCount={data.length}
    />
  );
}
