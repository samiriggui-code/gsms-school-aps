'use client';

import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleDataGridShell } from '@/components/common/module-data-grid-shell';
import { Badge } from '@repo/ui/badge';
import { DataGridColumnHeader } from '@repo/ui/data-grid-column-header';
import { Progress } from '@repo/ui/progress';
import type { FinanceRapportsPayload } from '@/lib/finance/finance-rapports-build';

function fmtEuro(n: number) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(n);
}

function fmtMonth(key: string) {
  const [y, m] = key.split('-').map(Number);
  if (!y || !m) return key;
  return new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
}

const PAYMENT_STATUS_FR: Record<string, string> = {
  PENDING: 'En attente',
  RECEIVED: 'Encaissé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

type FinanceRapportDataGridProps<T extends object> = {
  title: string;
  subtitle: string;
  data: T[];
  columns: ColumnDef<T>[];
  emptyMessage: string;
  getRowId?: (row: T, index: number) => string;
};

function FinanceRapportDataGrid<T extends object>({
  title,
  subtitle,
  data,
  columns,
  emptyMessage,
  getRowId,
}: FinanceRapportDataGridProps<T>) {
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const table = useReactTable({
    data,
    columns,
    pageCount: Math.max(1, Math.ceil(data.length / pagination.pageSize)),
    getRowId: getRowId ?? ((_, index) => String(index)),
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <ModuleDataGridShell<T>
      table={table}
      recordCount={data.length}
      emptyMessage={emptyMessage}
      header={{ title, subtitle }}
    />
  );
}

type Tables = FinanceRapportsPayload['tables'];

export function FinanceRapportsBudgetGrid({ rows }: { rows: Tables['budgetLines'] }) {
  const columns = useMemo<ColumnDef<Tables['budgetLines'][number]>[]>(
    () => [
      {
        accessorKey: 'label',
        header: ({ column }) => <DataGridColumnHeader title="Libellé" column={column} />,
        cell: ({ row }) => <span className="font-medium">{row.original.label}</span>,
      },
      {
        accessorKey: 'category',
        header: ({ column }) => <DataGridColumnHeader title="Catégorie" column={column} />,
        cell: ({ row }) => (
          <Badge variant="outline" className="text-[10px] uppercase">
            {row.original.category}
          </Badge>
        ),
      },
      {
        accessorKey: 'plannedAmount',
        header: ({ column }) => <DataGridColumnHeader title="Prévu" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{fmtEuro(row.original.plannedAmount)}</span>
        ),
      },
      {
        accessorKey: 'actualAmount',
        header: ({ column }) => <DataGridColumnHeader title="Réalisé" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{fmtEuro(row.original.actualAmount)}</span>
        ),
      },
      {
        accessorKey: 'consumptionPct',
        header: ({ column }) => <DataGridColumnHeader title="Conso." column={column} />,
        cell: ({ row }) => (
          <div className="flex min-w-[120px] items-center gap-2">
            <Progress value={Math.min(row.original.consumptionPct, 100)} className="h-2 flex-1" />
            <span className="w-8 text-xs tabular-nums text-muted-foreground">
              {row.original.consumptionPct}%
            </span>
          </div>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <FinanceRapportDataGrid
      title="Suivi budget"
      subtitle="Prévu vs réalisé par ligne"
      data={rows}
      columns={columns}
      emptyMessage="Aucune ligne budget"
    />
  );
}

export function FinanceRapportsInvoicesGrid({ rows }: { rows: Tables['unpaidInvoices'] }) {
  const columns = useMemo<ColumnDef<Tables['unpaidInvoices'][number]>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
        size: 100,
      },
      {
        accessorKey: 'title',
        header: ({ column }) => <DataGridColumnHeader title="Dossier" column={column} />,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate font-medium">{row.original.title}</span>
        ),
      },
      {
        accessorKey: 'totalTtc',
        header: ({ column }) => <DataGridColumnHeader title="Total" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{fmtEuro(row.original.totalTtc)}</span>
        ),
      },
      {
        accessorKey: 'paid',
        header: ({ column }) => <DataGridColumnHeader title="Encaissé" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums text-emerald-700 dark:text-emerald-400">
            {fmtEuro(row.original.paid)}
          </span>
        ),
      },
      {
        accessorKey: 'remaining',
        header: ({ column }) => <DataGridColumnHeader title="Reste" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {row.original.remaining > 0.01 ? fmtEuro(row.original.remaining) : '—'}
          </span>
        ),
      },
      {
        accessorKey: 'collectionLabel',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant={
              row.original.collectionLabel === 'Soldée'
                ? 'success'
                : row.original.collectionLabel === 'Partielle'
                  ? 'warning'
                  : 'destructive'
            }
            appearance="light"
            className="text-[10px]"
          >
            {row.original.collectionLabel}
          </Badge>
        ),
        enableSorting: false,
      },
    ],
    [],
  );

  return (
    <FinanceRapportDataGrid
      title="Encaissement des factures"
      subtitle="Devis acceptés — soldées ou reste à percevoir"
      data={rows}
      columns={columns}
      emptyMessage="Aucun devis accepté (facture)"
    />
  );
}

export function FinanceRapportsPaymentsGrid({ rows }: { rows: Tables['recentPayments'] }) {
  const columns = useMemo<ColumnDef<Tables['recentPayments'][number]>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Réf." column={column} />,
        cell: ({ row }) => <span className="font-mono text-xs">{row.original.referenceCode}</span>,
      },
      {
        accessorKey: 'devisRef',
        header: ({ column }) => <DataGridColumnHeader title="Devis" column={column} />,
        cell: ({ row }) => (
          <span className="text-muted-foreground">{row.original.devisRef ?? '—'}</span>
        ),
      },
      {
        accessorKey: 'amount',
        header: ({ column }) => <DataGridColumnHeader title="Montant" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">{fmtEuro(row.original.amount)}</span>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge
            variant={row.original.status === 'RECEIVED' ? 'success' : 'secondary'}
            className="text-[10px]"
          >
            {PAYMENT_STATUS_FR[row.original.status] ?? row.original.status}
          </Badge>
        ),
      },
    ],
    [],
  );

  return (
    <FinanceRapportDataGrid
      title="Paiements récents"
      subtitle="12 derniers mouvements"
      data={rows}
      columns={columns}
      emptyMessage="Aucun paiement"
    />
  );
}

export function FinanceRapportsMonthlyGrid({ rows }: { rows: Tables['monthlySummary'] }) {
  const columns = useMemo<ColumnDef<Tables['monthlySummary'][number]>[]>(
    () => [
      {
        accessorKey: 'month',
        header: ({ column }) => <DataGridColumnHeader title="Mois" column={column} />,
        cell: ({ row }) => <span className="font-medium">{fmtMonth(row.original.month)}</span>,
      },
      {
        accessorKey: 'leads',
        header: ({ column }) => <DataGridColumnHeader title="Leads" column={column} />,
        cell: ({ row }) => <span className="block text-center tabular-nums">{row.original.leads}</span>,
      },
      {
        accessorKey: 'devisCreated',
        header: ({ column }) => <DataGridColumnHeader title="Devis" column={column} />,
        cell: ({ row }) => (
          <span className="block text-center tabular-nums">{row.original.devisCreated}</span>
        ),
      },
      {
        accessorKey: 'devisAccepted',
        header: ({ column }) => <DataGridColumnHeader title="Acceptés" column={column} />,
        cell: ({ row }) => (
          <span className="block text-center tabular-nums">{row.original.devisAccepted}</span>
        ),
      },
      {
        accessorKey: 'caAccepted',
        header: ({ column }) => <DataGridColumnHeader title="CA" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {fmtEuro(row.original.caAccepted)}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <FinanceRapportDataGrid
      title="Synthèse mensuelle"
      subtitle="Leads, devis et CA accepté"
      data={rows}
      columns={columns}
      emptyMessage="Pas de données"
      getRowId={(row) => row.month}
    />
  );
}
