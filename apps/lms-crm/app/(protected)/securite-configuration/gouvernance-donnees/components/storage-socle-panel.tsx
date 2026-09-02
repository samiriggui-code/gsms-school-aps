'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  ChevronDown,
  Cloud,
  FolderTree,
  HardDrive,
  LoaderCircleIcon,
  Server,
} from 'lucide-react';
import { toast } from 'sonner';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@repo/ui/collapsible';
import { Progress } from '@repo/ui/progress';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';

type SocleResponse = {
  mode: 'local' | 'remote';
  bucket: string;
  publicBaseUrl: string;
  monitoringUrl: string | null;
  minioConsoleUrl: string | null;
  socle: { readyCount: number; totalCount: number };
};

export function StorageSoclePanel() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['gouvernance-storage-socle'],
    queryFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/storage/socle',
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ??
            t('governance.storageSocle.loadError'),
        );
      }
      return unwrapSectionApiData<SocleResponse>(json);
    },
    staleTime: 30_000,
  });

  const ensureMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        '/api/sections/securite-configuration/gouvernance-donnees/storage/socle',
        { method: 'POST' },
      );
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (json as { error?: { message?: string } }).error?.message ??
            t('governance.storageSocle.ensureError'),
        );
      }
      return unwrapSectionApiData<{ result: { created: string[]; existing: string[] } }>(json);
    },
    onSuccess: (payload) => {
      void qc.invalidateQueries({ queryKey: ['governance-storage-socle'] });
      const created = payload?.result.created.length ?? 0;
      toast.success(
        created > 0
          ? t('governance.storageSocle.ensureSuccess', { count: created })
          : t('governance.storageSocle.alreadyReady'),
      );
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const ready = data?.socle.readyCount ?? 0;
  const total = data?.socle.totalCount ?? 0;
  const allReady = total > 0 && ready === total;
  const progressPct = total > 0 ? Math.round((ready / total) * 100) : 0;

  const kpiItems = useMemo(() => {
    if (!data) return [];
    const isRemote = data.mode === 'remote';
    return [
      {
        label: t('governance.storageSocle.mode'),
        value: isRemote
          ? t('governance.storageSocle.modeRemote')
          : t('governance.storageSocle.modeLocal'),
        subtitle: isRemote
          ? t('governance.storageSocle.modeRemoteHint', { bucket: data.bucket })
          : t('governance.storageSocle.modeLocalHint'),
        icon: isRemote ? Cloud : HardDrive,
      },
      {
        label: t('governance.storageSocle.delivery'),
        value: isRemote ? data.bucket : t('governance.storageSocle.deliveryLocal'),
        subtitle: t('governance.storageSocle.deliveryHint'),
        icon: Server,
      },
    ];
  }, [data, t]);

  if (isLoading) {
    return (
      <section className="rounded-xl border border-border/70 bg-muted/10 p-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <LoaderCircleIcon className="size-4 animate-spin" />
          {t('crud.loading')}
        </div>
      </section>
    );
  }

  if (isError || !data) {
    return (
      <section className="rounded-xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">
        {t('governance.storageSocle.loadError')}
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-xl border border-border/70 bg-gradient-to-b from-muted/20 to-background">
      <header className="border-b border-border/60 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/10">
            <Server className="size-5 text-primary" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold tracking-tight">
                {t('governance.storageSocle.title')}
              </h2>
              <Badge variant={allReady ? 'success' : 'warning'} appearance="light" className="text-[10px]">
                {allReady ? (
                  <span className="inline-flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    {t('governance.storageSocle.alreadyReady')}
                  </span>
                ) : (
                  t('governance.storageSocle.readyBadge', { ready, total })
                )}
              </Badge>
            </div>
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {t('governance.storageSocle.sectionSubtitle')}
            </p>
          </div>
        </div>
      </header>

      <div className="space-y-4 px-5 py-5 sm:px-6">
        <ModuleKpiStatsRow items={kpiItems} />

        <div className="overflow-hidden rounded-lg border border-border/60 bg-background">
          <div className="space-y-4 border-b border-border/60 p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-sm font-semibold">{t('governance.storageSocle.socleStatusTitle')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('governance.storageSocle.readyBadge', { ready, total })}
                  {' · '}
                  {t('governance.storageSocle.readySubtitle')}
                </p>
              </div>
              <p className="text-2xl font-semibold tabular-nums text-foreground">{progressPct} %</p>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium">{t('governance.storageSocle.ensureButton')}</p>
              <p className="text-xs text-muted-foreground">{t('governance.storageSocle.ensureHint')}</p>
              {!data.minioConsoleUrl ? (
                <p className="text-xs text-muted-foreground">{t('governance.storageSocle.minioConsoleUnset')}</p>
              ) : null}
            </div>
            <Button
              variant={allReady ? 'outline' : 'primary'}
              size="sm"
              className="shrink-0 gap-2"
              disabled={ensureMutation.isPending || allReady}
              onClick={() => ensureMutation.mutate()}
            >
              {ensureMutation.isPending ? (
                <LoaderCircleIcon className="size-4 animate-spin" />
              ) : (
                <FolderTree className="size-4" />
              )}
              {t('governance.storageSocle.ensureButton')}
            </Button>
          </div>

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between border-t border-border/60 px-4 py-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/30 sm:px-5 [&[data-state=open]>svg]:rotate-180">
              {t('governance.storageSocle.infraDetails')}
              <ChevronDown className="size-4 transition-transform" />
            </CollapsibleTrigger>
            <CollapsibleContent className="border-t border-border/60 bg-muted/10 px-4 py-3 text-xs text-muted-foreground sm:px-5">
              <p>
                <span className="font-medium text-foreground">{t('governance.storageSocle.publicBase')} :</span>{' '}
                <code className="break-all rounded bg-background px-1 py-0.5 text-[11px]">{data.publicBaseUrl}</code>
              </p>
              {data.minioConsoleUrl ? (
                <p className="mt-2">
                  <span className="font-medium text-foreground">Console MinIO :</span>{' '}
                  <code className="break-all rounded bg-background px-1 py-0.5 text-[11px]">{data.minioConsoleUrl}</code>
                </p>
              ) : null}
              {data.monitoringUrl ? (
                <p className="mt-2">
                  <span className="font-medium text-foreground">Monitoring :</span>{' '}
                  <code className="break-all rounded bg-background px-1 py-0.5 text-[11px]">{data.monitoringUrl}</code>
                </p>
              ) : null}
              <p className="mt-2 leading-relaxed">{t('governance.storageSocle.description')}</p>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>
    </section>
  );
}
