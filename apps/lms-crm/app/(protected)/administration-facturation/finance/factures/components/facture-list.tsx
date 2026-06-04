'use client';

import { useTranslation } from '@/hooks/useTranslation';
import { useEffect, useState, type ReactNode } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, RefreshCw, Search } from 'lucide-react';
import { formatDateTime } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { financeFactureListQueryKey } from '../constants/query-keys';
import { useFinanceFactureQuery } from '../hooks/use-finance-facture-query';
import { FactureDetailSheet, type FactureDetailInitialTab } from './facture-detail-sheet';

interface FactureListProps {
  leaderSlot?: ReactNode;
}

export function FactureList({ leaderSlot }: FactureListProps) {
  const { t } = useTranslation();
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const [isSyncing, setIsSyncing] = useState(false);
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [selectedFactureId, setSelectedFactureId] = useState<string | null>(null);
  const [sheetInitialTab, setSheetInitialTab] = useState<FactureDetailInitialTab>('overview');
  const limit = 10;

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
    page,
    limit,
    q,
    sort: 'updatedAt',
    dir: 'desc',
  });

  const handleSync = () => {
    setIsSyncing(true);
    queryClient.invalidateQueries({ queryKey: [...financeFactureListQueryKey] }).then(() => {
      setTimeout(() => setIsSyncing(false), 600);
    });
  };

  const stripFactureIdFromUrl = () => {
    const next = new URLSearchParams(sp.toString());
    if (!next.has('factureId')) return;
    next.delete('factureId');
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  };

  const openFactureSheet = (id: string, tab: FactureDetailInitialTab = 'overview') => {
    setSelectedFactureId(id);
    setSheetInitialTab(tab);
    const next = new URLSearchParams(sp.toString());
    next.set('factureId', id);
    router.replace(`${pathname}?${next.toString()}`);
  };

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / limit));
  const money = (value: number, currency: string) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: currency || 'EUR' }).format(value);

  return (
    <Card className="border-border shadow-none mb-5">
      <CardHeader className="py-3">
        <div className="flex flex-col gap-3 w-full">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 w-full">
            <div>
              <h3 className="text-base font-semibold text-foreground">{t('facture.listTitle')}</h3>
              <p className="text-xs text-muted-foreground">{t('facture.listDescription')}</p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div className="relative w-full sm:w-80">
                <Search className="absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('facture.searchPlaceholder')}
                  value={q}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setPage(1);
                  }}
                  className="h-10 ps-9"
                />
              </div>
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
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="px-3 py-2 font-medium">{t('finance.columns.referenceProposal')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.company')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.formation')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.amountTtc')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.status')}</th>
                <th className="px-3 py-2 font-medium">{t('finance.columns.updatedAt')}</th>
                <th className="px-3 py-2 font-medium text-end">{t('finance.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((row) => (
                <tr key={row.id} className="border-b">
                  <td className="px-3 py-3">
                    <div className="font-medium">{row.referenceCode}</div>
                    <div className="text-xs text-muted-foreground">{row.title}</div>
                  </td>
                  <td className="px-3 py-3">
                    {row.clientCompany ? (
                      <>
                        <div className="font-medium">{row.clientCompany}</div>
                        {row.lead ? (
                          <div className="text-xs text-muted-foreground">
                            {row.lead.firstName} {row.lead.lastName}
                            {row.lead.email ? ` · ${row.lead.email}` : null}
                          </div>
                        ) : null}
                      </>
                    ) : row.lead ? (
                      <>
                        <div className="font-medium text-muted-foreground">{t('finance.companyNotSet')}</div>
                        <div className="text-xs text-muted-foreground">
                          {row.lead.firstName} {row.lead.lastName}
                          {row.lead.email ? ` · ${row.lead.email}` : null}
                        </div>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">{row.formation?.name ?? t('finance.notLinkedFormation')}</td>
                  <td className="px-3 py-3 font-medium">{money(row.totalTtc, row.currency)}</td>
                  <td className="px-3 py-3">
                    <Badge variant="success" appearance="light">
                      {t(`devis.status.${row.status}`, { defaultValue: row.status })}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {formatDateTime(row.updatedAt)}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-end gap-0.5 pe-1">
                      <Button
                        type="button"
                        variant="ghost"
                        mode="icon"
                        className="size-8"
                        title={t('facture.openSheetTitle')}
                        aria-label={t('facture.openSheetAria')}
                        onClick={() => openFactureSheet(row.id, 'overview')}
                      >
                        <Eye className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && (data?.items.length ?? 0) === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-sm text-muted-foreground">
                    {t('facture.empty')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {t('facture.pageInfo', {
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
    </Card>
  );
}
