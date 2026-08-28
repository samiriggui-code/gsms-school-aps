'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, CheckCircle2, Loader2, ShieldAlert, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  QUALIOPI_AUDIT_STATUSES,
  qualiopiIndicatorsByCriterion,
  type QualiopiAuditStatus,
  type QualiopiIndicator,
} from '@/lib/of/qualiopi-indicators';

type DossierBootstrap = {
  dossierId: string;
  summary: {
    completenessPct: number;
    status: string;
    missingRequired: string[];
  };
};

type ItemStatus =
  | 'MISSING'
  | 'REQUESTED'
  | 'RECEIVED'
  | 'VALIDATED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WAIVED';

type ComplianceItemRow = {
  id: string;
  code: string;
  label: string;
  status: ItemStatus;
  fileCategory: string;
  fileAssetId: string | null;
  rejectionReason: string | null;
  fileAsset: { id: string; url: string; originalName: string } | null;
};

const STATUS_TO_AUDIT: Partial<Record<ItemStatus, QualiopiAuditStatus>> = {
  VALIDATED: 'OK',
  REJECTED: 'KO',
  WAIVED: 'NA',
  REQUESTED: 'TO_FIX',
};

const AUDIT_STATUS_LABEL: Record<QualiopiAuditStatus, string> = {
  OK: 'OK',
  KO: 'KO',
  TO_FIX: 'À réparer',
  NA: 'N/A',
};

const QUERY_KEY = 'qualiopi-classeur';

function statusBadge(status: ItemStatus) {
  switch (status) {
    case 'VALIDATED':
      return (
        <Badge className="bg-success/10 text-success border-success/20 font-bold text-[10px]">
          OK
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="destructive" className="font-bold text-[10px]">
          KO
        </Badge>
      );
    case 'REQUESTED':
      return (
        <Badge className="bg-warning/10 text-warning border-warning/20 font-bold text-[10px]">
          À réparer
        </Badge>
      );
    case 'WAIVED':
      return (
        <Badge variant="outline" className="font-bold text-[10px]">
          N/A
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="font-bold text-[10px] text-muted-foreground">
          À auditer
        </Badge>
      );
  }
}

function IndicatorCard({
  indicator,
  item,
  disabled,
}: {
  indicator: QualiopiIndicator;
  item: ComplianceItemRow | undefined;
  disabled: boolean;
}) {
  const queryClient = useQueryClient();
  const [auditStatus, setAuditStatus] = useState<QualiopiAuditStatus | ''>(
    item ? (STATUS_TO_AUDIT[item.status] ?? '') : '',
  );
  const [comment, setComment] = useState(item?.rejectionReason ?? '');

  const dirty =
    (auditStatus || '') !== (item ? (STATUS_TO_AUDIT[item.status] ?? '') : '') ||
    comment !== (item?.rejectionReason ?? '');

  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!item) throw new Error('Indicateur non initialisé — rechargez la page.');
      const res = await apiFetch(`/api/entities/complianceDossierItem/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((j as { error?: { message?: string } })?.error?.message || 'Échec de mise à jour');
      }
      return j;
    },
    onSuccess: () => {
      toast.success('Indicateur mis à jour');
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!item) throw new Error('Indicateur non initialisé — rechargez la page.');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('module', 'support-qualite');
      fd.append('entityType', 'ComplianceDossierItem');
      fd.append('entityId', item.id);
      fd.append('category', item.fileCategory);
      fd.append('visibility', 'INTERNAL');
      const res = await apiFetch('/api/common/files', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((j as { message?: string })?.message || 'Échec du téléversement');
      }
      const asset = (j as { data?: { id: string } }).data;
      if (!asset?.id) throw new Error('Réponse serveur invalide');

      const patchRes = await apiFetch(`/api/entities/complianceDossierItem/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileAssetId: asset.id, auditStatus: 'OK' }),
      });
      if (!patchRes.ok) {
        const pj = await patchRes.json().catch(() => ({}));
        throw new Error((pj as { error?: { message?: string } })?.error?.message || 'Liaison de la preuve impossible');
      }
    },
    onSuccess: () => {
      toast.success('Preuve jointe et indicateur validé');
      void queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold leading-snug">
              I{String(indicator.indicator).padStart(2, '0')} — {indicator.label}
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">{indicator.description}</CardDescription>
          </div>
          {item ? statusBadge(item.status) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Statut d'audit</Label>
            <Select
              value={auditStatus}
              onValueChange={(v) => setAuditStatus(v as QualiopiAuditStatus)}
              disabled={disabled || !item}
            >
              <SelectTrigger>
                <SelectValue placeholder="À auditer" />
              </SelectTrigger>
              <SelectContent>
                {QUALIOPI_AUDIT_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {AUDIT_STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Preuve</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled || !item} asChild>
                <label className="cursor-pointer">
                  <Upload className="size-4" />
                  {uploadMutation.isPending ? 'Envoi…' : item?.fileAsset ? 'Remplacer' : 'Joindre'}
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                    disabled={disabled || !item || uploadMutation.isPending}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) uploadMutation.mutate(f);
                    }}
                  />
                </label>
              </Button>
              {item?.fileAsset ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                  <a href={item.fileAsset.url} target="_blank" rel="noopener noreferrer">
                    Voir « {item.fileAsset.originalName} »
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Aucune preuve.</span>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-semibold">Commentaire d'audit</Label>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Constat, action corrective, référence de preuve…"
            disabled={disabled || !item}
            className="resize-y min-h-[56px]"
          />
        </div>

        <div className="flex items-center gap-2 border-t border-border/60 pt-3">
          <Button
            type="button"
            size="sm"
            disabled={disabled || !item || !auditStatus || (!dirty && !saveMutation.isPending)}
            onClick={() => saveMutation.mutate({ auditStatus, comment })}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              'Enregistrer'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function QualiopiClasseurView() {
  const bootstrapQuery = useQuery({
    queryKey: [QUERY_KEY, 'bootstrap'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/support-qualite/qualiopi');
      if (!res.ok) throw new Error('fetch');
      return unwrapSectionApiData<DossierBootstrap>(await res.json());
    },
    staleTime: 1000 * 30,
  });

  const dossierId = bootstrapQuery.data?.dossierId;

  const itemsQuery = useQuery({
    queryKey: [QUERY_KEY, 'items', dossierId],
    enabled: Boolean(dossierId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/entities/complianceDossierItem?dossierId=${dossierId}&limit=100&sort=code&dir=asc`,
      );
      if (!res.ok) throw new Error('fetch');
      const json = await res.json();
      const data = unwrapSectionApiData<{ data: ComplianceItemRow[] }>(json);
      return data?.data ?? [];
    },
  });

  const itemsByCode = useMemo(() => {
    const map = new Map<string, ComplianceItemRow>();
    for (const row of itemsQuery.data ?? []) map.set(row.code, row);
    return map;
  }, [itemsQuery.data]);

  const grouped = useMemo(() => qualiopiIndicatorsByCriterion(), []);

  const counts = useMemo(() => {
    const rows = itemsQuery.data ?? [];
    const total = rows.length;
    const ok = rows.filter((r) => r.status === 'VALIDATED').length;
    const ko = rows.filter((r) => r.status === 'REJECTED').length;
    const toFix = rows.filter((r) => r.status === 'REQUESTED').length;
    const na = rows.filter((r) => r.status === 'WAIVED').length;
    const pending = total - ok - ko - toFix - na;
    return { total, ok, ko, toFix, na, pending };
  }, [itemsQuery.data]);

  const isLoading = bootstrapQuery.isLoading || (Boolean(dossierId) && itemsQuery.isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement du classeur Qualiopi…
      </div>
    );
  }

  if (bootstrapQuery.isError || !dossierId) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm">
          <p className="font-medium text-destructive">Impossible de charger le dossier Qualiopi.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void bootstrapQuery.refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const globalOk = counts.ko === 0 && counts.pending === 0;

  return (
    <div className="space-y-10">
      <div
        className={cn(
          'flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3',
          globalOk
            ? 'border-green-200 bg-green-50 dark:bg-green-950/20'
            : counts.ko > 0
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20',
        )}
      >
        <div className="flex items-center gap-2.5">
          {globalOk ? (
            <CheckCircle2 className="size-4 text-green-600" />
          ) : counts.ko > 0 ? (
            <ShieldAlert className="size-4 text-destructive" />
          ) : (
            <AlertCircle className="size-4 text-yellow-600" />
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest">
              {counts.ok}/{counts.total} indicateurs OK
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {counts.ko > 0 ? `${counts.ko} KO · ` : ''}
              {counts.toFix > 0 ? `${counts.toFix} à réparer · ` : ''}
              {counts.na > 0 ? `${counts.na} N/A · ` : ''}
              {counts.pending} à auditer
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-xs font-bold">
          {bootstrapQuery.data?.summary.completenessPct ?? 0}% complet
        </Badge>
      </div>

      {[1, 2, 3, 4, 5, 6, 7].map((criterion) => {
        const indicators = grouped.get(criterion);
        if (!indicators?.length) return null;
        return (
          <section key={criterion} className="space-y-4">
            <div className="border-b border-border/60 pb-3">
              <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">
                Critère {criterion}
              </h2>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {indicators.map((indicator) => (
                <IndicatorCard
                  key={indicator.code}
                  indicator={indicator}
                  item={itemsByCode.get(indicator.code)}
                  disabled={false}
                />
              ))}
            </div>
            <Separator className="opacity-40" />
          </section>
        );
      })}
    </div>
  );
}
