'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  FileText,
  Hash,
  Loader2,
  StickyNote,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch, unwrapSectionApiData } from '@/lib/api';
import {
  ADMIN_DOC_ENTITY_TYPE,
  ADMIN_DOC_MODULE,
  ADMIN_DOCUMENT_GROUPS,
  type AdminDocumentGroupId,
  type AdminDocumentSlot,
} from '@/lib/admin-document-slots';
import { Button } from '@repo/ui/button';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { Separator } from '@repo/ui/separator';

type FileSummary = {
  id: string;
  url: string;
  originalName: string;
  mimeType: string;
  createdAt: string;
} | null;

export type DossierSlotPayload = {
  definition: AdminDocumentSlot;
  fiche: {
    reference: string;
    issuedAt: string | null;
    expiresAt: string | null;
    notes: string;
    fileAssetId: string | null;
  };
  file: FileSummary;
};

type DossierGET = {
  settingsId: string;
  slots: DossierSlotPayload[];
  summary: {
    totalSlots: number;
    withFile: number;
    expiringSoon: number;
    expired: number;
  };
};

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

function expiryTone(expiresAt: string | null): 'ok' | 'soon' | 'expired' | 'none' {
  if (!expiresAt) return 'none';
  const d = new Date(expiresAt);
  if (Number.isNaN(d.getTime())) return 'none';
  const t0 = new Date();
  t0.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - t0.getTime()) / (86400 * 1000));
  if (diff < 0) return 'expired';
  if (diff <= 60) return 'soon';
  return 'ok';
}

function SlotCard({
  row,
  settingsId,
  disabled,
}: {
  row: DossierSlotPayload;
  settingsId: string;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { definition: def, fiche, file } = row;
  const [reference, setReference] = useState(fiche.reference);
  const [issuedAt, setIssuedAt] = useState(toDateInput(fiche.issuedAt));
  const [expiresAt, setExpiresAt] = useState(toDateInput(fiche.expiresAt));
  const [notes, setNotes] = useState(fiche.notes);

  useEffect(() => {
    setReference(row.fiche.reference);
    setIssuedAt(toDateInput(row.fiche.issuedAt));
    setExpiresAt(toDateInput(row.fiche.expiresAt));
    setNotes(row.fiche.notes);
  }, [
    row.fiche.reference,
    row.fiche.issuedAt,
    row.fiche.expiresAt,
    row.fiche.notes,
    row.fiche.fileAssetId,
  ]);

  const syncFromProps = () => {
    setReference(row.fiche.reference);
    setIssuedAt(toDateInput(row.fiche.issuedAt));
    setExpiresAt(toDateInput(row.fiche.expiresAt));
    setNotes(row.fiche.notes);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: def.id,
          patch: {
            reference,
            issuedAt: issuedAt || null,
            expiresAt: expiresAt || null,
            notes,
          },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: { message?: string } }).error?.message || 'Enregistrement impossible');
      }
    },
    onSuccess: () => {
      toast.success(t('documents.recordSaved'));
      void queryClient.invalidateQueries({ queryKey: ['dossier-administratif'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const uploadMutation = useMutation({
    mutationFn: async (uploaded: File) => {
      const fd = new FormData();
      fd.append('file', uploaded);
      fd.append('module', ADMIN_DOC_MODULE);
      fd.append('entityType', ADMIN_DOC_ENTITY_TYPE);
      fd.append('entityId', settingsId);
      fd.append('category', def.id);
      fd.append('visibility', 'INTERNAL');
      const res = await apiFetch('/api/common/files', { method: 'POST', body: fd });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((j as { message?: string }).message || 'Échec du téléversement');
      }
      const asset = (j as { data?: { id: string } }).data;
      if (!asset?.id) throw new Error('Réponse serveur invalide');
      const patchRes = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: def.id,
          patch: { fileAssetId: asset.id },
        }),
      });
      if (!patchRes.ok) {
        const pj = await patchRes.json().catch(() => ({}));
        throw new Error((pj as { error?: { message?: string } }).error?.message || 'Liaison du fichier impossible');
      }
    },
    onSuccess: () => {
      toast.success(t('documents.attachedToDossier'));
      void queryClient.invalidateQueries({ queryKey: ['dossier-administratif'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const exp = expiryTone(expiresAt || null);
  const dirty =
    reference !== (row.fiche.reference || '') ||
    (issuedAt || '') !== toDateInput(row.fiche.issuedAt) ||
    (expiresAt || '') !== toDateInput(row.fiche.expiresAt) ||
    notes !== (row.fiche.notes || '');

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader className="space-y-2 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-bold leading-snug">{def.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed">{def.description}</CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {def.recommended ? (
              <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wide">
                Pièce courante
              </Badge>
            ) : null}
            {exp === 'expired' ? (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="size-3" />
                Expiré
              </Badge>
            ) : null}
            {exp === 'soon' ? (
              <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-950 dark:text-amber-100">
                À renouveler (&lt; 60 j.)
              </Badge>
            ) : null}
            {exp === 'ok' && expiresAt ? (
              <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="size-3" />
                Date OK
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${def.id}-ref`} className="flex items-center gap-1.5 text-xs font-semibold">
              <Hash className="size-3.5 opacity-70" />
              Référence / numéro de pièce
            </Label>
            <Input
              id={`${def.id}-ref`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Ex. n° police, n° certificat, greffe…"
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5 text-xs font-semibold">
              <FileText className="size-3.5 opacity-70" />
              Fichier scanné / PDF
            </Label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" variant="outline" size="sm" className="gap-2" disabled={disabled} asChild>
                <label className="cursor-pointer">
                  <Upload className="size-4" />
                  {uploadMutation.isPending ? 'Envoi…' : file ? 'Remplacer' : 'Joindre'}
                  <input
                    type="file"
                    className="sr-only"
                    accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                    disabled={disabled || uploadMutation.isPending}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      e.target.value = '';
                      if (f) uploadMutation.mutate(f);
                    }}
                  />
                </label>
              </Button>
              {file ? (
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" asChild>
                  <a href={file.url} target="_blank" rel="noopener noreferrer">
                    Ouvrir « {file.originalName} »
                  </a>
                </Button>
              ) : (
                <span className="text-xs text-muted-foreground">Aucun fichier pour l’instant.</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={`${def.id}-issue`} className="flex items-center gap-1.5 text-xs font-semibold">
              <Calendar className="size-3.5 opacity-70" />
              Date d’émission / édition
            </Label>
            <Input
              id={`${def.id}-issue`}
              type="date"
              value={issuedAt}
              onChange={(e) => setIssuedAt(e.target.value)}
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${def.id}-exp`} className="flex items-center gap-1.5 text-xs font-semibold">
              <Calendar className="size-3.5 opacity-70" />
              Date d’expiration
            </Label>
            <Input
              id={`${def.id}-exp`}
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              disabled={disabled}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`${def.id}-notes`} className="flex items-center gap-1.5 text-xs font-semibold">
            <StickyNote className="size-3.5 opacity-70" />
            Notes internes
          </Label>
          <Textarea
            id={`${def.id}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Contexte, contacts préfecture, lien vers version signée…"
            disabled={disabled}
            className="resize-y min-h-[72px]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
          <Button
            type="button"
            size="sm"
            disabled={disabled || !dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Enregistrement…
              </>
            ) : (
              'Enregistrer la fiche'
            )}
          </Button>
          {dirty ? (
            <Button type="button" variant="ghost" size="sm" onClick={syncFromProps} disabled={saveMutation.isPending}>
              Annuler les changements
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export function DossierAdministratifView() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dossier-administratif'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif');
      if (!res.ok) throw new Error('fetch');
      const json = await res.json();
      return unwrapSectionApiData<DossierGET>(json);
    },
    staleTime: 1000 * 60,
  });

  const grouped = useMemo(() => {
    const slots = data?.slots ?? [];
    const map = new Map<AdminDocumentGroupId, DossierSlotPayload[]>();
    for (const s of slots) {
      const g = s.definition.group;
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(s);
    }
    return map;
  }, [data?.slots]);

  const order: AdminDocumentGroupId[] = ['juridique', 'conformite', 'locaux', 'finances', 'rh', 'divers'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 py-20 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement du dossier administratif…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <Card className="border-destructive/40 bg-destructive/5">
        <CardContent className="py-10 text-center text-sm">
          <p className="font-medium text-destructive">Impossible de charger le dossier.</p>
          <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => void refetch()}>
            Réessayer
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { summary, settingsId } = data;

  return (
    <div className="space-y-10">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pièces jointes</p>
          <p className="text-2xl font-bold text-foreground">
            {summary.withFile}/{summary.totalSlots}
          </p>
          <p className="text-xs text-muted-foreground">Fiches avec fichier</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">À surveiller</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{summary.expiringSoon}</p>
          <p className="text-xs text-muted-foreground">Expiration sous 60 jours</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Expirées</p>
          <p className="text-2xl font-bold text-destructive">{summary.expired}</p>
          <p className="text-xs text-muted-foreground">Date de fin dépassée</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-muted/20 px-4 py-3">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Rappel</p>
          <p className="text-sm leading-snug text-muted-foreground">
            Chaque bloc = une <strong className="text-foreground">fiche</strong> + un{' '}
            <strong className="text-foreground">fichier</strong> optionnel (PDF ou scan).
          </p>
        </div>
      </div>

      {order.map((groupId) => {
        const rows = grouped.get(groupId);
        if (!rows?.length) return null;
        const meta = ADMIN_DOCUMENT_GROUPS[groupId];
        return (
          <section key={groupId} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3 border-b border-border/60 pb-3">
              <Building2 className="size-5 shrink-0 text-primary" aria-hidden />
              <div>
                <h2 className="text-lg font-bold tracking-tight text-foreground md:text-xl">{meta.title}</h2>
                <p className="text-sm text-muted-foreground">{meta.description}</p>
              </div>
            </div>
            <div className="grid gap-5 lg:grid-cols-2">
              {rows.map((row) => (
                <SlotCard key={row.definition.id} row={row} settingsId={settingsId} disabled={false} />
              ))}
            </div>
            <Separator className="opacity-40" />
          </section>
        );
      })}
    </div>
  );
}
