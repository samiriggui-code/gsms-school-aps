'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Eye, Pencil, RefreshCw, Search, Trash2 } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
import { useFinanceDevisQuery } from '../hooks/use-finance-devis-query';
import { DevisDetailSheet, type DevisDetailInitialTab } from './devis-detail-sheet';
import { apiFetch } from '@/lib/api';
import { toast } from 'sonner';
import { financeDevisListQueryKey } from '../constants/query-keys';

interface DevisListProps {
  leaderSlot?: ReactNode;
}

export function DevisList({ leaderSlot }: DevisListProps) {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [status, setStatus] = useState<string>('all');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedDevisId, setSelectedDevisId] = useState<string | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<DevisDetailInitialTab>('overview');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; referenceCode: string } | null>(null);
  const limit = 10;

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
    page,
    limit,
    q,
    status,
    sort: 'updatedAt',
    dir: 'desc',
  });

  const handleSync = () => {
    setIsSyncing(true);
    queryClient.invalidateQueries({ queryKey: [...financeDevisListQueryKey] }).then(() => {
      setTimeout(() => setIsSyncing(false), 600);
    });
  };

  const stripDevisIdFromUrl = () => {
    const next = new URLSearchParams(sp.toString());
    if (!next.has('devisId')) return;
    next.delete('devisId');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const openDevisSheet = (id: string, tab: DevisDetailInitialTab = 'overview') => {
    setSelectedDevisId(id);
    setSheetInitialTab(tab);
    const next = new URLSearchParams(sp.toString());
    next.set('devisId', id);
    router.replace(`${pathname}?${next.toString()}`);
  };

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

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / limit));
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);

  return (
    <Card className="border-border shadow-none mb-5">
      <CardHeader className="py-3">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('devis.listTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('devis.listDescription')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('datagrid.search.quote')}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 ps-9"
                />
              </div>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value);
                  setPage(1);
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
                className="h-10 gap-2 border-dashed hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all duration-300 shadow-sm"
                onClick={handleSync}
                disabled={isSyncing}
              >
                <RefreshCw className={cn('size-4', isSyncing && 'animate-spin')} />
                <span className="font-bold uppercase tracking-wider text-[11px]">{t('datagrid.sync')}</span>
              </Button>
            </div>
          </div>
          {leaderSlot}
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
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">{t('finance.columns.reference')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.company')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.formation')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.amountTtc')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.status')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.updatedAt')}</th>
                <th className="px-3 py-2 font-medium text-end">{t('finance.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((devis) => (
                <tr key={devis.id} className="border-b">
                  <td className="px-3 py-3">
                    <div className="font-medium">{devis.referenceCode}</div>
                    <div className="text-xs text-muted-foreground">{devis.title}</div>
                  </td>
                  <td className="px-3 py-3">
                    {devis.clientCompany ? (
                      <>
                        <div className="font-medium">{devis.clientCompany}</div>
                        {devis.lead ? (
                          <div className="text-xs text-muted-foreground">
                            {devis.lead.firstName} {devis.lead.lastName}
                            {devis.lead.email ? ` · ${devis.lead.email}` : null}
                          </div>
                        ) : null}
                      </>
                    ) : devis.lead ? (
                      <>
                        <div className="font-medium text-muted-foreground">{t('finance.companyNotSet')}</div>
                        <div className="text-xs text-muted-foreground">
                          {devis.lead.firstName} {devis.lead.lastName}
                          {devis.lead.email ? ` · ${devis.lead.email}` : null}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{devis.formation?.name ?? t('finance.notLinkedFormation')}</td>
                  <td className="px-3 py-3 font-medium">{money(devis.totalTtc, devis.currency)}</td>
                  <td className="px-3 py-3">
                    <Badge variant={devis.status === 'SENT' ? 'warning' : 'secondary'}>
                      {t(`devis.status.${devis.status}`, { defaultValue: devis.status })}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(devis.updatedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-0.5 pe-1">
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        className="size-8"
                        title={t('devis.viewOverviewTitle')}
                        aria-label={t('devis.viewAria')}
                        onClick={() => openDevisSheet(devis.id, 'overview')}
                      >
                        <Eye className="size-4 text-muted-foreground" />
                      </Button>
                      {devis.status === 'DRAFT' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          mode="icon"
                          className="size-8"
                          title={t('devis.editDraftTitle')}
                          aria-label={t('devis.editAria')}
                          onClick={() => openDevisSheet(devis.id, 'edit')}
                        >
                          <Pencil className="size-4 text-muted-foreground" />
                        </Button>
                      ) : null}
                      {devis.status === 'DRAFT' ? (
                        <Button
                          type="button"
                          variant="ghost"
                          mode="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          title={t('devis.deleteDraftTooltip')}
                          aria-label={t('devis.deleteDraftAria')}
                          disabled={deleteMutation.isPending}
                          onClick={() =>
                            setDeleteTarget({ id: devis.id, referenceCode: devis.referenceCode })
                          }
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('devis.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('devis.pageInfo', {
              page,
              total: totalPages,
              count: data?.pagination.total ?? 0,
            })}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || isFetching}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('crud.previous')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || isFetching}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('crud.nextFull')}
            </Button>
          </div>
        </div>
      </CardContent>

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
    </Card>
  );
}
