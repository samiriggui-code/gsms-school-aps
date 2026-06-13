'use client';

import { useTranslation } from '@/hooks/useTranslation';
import type { ComponentType } from 'react';
import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  PaginationState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardFooter, CardTable, CardHeader, CardTitle } from '@/components/ui/card';
import { DataGrid } from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import { DataGridTable } from '@/components/ui/data-grid-table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Download, Eye } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';

type InvoiceItem = {
  id: string;
  invoiceNumber: string;
  amount?: number;
  total?: number;
  currency?: string | null;
  status?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  customerName?: string | null;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
};

const renderActionLink = (
  url: string | null | undefined,
  {
    label,
    icon: Icon,
    download,
  }: { label: string; icon: ComponentType<{ className?: string }>; download?: boolean },
) => {
  if (!url) {
    return (
      <Button variant="ghost" mode="icon" size="sm" disabled aria-label={label}>
        <Icon className="size-4" />
      </Button>
    );
  }

  return (
    <Button asChild variant="ghost" mode="icon" size="sm" aria-label={label}>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        {...(download ? { download: '' } : {})}
      >
        <Icon className="size-4" />
      </a>
    </Button>
  );
};

export function ProfilDetailsInvoices({ invoices }: { invoices?: InvoiceItem[] }) {
  const { t } = useTranslation();
  const items = invoices || [];

  const formatCurrency = (amount?: number, currency?: string | null) => {
    try {
      return new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: currency || 'EUR',
      }).format(amount ?? 0);
    } catch {
      return `${(amount ?? 0).toFixed(2)} ${currency || 'EUR'}`;
    }
  };

  const getStatusMeta = (status?: string | null) => {
    const normalized = (status || '').toString().toLowerCase();
    const isPaid = ['paid', 'succeeded'].includes(normalized);
    const isOpen = ['open', 'pending', 'unpaid', 'past_due', 'draft'].includes(normalized);

    if (isPaid) {
      return { label: 'Payee', variant: 'success' as const };
    }
    if (isOpen) {
      return { label: 'En attente', variant: 'warning' as const };
    }
    return { label: status || 'N/A', variant: 'secondary' as const };
  };

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  });
  const [sorting, setSorting] = useState<SortingState>([]);

  const columns = useMemo<ColumnDef<InvoiceItem>[]>(
    () => [
      {
        id: 'invoice',
        accessorFn: (row) => row.invoiceNumber,
        header: ({ column }) => (
          <DataGridColumnHeader title="Facture" column={column} />
        ),
        cell: (info) => (
          <span className="text-2sm font-medium text-primary">
            {info.row.original.invoiceNumber || 'Facture'}
          </span>
        ),
        size: 140,
      },
      {
        id: 'date',
        accessorFn: (row) => row.invoiceDate,
        header: ({ column }) => (
          <DataGridColumnHeader title="Date" column={column} />
        ),
        cell: (info) =>
          info.row.original.invoiceDate
            ? formatDateTime(new Date(info.row.original.invoiceDate))
            : '-',
        size: 160,
      },
      {
        id: 'dueDate',
        accessorFn: (row) => row.dueDate || '',
        header: ({ column }) => (
          <DataGridColumnHeader title="Echeance" column={column} />
        ),
        cell: (info) =>
          info.row.original.dueDate
            ? formatDateTime(new Date(info.row.original.dueDate))
            : '-',
        size: 160,
      },
      {
        id: 'total',
        accessorFn: (row) => row.total ?? row.amount ?? 0,
        header: ({ column }) => (
          <DataGridColumnHeader title="Total" column={column} />
        ),
        cell: (info) => (
          <span className="font-semibold text-foreground">
            {formatCurrency(
              info.row.original.total ?? info.row.original.amount ?? 0,
              info.row.original.currency,
            )}
          </span>
        ),
        size: 120,
      },
      {
        id: 'status',
        accessorFn: (row) => row.status || '',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />
        ),
        cell: (info) => {
          const statusMeta = getStatusMeta(info.row.original.status);
          return (
            <Badge variant={statusMeta.variant} appearance="light" className="uppercase text-[10px] font-semibold">
              {statusMeta.label}
            </Badge>
          );
        },
        size: 120,
      },
      {
        id: 'actions',
        header: ({ column }) => (
          <DataGridColumnHeader title="" column={column} />
        ),
        enableSorting: false,
        cell: (info) => (
          <div className="flex items-center justify-end gap-1">
            {renderActionLink(info.row.original.hostedInvoiceUrl, { label: 'Consulter', icon: Eye })}
            {renderActionLink(info.row.original.invoicePdf, { label: 'Telecharger', icon: Download, download: true })}
          </div>
        ),
        size: 90,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: items,
    columns,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <DataGrid
      table={table}
      recordCount={items.length}
      emptyMessage="Aucune facture liee."
      tableLayout={{
        columnsPinnable: true,
        columnsMovable: true,
        columnsVisibility: true,
        cellBorder: true,
      }}
      tableClassNames={{ base: 'min-w-[950px]' }}
    >
      <Card className="border border-border/60 shadow-none">
        <CardHeader className="px-5 py-4 border-b border-border/60">
          <CardTitle className="text-sm font-semibold">Dernieres factures</CardTitle>
        </CardHeader>
        <CardTable>
          <ScrollArea className="w-full min-w-0">
            <DataGridTable />
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardTable>
        {items.length > 5 && (
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        )}
      </Card>
    </DataGrid>
  );
}
