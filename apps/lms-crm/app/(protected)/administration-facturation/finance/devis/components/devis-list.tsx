'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  PaginationState,
  useReactTable,
} from '@tanstack/react-table';
import { RefreshCw, Search, MessageCircle, Trash2, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import {
  createModuleLandingPagination,
} from '@/app/(protected)/securite-configuration/components/datagrid-standards';
import { FinanceModuleDataGrid } from '../../components/finance-module-datagrid';
import { useFinanceDevisQuery, type FinanceDevisRow } from '../hooks/use-finance-devis-query';
import { DevisDetailSheet, type DevisDetailInitialTab } from './devis-detail-sheet';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { financeDevisListQueryKey } from '../constants/query-keys';
import { useDatagridSync } from '@/hooks/use-datagrid-sync';
import { devisStatusBadgeVariant } from '../lib/devis-workflow';
import { DEVIS_STATUS_LABEL_FR } from '../constants/status-labels';

interface DevisListProps {
  leaderSlot?: React.ReactNode;
}

function money(value: number, currency: string) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);
}

export function DevisList(_props: DevisListProps = {}) {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [pagination, setPagination] = useState<PaginationState>(createModuleLandingPagination);

  const { isSyncing, sync: handleSync } = useDatagridSync({
    preset: 'finance',
    queryKeys: [[...financeDevisListQueryKey]],
  });
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<DevisDetailInitialTab>('overview');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; referenceCode: string } | null>(null);

  const leadIdFromUrl = (sp.get('leadId') ?? '').trim() || null;
  const devisIdFromUrl = (sp.get('devisId') ?? '').trim() || null;

  useEffect(() => {
    if (devisIdFromUrl) {
      setSelectedDevisId(devisIdFromUrl);
      setSheetInitialTab('overview');
    }
  }, [devisIdFromUrl]);

  const { data, isLoading, isFetching } = useFinanceDevisQuery({
    leadId: leadIdFromUrl,
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    q,
    status,
    sort: 'updatedAt',
    dir: 'desc',
  });

  const stripDevisIdFromUrl = () => {
    const next = new URLSearchParams(sp.toString());
    if (!next.has('devisId')) return;
    next.delete('devisId');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const openDevisSheet = useCallback(
    (id: string, tab: DevisDetailInitialTab = 'overview') => {
      setSelectedDevisId(id);
      setSheetInitialTab(tab);
      const next = new URLSearchParams(sp.toString());
      next.set('devisId', id);
      router.replace(`${pathname}?${next.toString()}`);
    },
    [pathname, router, sp],
  );

  const openDevisFromRow = useCallback(
    (devis: FinanceDevisRow) => {
      openDevisSheet(
        devis.id,
        devis.status === 'DRAFT'
          ? 'edition'
          : (devis.plaquetteMessageCount ?? 0) > 0
            ? 'suivi'
            : 'overview',
      );
    },
    [openDevisSheet],
  );

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch(`/api/sections/administration-facturation/finance/devis/${id}`, {
        method: 'DELETE',
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((json as { error?: { message?: string } }).error?.message ?? 'Suppression impossible.');
      }
    },
    onSuccess: async (_, deletedId) => {
      toast.success(t('devis.deletedSuccess'));
      if (selectedDevisId === deletedId) {
        setSelectedDevisId(null);
        setSheetInitialTab('overview');
        stripDevisIdFromUrl();
      }
      setDeleteTarget(null);
      await queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const columns = useMemo<ColumnDef<FinanceDevisRow>[]>(
    () => [
      {
        accessorKey: 'referenceCode',
        header: ({ column }) => <DataGridColumnHeader title="Référence" column={column} />,
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
        header: ({ column }) => <DataGridColumnHeader title="Client" column={column} />,
        cell: ({ row }) => {
          const devis = row.original;
          if (devis.clientCompany) {
            return (
              <>
                <div className="font-medium">{devis.clientCompany}</div>
                {devis.lead ? (
                  <div className="text-xs text-muted-foreground">
                    {devis.lead.firstName} {devis.lead.lastName}
                    {devis.lead.email ? ` · ${devis.lead.email}` : null}
                  </div>
                ) : null}
              </>
            );
          }
          if (devis.lead) {
            return (
              <>
                <div className="font-medium text-muted-foreground">{t('finance.companyNotSet')}</div>
                <div className="text-xs text-muted-foreground">
                  {devis.lead.firstName} {devis.lead.lastName}
                  {devis.lead.email ? ` · ${devis.lead.email}` : null}
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
        header: ({ column }) => <DataGridColumnHeader title="Formation" column={column} />,
        cell: ({ row }) => row.original.formation?.name ?? t('finance.notLinkedFormation'),
        size: 160,
      },
      {
        accessorKey: 'totalTtc',
        header: ({ column }) => <DataGridColumnHeader title="Montant TTC" column={column} />,
        cell: ({ row }) => (
          <span className="block text-right font-medium tabular-nums">
            {money(row.original.totalTtc, row.original.currency)}
          </span>
        ),
        size: 120,
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataGridColumnHeader title="Statut" column={column} />,
        cell: ({ row }) => (
          <Badge variant={devisStatusBadgeVariant(row.original.status)} appearance="light" size="sm">
            {DEVIS_STATUS_LABEL_FR[row.original.status] ?? row.original.status}
          </Badge>
        ),
        size: 120,
      },
      {
        id: 'messages',
        header: ({ column }) => <DataGridColumnHeader title="Échanges" column={column} />,
        cell: ({ row }) =>
          (row.original.plaquetteMessageCount ?? 0) > 0 ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
              <MessageCircle className="size-3.5" />
              {row.original.plaquetteMessageCount}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground">—</span>
          ),
        size: 90,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Actions</span>,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1 pe-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="button"
              variant="ghost"
              mode="icon"
              className="size-8"
              title="Ouvrir la fiche"
              onClick={() => openDevisFromRow(row.original)}
            >
              <Eye className="size-4 text-muted-foreground" />
            </Button>
            {row.original.status === 'DRAFT' ? (
              <Button
                type="button"
                variant="ghost"
                mode="icon"
                className="size-8 text-destructive hover:text-destructive"
                title="Supprimer le brouillon"
                disabled={deleteMutation.isPending}
                onClick={() =>
                  setDeleteTarget({ id: row.original.id, referenceCode: row.original.referenceCode })
                }
              >
                <Trash2 className="size-4" />
              </Button>
            ) : null}
          </div>
        ),
        size: 88,
        minSize: 88,
        maxSize: 88,
        enableSorting: false,
      },
    ],
    [deleteMutation.isPending, openDevisFromRow, t],
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
        <CardHeader className="border-b border-border/60 py-3">
          <div className="flex w-full flex-col gap-3">
            <div className="flex w-full flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Tous les devis</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Cliquez sur une ligne pour ouvrir la fiche. Les brouillons sont modifiables ; les envoyés
                  attendent le client.
                </p>
              </div>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t('datagrid.search.quote')}
                    value={q}
                    onChange={(e) => {
                      setQ(e.target.value);
                      setPagination((p) => ({ ...p, pageIndex: 0 }));
                    }}
                    className="h-10 ps-9"
                  />
                </div>
                <Select
                  value={status}
                  onValueChange={(value) => {
                    setStatus(value);
                    setPagination((p) => ({ ...p, pageIndex: 0 }));
                  }}
                >
                  <SelectTrigger className="h-10 w-full sm:w-44">
                    <SelectValue placeholder={t('devis.statusFilterPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('devis.allStatuses')}</SelectItem>
                    {(['DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED'] as const).map((key) => (
                      <SelectItem key={key} value={key}>
                        {t(`devis.status.${key}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
            {leadIdFromUrl ? (
              <p className="text-xs text-muted-foreground">
                {t('devis.leadFilterActive')}{' '}
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
                  {t('devis.clearLeadFilter')}
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
        emptyMessage={t('devis.empty')}
        onRowClick={openDevisFromRow}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => {
          if (!o) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('devis.deleteDraftTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('devis.deleteDraftDescription', { reference: deleteTarget?.referenceCode ?? '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button type="button" variant="outline" disabled={deleteMutation.isPending}>
                {t('common.buttons.cancel')}
              </Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button
                type="button"
                variant="destructive"
                disabled={deleteMutation.isPending || !deleteTarget}
                onClick={(e) => {
                  e.preventDefault();
                  if (!deleteTarget) return;
                  deleteMutation.mutate(deleteTarget.id);
                }}
              >
                {deleteMutation.isPending ? t('crud.loading') : t('common.buttons.delete')}
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DevisDetailSheet
        devisId={selectedDevisId}
        open={selectedDevisId != null}
        initialTab={sheetInitialTab}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setSelectedDevisId(null);
            setSheetInitialTab('overview');
            stripDevisIdFromUrl();
          }
        }}
      />
    </>
  );
}
