'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { Eye, RefreshCw, Search, Banknote, Printer, Pencil, Send } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { createModuleLandingPagination } from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { FinanceModuleDataGrid } from '../../components/finance-module-datagrid';
import { useFinanceFactureQuery } from '../hooks/use-finance-facture-query';
import { FactureDetailSheet, type FactureDetailInitialTab } from './facture-detail-sheet';
import { FactureRecordPaymentDialog } from './facture-record-payment-dialog';
import { INVOICE_PAYMENT_STATUS_LABEL_FR, invoicePaymentBadgeVariant } from '../constants/status-labels';
import type { FinanceFactureRow } from '../hooks/use-finance-facture-query';
import { toast } from 'sonner';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { financeFactureListQueryKey } from '../constants/query-keys';

interface FactureListProps {
  leaderSlot?: ReactNode;
}

function clientEmail(row: FinanceFactureRow): string | null {
  return row.lead?.email?.trim() || null;
}

function resendFactureByMail(row: FinanceFactureRow) {
  const email = clientEmail(row);
  if (!email) {
    toast.error('Aucun e-mail client pour renvoyer la facture.');
    return;
  }
  const pdfUrl = `${window.location.origin}/api/sections/administration-facturation/finance/factures/${row.id}/pdf?format=pdf`;
  const subject = encodeURIComponent(`Facture ${row.referenceCode}`);
  const body = encodeURIComponent(
    `Bonjour,\n\nVeuillez trouver votre facture ${row.referenceCode} (${row.title}) :\n${pdfUrl}\n\nCordialement`,
  );
  window.location.href = `mailto:${encodeURIComponent(email)}?subject=${subject}&body=${body}`;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

export function FactureList({ leaderSlot }: FactureListProps) {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'finance',
    queryKeys: [[...financeFactureListQueryKey]],
  });
  const [q, setQ] = useState('');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);
  const [selectedFactureId, setSelectedFactureId] = useState<string | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<FactureDetailInitialTab>('overview');
  const [payRow, setPayRow] = useState<FinanceFactureRow | null>(null);

  const leadIdFromUrl = (sp.get('leadId') ?? '').trim() || null;
  const factureIdFromUrl = (sp.get('factureId') ?? '').trim() || null;

  useEffect(() => {
    if (factureIdFromUrl) {
      setSelectedFactureId(factureIdFromUrl);
      setSheetInitialTab('overview');
    }
  }, [factureIdFromUrl]);

  const { data, isLoading, isFetching } = useFinanceFactureQuery({
    leadId: leadIdFromUrl,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    q,
    sort: 'updatedAt',
    dir: 'desc',
  });

  const stripFactureIdFromUrl = () => {
    const next = new URLSearchParams(sp.toString());
    if (!next.has('factureId')) return;
    next.delete('factureId');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const openFactureSheet = useCallback(
    (id: string, tab: FactureDetailInitialTab = 'overview') => {
      setSelectedFactureId(id);
      setSheetInitialTab(tab);
      const next = new URLSearchParams(sp.toString());
      next.set('factureId', id);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, sp],
  );

  const columns = useMemo<ColumnDef<FinanceFactureRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => (
          <DataGridColumnHeader title={t('finance.columns.referenceProposal')} column={column} />
        ),
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.referenceCode}</div>
            <div className="text-xs text-muted-foreground">{row.original.title}</div>
          </div>
        ),
        size: 140,
      },
      {
        id: 'client',
        header: ({ column }) => <DataGridColumnHeader title={t('finance.columns.company')} column={column} />,
        cell: ({ row }) => {
          const r = row.original;
          if (r.clientCompany) {
            return (
              <>
                <div className="font-medium">{r.clientCompany}</div>
                {r.lead ? (
                  <div className="text-xs text-muted-foreground">
                    {r.lead.firstName} {r.lead.lastName}
                    {r.lead.email ? ` · ${r.lead.email}` : null}
                  </div>
                ) : null}
              </>
            );
          }
          if (r.lead) {
            return (
              <>
                <div className="font-medium text-muted-foreground">{t('finance.companyNotSet')}</div>
                <div className="text-xs text-muted-foreground">
                  {r.lead.firstName} {r.lead.lastName}
                  {r.lead.email ? ` · ${r.lead.email}` : null}
                </div>
              </>
            );
          }
          return <span className="text-muted-foreground">—</span>;
        },
        size: 200,
      },
      {
        id: 'formation',
        header: ({ column }) => <DataGridColumnHeader title={t('finance.columns.formation')} column={column} />,
        cell: ({ row }) => row.original.formation?.name ?? t('finance.notLinkedFormation'),
        size: 160,
      },
      {
        accessorKey: 'totalTtc',
        header: ({ column }) => <DataGridColumnHeader title={t('finance.columns.amountTtc')} column={column} />,
        cell: ({ row }) => (
          <span className="block font-medium tabular-nums">{money(row.original.totalTtc, row.original.currency)}</span>
        ),
        size: 120,
      },
      {
        id: 'payment',
        header: ({ column }) => <DataGridColumnHeader title="Paiement" column={column} />,
        cell: ({ row }) => (
          <div>
            <Badge
              variant={invoicePaymentBadgeVariant(row.original.paymentSummary?.invoicePaymentStatus ?? 'UNPAID')}
              appearance="light"
            >
              {INVOICE_PAYMENT_STATUS_LABEL_FR[row.original.paymentSummary?.invoicePaymentStatus ?? 'UNPAID'] ??
                'À encaisser'}
            </Badge>
            {row.original.paymentSummary && row.original.paymentSummary.balanceDue > 0 ? (
              <div className="mt-1 text-xs tabular-nums text-muted-foreground">
                Reste {money(row.original.paymentSummary.balanceDue, row.original.currency)}
              </div>
            ) : null}
          </div>
        ),
        size: 130,
        enableSorting: false,
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataGridColumnHeader title={t('finance.columns.updatedAt')} column={column} />,
        cell: ({ row }) => (
          <span className="whitespace-nowrap text-xs text-muted-foreground">
            {formatDateTime(row.original.updatedAt)}
          </span>
        ),
        size: 140,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('finance.columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-0.5 pe-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Ouvrir la fiche"
              onClick={() => openFactureSheet(row.original.id, 'overview')}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Enregistrer un paiement"
              onClick={() => setPayRow(row.original)}
            >
              <Banknote className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Télécharger PDF"
              onClick={() =>
                window.open(
                  `/api/sections/administration-facturation/finance/factures/${row.original.id}/pdf?format=pdf`,
                  '_blank',
                  'noopener,noreferrer',
                )
              }
            >
              <Printer className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Modifier notes"
              onClick={() => openFactureSheet(row.original.id, 'notes')}
            >
              <Pencil className="size-4 text-muted-foreground" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Renvoyer au client"
              onClick={() => resendFactureByMail(row.original)}
            >
              <Send className="size-4 text-muted-foreground" />
            </Button>
          </div>
        ),
        size: 200,
        minSize: 200,
        maxSize: 200,
        enableSorting: false,
      },
    ],
    [openFactureSheet, t],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    pageCount: Math.max(1, Math.ceil((data?.pagination.total ?? 0) / pagination.pageSize)),
    getRowId: (row) => row.id,
    state: { pagination },
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <>
      <Card className="mb-5 border-border shadow-none">
        <CardHeader className="py-3">
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">{t('facture.listTitle')}</h3>
                <p className="text-xs text-muted-foreground">{t('facture.listDescription')}</p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('facture.searchPlaceholder')}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                    className="h-10 ps-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 gap-2 border-dashed shadow-sm transition-all duration-300 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
                  onClick={handleSync}
                  disabled={isSyncing || isFetching}
                >
                  <RefreshCw className={cn('size-4', (isSyncing || isFetching) && 'animate-spin')} />
                  <span className="text-[11px] font-bold uppercase tracking-wider">{t('datagrid.sync')}</span>
                </Button>
              </div>
            </div>
            {leaderSlot}
            {leadIdFromUrl ? (
              <p className="text-xs text-muted-foreground">
                {t('facture.leadFilterActive')}{' '}
                <Button
                  type="button"
                  variant="ghost"
                  className="h-auto p-0 text-xs text-primary underline-offset-4 hover:underline"
                  onClick={() => {
                    const next = new URLSearchParams(sp.toString());
                    next.delete('leadId');
                    const qs = next.toString();
                    router.replace(qs ? `${pathname}?${qs}` : pathname);
                  }}
                >
                  {t('facture.clearLeadFilter')}
                </Button>
              </p>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <FinanceModuleDataGrid
        table={table}
        recordCount={data?.pagination.total ?? 0}
        isLoading={isLoading}
        emptyMessage={t('facture.empty')}
        onRowClick={(row) => openFactureSheet(row.id, 'overview')}
      />

      <FactureRecordPaymentDialog
        open={payRow != null}
        onOpenChange={(open) => {
          if (!open) setPayRow(null);
        }}
        factureId={payRow?.id ?? ''}
        referenceCode={payRow?.referenceCode ?? ''}
        defaultAmount={payRow?.paymentSummary?.balanceDue ?? payRow?.totalTtc ?? 0}
        currency={payRow?.currency ?? 'EUR'}
      />

      <FactureDetailSheet
        factureId={selectedFactureId}
        open={selectedFactureId != null}
        initialTab={sheetInitialTab}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedFactureId(null);
            setSheetInitialTab('overview');
            stripFactureIdFromUrl();
          }
        }}
      />
    </>
  );
}
