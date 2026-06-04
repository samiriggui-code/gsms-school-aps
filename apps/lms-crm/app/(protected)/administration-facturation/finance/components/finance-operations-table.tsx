'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useMemo, useState } from 'react';
import {
  ColumnDef,
  getCoreRowModel,
  getPaginationRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import Link from 'next/link';
import { Eye, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { ModuleLandingDataGridShell } from '@/components/common/module-landing-datagrid-shell';

type FinanceItemStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'DRAFT';

interface FinanceItem {
  id: string;
  type: 'Devis' | 'Facture' | 'Paiement';
  reference: string;
  client: string;
  amount: number;
  dueDate: string;
  status: FinanceItemStatus;
  href: string;
}

const FINANCE_ITEMS: FinanceItem[] = [
  {
    id: 'fin-001',
    type: 'Devis',
    reference: 'DV-2026-041',
    client: 'Ecole Centrale',
    amount: 4200,
    dueDate: '2026-04-30',
    status: 'PENDING',
    href: '/administration-facturation/finance/devis',
  },
  {
    id: 'fin-002',
    type: 'Facture',
    reference: 'FAC-2026-118',
    client: 'Institut Horizon',
    amount: 7850,
    dueDate: '2026-04-22',
    status: 'OVERDUE',
    href: '/administration-facturation/finance/factures',
  },
  {
    id: 'fin-003',
    type: 'Paiement',
    reference: 'PAY-2026-077',
    client: 'Campus Pro',
    amount: 3200,
    dueDate: '2026-04-25',
    status: 'PAID',
    href: '/administration-facturation/finance/paiements',
  },
  {
    id: 'fin-004',
    type: 'Facture',
    reference: 'FAC-2026-119',
    client: 'Academie Nova',
    amount: 1990,
    dueDate: '2026-05-02',
    status: 'PENDING',
    href: '/administration-facturation/finance/factures',
  },
  {
    id: 'fin-005',
    type: 'Devis',
    reference: 'DV-2026-042',
    client: 'Pole Formation Sud',
    amount: 5600,
    dueDate: '2026-05-05',
    status: 'DRAFT',
    href: '/administration-facturation/finance/devis',
  },
];

function getStatusColor(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'OVERDUE':
      return 'destructive';
    case 'DRAFT':
      return 'secondary';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string) {
  switch (status?.toUpperCase()) {
    case 'PAID':
      return 'PAYÉ';
    case 'PENDING':
      return 'EN ATTENTE';
    case 'OVERDUE':
      return 'EN RETARD';
    case 'DRAFT':
      return 'BROUILLON';
    default:
      return status || 'INCONNU';
  }
}

export function FinanceOperationsTable() {
  const { t } = useTranslation();
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const columns = useMemo<ColumnDef<FinanceItem>[]>(
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
        accessorKey: 'type',
        header: ({ column }) => <DataGridColumnHeader title="Type" column={column} />,
        cell: ({ row }) => (
          <Badge appearance="light" className="font-bold uppercase text-2xs">
            {row.original.type}
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
              Échéance {format(new Date(row.original.dueDate), 'dd/MM/yyyy', { locale: fr })}
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
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title={t('datagrid.columns.status')} column={column} />,
        cell: ({ row }) => (
          <Badge
            appearance="light"
            className="font-bold uppercase text-2xs"
            color={getStatusColor(row.original.status) as 'success'}
          >
            {getStatusLabel(row.original.status)}
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
            <Button variant="ghost" size="icon" className="size-8 hover:bg-secondary">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        ),
        size: 90,
        enableSorting: false,
      },
    ],
    [],
  );

  const table = useReactTable({
    data: FINANCE_ITEMS,
    columns,
    pageCount: Math.max(1, Math.ceil(FINANCE_ITEMS.length / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <ModuleLandingDataGridShell
      title="Flux financier récent"
      viewAllHref="/administration-facturation/finance/devis"
      table={table}
      recordCount={FINANCE_ITEMS.length}
    />
  );
}
