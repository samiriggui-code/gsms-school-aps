'use client';

import { usePageToolbarMeta } from '@/components/common/translated-toolbar';
import { useTranslation } from '@/hooks/useTranslation';
import {
  workspaceColumnLabel,
  workspaceStatLabel,
} from '@/lib/workspace-labels';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, ExternalLink, Mail, RotateCcw, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Container } from '@/components/common/container';
import {
  Toolbar,
  ToolbarActions,
  ToolbarHeading,
  ToolbarTitle,
  ToolbarDescription,
} from '@/components/common/toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MODULE_LANDING_STATS_GRID_ROW, SECTION_KPI_CARD_ACCENTS } from '@/components/common/stat-card-metric-layout';
import { cn } from '@/lib/utils';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

export type GovColumn = {
  key: string;
  label: string;
  align?: 'left' | 'right';
};

export type GovStat = { key: string; label: string; subtitle?: string };

export type GovernanceHubProps = {
  workspaceKey: string;
  title?: string;
  description?: string;
  i18nParams?: Record<string, string | number>;
  apiPath: string;
  queryKey: string;
  columns: GovColumn[];
  statLabels: GovStat[];
  exportDataset?: string;
  linkKey?: string;
  /** Liens d'action supplémentaires (ex. dossier GED). */
  actionLinks?: { hrefKey: string; label: string }[];
  /** Colonnes affichées en badge (ex. pièces manquantes). */
  badgeKeys?: string[];
  /** Bouton « Relancer par e-mail » pour les candidatures avec pièces manquantes (`row.id` = candidatureId). */
  enableDocumentEmailRequest?: boolean;
  canRestore?: boolean;
};

type ListResponse = {
  stats: Record<string, number | string>;
  items: Record<string, unknown>[];
  pagination: { page: number; limit: number; total: number };
};

export function GovernanceHubPage({
  workspaceKey,
  title: titleProp,
  description: descriptionProp,
  i18nParams,
  apiPath,
  queryKey,
  columns,
  statLabels,
  exportDataset,
  linkKey,
  actionLinks,
  badgeKeys,
  enableDocumentEmailRequest,
  canRestore,
}: GovernanceHubProps) {
  const { t } = useTranslation();
  const { title: routeTitle, description: routeDescription } = usePageToolbarMeta();
  const title =
    titleProp ??
    t(`workspace.${workspaceKey}.title`, { defaultValue: routeTitle });
  const description =
    descriptionProp ??
    t(`workspace.${workspaceKey}.pageDescription`, {
      ...i18nParams,
      defaultValue: t(`workspace.${workspaceKey}.description`, {
        defaultValue: routeDescription,
      }),
    });

  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [emailRequestId, setEmailRequestId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: [queryKey, page, search] as const,
    queryFn: async (): Promise<ListResponse | undefined> => {
      const sp = new URLSearchParams({ page: String(page), limit: '15' });
      if (search.trim()) sp.set('q', search.trim());
      const res = await apiFetch(`${apiPath}?${sp}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as { error?: { message?: string } }).error?.message ?? t('crud.createFailed'));
      return unwrapSectionApiData<ListResponse>(json);
    },
  });

  const totalPages = Math.max(1, Math.ceil((data?.pagination.total ?? 0) / 15));

  async function exportCsv() {
    if (!exportDataset) return;
    const res = await apiFetch(`/api/sections/pilotage-supervision/performance/export?dataset=${exportDataset}`);
    if (!res.ok) {
      toast.error(t('governance.exportFailed'));
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `export-${exportDataset}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(t('governance.exportSuccess'));
  }

  async function restore(id: string) {
    const res = await apiFetch(`${apiPath}/${id}`, { method: 'PATCH' });
    if (!res.ok) {
      toast.error(t('governance.restoreFailed'));
      return;
    }
    toast.success(t('governance.restoreSuccess'));
    qc.invalidateQueries({ queryKey: [queryKey] });
  }

  async function requestMissingDocumentsByEmail(candidatureId: string) {
    setEmailRequestId(candidatureId);
    try {
      const listRes = await apiFetch(
        `/api/sections/securite-configuration/gouvernance-donnees/compliance/requests?candidatureId=${encodeURIComponent(candidatureId)}`,
      );
      const listJson = await listRes.json().catch(() => ({}));
      if (!listRes.ok) {
        throw new Error(
          (listJson as { error?: { message?: string } }).error?.message ??
            'Impossible de charger les pièces.',
        );
      }
      const items =
        unwrapSectionApiData<{ items: { id: string; label: string }[] }>(listJson)?.items ?? [];
      if (items.length === 0) {
        toast.info('Aucune pièce à relancer pour ce dossier.');
        return;
      }

      let created = 0;
      let emailsOk = 0;
      let emailsFailed = 0;
      for (const piece of items) {
        const res = await apiFetch(
          '/api/sections/securite-configuration/gouvernance-donnees/compliance/requests',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              dossierItemId: piece.id,
              message: `Merci de nous transmettre : ${piece.label}.`,
              sendEmail: true,
            }),
          },
        );
        const json = await res.json().catch(() => ({}));
        if (res.ok) {
          created += 1;
          const data = unwrapSectionApiData<{ emailSent?: boolean }>(json);
          if (data?.emailSent) emailsOk += 1;
          else emailsFailed += 1;
        }
      }

      if (created > 0) {
        if (emailsFailed > 0 && emailsOk === 0) {
          toast.warning(
            `${created} demande(s) enregistrée(s) dans l’app, mais e-mail non envoyé (SMTP : configurez Mailpit 127.0.0.1:1025 ou commentez SMTP_HOST).`,
          );
        } else if (emailsFailed > 0) {
          toast.warning(
            `${created} demande(s) : ${emailsOk} e-mail(s) envoyé(s), ${emailsFailed} en échec SMTP.`,
          );
        } else {
          toast.success(
            created === 1
              ? 'Demande envoyée (e-mail + notification).'
              : `${created} demandes envoyées.`,
          );
        }
        qc.invalidateQueries({ queryKey: [queryKey] });
      } else {
        toast.error('Les demandes n’ont pas pu être créées.');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la relance.');
    } finally {
      setEmailRequestId(null);
    }
  }

  const hasActions = Boolean(
    linkKey || actionLinks?.length || canRestore || enableDocumentEmailRequest,
  );

  return (
    <>
      <Container>
        <Toolbar>
          <ToolbarHeading>
            <ToolbarTitle>{title}</ToolbarTitle>
            <ToolbarDescription>{description}</ToolbarDescription>
          </ToolbarHeading>
          <ToolbarActions>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {t('crud.refresh')}
            </Button>
            {exportDataset && (
              <Button variant="outline" onClick={exportCsv}>
                <Download className="size-4" />{t('common.actions.export')}</Button>
            )}
          </ToolbarActions>
        </Toolbar>
      </Container>

      <Container className="space-y-5 lg:space-y-7.5 pb-8">
        <div className={MODULE_LANDING_STATS_GRID_ROW}>
          {statLabels.map((s, i) => {
            const accent = SECTION_KPI_CARD_ACCENTS[i % SECTION_KPI_CARD_ACCENTS.length];
            return (
              <div
                key={s.key}
                className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
              >
                <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {workspaceStatLabel(t, workspaceKey, s.key, 'label', i18nParams, s.label)}
                </p>
                <p className="mt-1 text-2xl font-semibold">{data?.stats[s.key] ?? '—'}</p>
                {s.subtitle && (
                  <p className="text-xs text-muted-foreground">
                    {workspaceStatLabel(t, workspaceKey, s.key, 'subtitle', i18nParams, s.subtitle)}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader className="flex flex-col gap-3 border-b sm:flex-row sm:items-center sm:justify-end">
            <div className="flex max-w-md flex-1 gap-2 sm:ms-auto">
              <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('datagrid.search.generic')} className="flex-1" />
              <Button variant="secondary" onClick={() => { setSearch(q); setPage(1); }}>
                <Search className="size-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead>
                  <tr className="border-b bg-muted/30 text-muted-foreground">
                    {columns.map((c) => (
                      <th key={c.key} className={cn('px-4 py-3 font-medium', c.align === 'right' ? 'text-right' : 'text-left')}>
                        {workspaceColumnLabel(t, workspaceKey, c.key, c.label)}
                      </th>
                    ))}
                    {(linkKey || actionLinks?.length || canRestore || enableDocumentEmailRequest) && (
                      <th className="px-4 py-3 text-right font-medium">{t('crud.actions')}</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">{t('crud.loading')}</td></tr>
                  ) : (data?.items.length ?? 0) === 0 ? (
                    <tr><td colSpan={columns.length + (hasActions ? 1 : 0)} className="px-4 py-8 text-center text-muted-foreground">{t('crud.empty')}</td></tr>
                  ) : (
                    data!.items.map((row) => (
                      <tr key={String(row.id)} className="border-b hover:bg-muted/20">
                        {columns.map((c) => (
                          <td key={c.key} className={cn('px-4 py-3', c.align === 'right' ? 'text-right' : 'text-left')}>
                            {badgeKeys?.includes(c.key) ? (
                              <Badge
                                variant={
                                  Number(row.missingCount ?? 0) > 0 ? 'destructive' : 'success'
                                }
                                appearance="light"
                              >
                                {String(row[c.key] ?? '—')}
                              </Badge>
                            ) : (
                              String(row[c.key] ?? '—')
                            )}
                          </td>
                        ))}
                        {(linkKey || actionLinks?.length || canRestore || enableDocumentEmailRequest) && (
                          <td className="px-4 py-3 text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              {enableDocumentEmailRequest &&
                                Number(row.missingCount ?? 0) > 0 && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    disabled={emailRequestId === String(row.id)}
                                    onClick={() => requestMissingDocumentsByEmail(String(row.id))}
                                  >
                                    <Mail className="size-3.5" />
                                    Relancer e-mail
                                  </Button>
                                )}
                              {actionLinks?.map((link) =>
                                Boolean(row[link.hrefKey]) ? (
                                  <Button key={link.hrefKey} size="sm" variant="outline" asChild>
                                    <Link href={String(row[link.hrefKey])}>{link.label}</Link>
                                  </Button>
                                ) : null,
                              )}
                              {linkKey && Boolean(row[linkKey]) && (
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={String(row[linkKey])}>
                                    {t('governance.open')}
                                    <ExternalLink className="ms-1 size-3" />
                                  </Link>
                                </Button>
                              )}
                              {canRestore && (
                                <Button size="sm" variant="outline" onClick={() => restore(String(row.id))}>
                                  <RotateCcw className="size-3" />
                                  {t('governance.restore')}
                                </Button>
                              )}
                            </div>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {(data?.pagination.total ?? 0) > 15 && (
              <div className="flex items-center justify-between border-t px-4 py-3">
                <span className="text-xs text-muted-foreground">{t('crud.page', { page, total: totalPages })}</span>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t('crud.prev')}</Button>
                  <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>{t('crud.next')}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </Container>
    </>
  );
}
