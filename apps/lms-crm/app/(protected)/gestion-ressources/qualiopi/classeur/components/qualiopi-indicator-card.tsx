'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@repo/ui/card';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import {
  QUALIOPI_AUDIT_STATUSES,
  type QualiopiAuditStatus,
  type QualiopiIndicator,
} from '@/lib/of/qualiopi-indicators';
import {
  AUDIT_STATUS_LABEL,
  QUALIOPI_CLASSEUR_QUERY_KEY,
  STATUS_TO_AUDIT,
  type ComplianceItemRow,
} from '../hooks/use-qualiopi-classeur';
import { QualiopiIndicatorStatusBadge } from './qualiopi-indicator-status-badge';

export function QualiopiIndicatorCard({
  indicator,
  item,
  disabled,
  evidenceCovered,
}: {
  indicator: QualiopiIndicator;
  item: ComplianceItemRow | undefined;
  disabled: boolean;
  /** OF-11′ — preuve Evidence existante (couverture auto), distinct du jugement audit. */
  evidenceCovered: boolean;
}) {
  const queryClient = useQueryClient();
  const [auditStatus, setAuditStatus] = useState<QualiopiAuditStatus | ''>(
    item ? (STATUS_TO_AUDIT[item.status] ?? '') : '',
  );
  const [comment, setComment] = useState(item?.rejectionReason ?? '');

  const dirty =
    (auditStatus || '') !== (item ? (STATUS_TO_AUDIT[item.status] ?? '') : '') ||
    comment !== (item?.rejectionReason ?? '');

  const unauditedWithEvidence =
    evidenceCovered &&
    (!item || item.status === 'MISSING' || item.status === 'REQUESTED');

  const saveMutation = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      if (!item) throw new Error('Indicateur non initialisé — rechargez la page.');
      const res = await apiFetch(`/api/sections/gestion-ressources/qualiopi/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          (j as { error?: { message?: string } | string })?.error &&
            typeof (j as { error?: { message?: string } }).error === 'object'
            ? ((j as { error: { message?: string } }).error.message ?? 'Échec de mise à jour')
            : typeof (j as { error?: string }).error === 'string'
              ? (j as { error: string }).error
              : 'Échec de mise à jour',
        );
      }
      return j;
    },
    onSuccess: () => {
      toast.success('Indicateur mis à jour');
      void queryClient.invalidateQueries({ queryKey: [QUALIOPI_CLASSEUR_QUERY_KEY] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!item) throw new Error('Indicateur non initialisé — rechargez la page.');
      const fd = new FormData();
      fd.append('file', file);
      fd.append('module', 'gestion-ressources');
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

      const patchRes = await apiFetch(`/api/sections/gestion-ressources/qualiopi/items/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileAssetId: asset.id, auditStatus: 'OK' }),
      });
      if (!patchRes.ok) {
        const pj = await patchRes.json().catch(() => ({}));
        throw new Error((pj as { error?: string })?.error || 'Liaison de la preuve impossible');
      }
    },
    onSuccess: () => {
      toast.success('Preuve jointe et indicateur validé');
      void queryClient.invalidateQueries({ queryKey: [QUALIOPI_CLASSEUR_QUERY_KEY] });
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
          <div className="flex flex-col items-end gap-1">
            {item ? <QualiopiIndicatorStatusBadge status={item.status} /> : null}
            {unauditedWithEvidence ? (
              <Badge
                variant="secondary"
                appearance="outline"
                className="text-[10px] font-medium"
                title="Une preuve Evidence est liée à cet indicateur, mais le jugement d’audit n’est pas encore OK/KO/NA."
              >
                Preuve auto · non revu
              </Badge>
            ) : null}
          </div>
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
