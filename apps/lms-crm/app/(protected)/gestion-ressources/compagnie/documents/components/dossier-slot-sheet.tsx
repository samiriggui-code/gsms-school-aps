'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Hash,
  History,
  Loader2,
  Scan,
  StickyNote,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import {
  ADMIN_DOC_ENTITY_TYPE,
  ADMIN_DOC_MODULE,
  ADMIN_DOCUMENT_GROUPS,
} from '@/lib/admin-document-slots';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage, AvatarIndicator, AvatarStatus } from '@repo/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui/tabs';
import { ScrollArea } from '@repo/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@repo/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { VIE_SCOLAIRE_SHEET_LARGE_1000 } from '../../../constants/sheet-shell-classes';
import type { DossierActor, DossierSlotPayload } from './dossier-types';
import { DossierFileViewerDialog, type DossierViewerFile } from './dossier-file-viewer-dialog';

function historyActionLabel(action: string): string {
  switch (action) {
    case 'FICHE_UPDATE':
      return 'Fiche';
    case 'FILE_ATTACHED':
      return 'Fichier joint';
    case 'FILE_DETACHED':
      return 'Fichier détaché';
    case 'FILE_REPLACED':
      return 'Fichier remplacé';
    default:
      return action;
  }
}

function actorDisplayName(a: DossierActor): string {
  const p = [a.firstName, a.lastName].filter(Boolean).join(' ').trim();
  if (p) return p;
  return (a.name || '').trim() || a.email || '—';
}

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

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settingsId: string | null;
  slot: DossierSlotPayload | null;
  /** Ouverture depuis la colonne : œil = lecture seule, crayon = édition. */
  initialMode: 'view' | 'edit';
};

export function DossierSlotSheet({ open, onOpenChange, settingsId, slot, initialMode }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'view' | 'edit'>(initialMode);
  const [sheetTab, setSheetTab] = useState<'fiche' | 'history'>('fiche');
  const [viewerFile, setViewerFile] = useState<DossierViewerFile | null>(null);
  const [confirmDetach, setConfirmDetach] = useState(false);
  const [reference, setReference] = useState('');
  const [issuedAt, setIssuedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (open && slot) {
      setMode(initialMode);
      setSheetTab('fiche');
      setReference(slot.fiche.reference);
      setIssuedAt(toDateInput(slot.fiche.issuedAt));
      setExpiresAt(toDateInput(slot.fiche.expiresAt));
      setNotes(slot.fiche.notes);
    }
  }, [open, slot, initialMode]);

  const editable = mode === 'edit' && !!settingsId && !!slot;
  const def = slot?.definition;
  const file = slot?.file;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!slot) return;
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.definition.id,
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
      if (!slot || !settingsId) return;
      const fd = new FormData();
      fd.append('file', uploaded);
      fd.append('module', ADMIN_DOC_MODULE);
      fd.append('entityType', ADMIN_DOC_ENTITY_TYPE);
      fd.append('entityId', settingsId);
      fd.append('category', slot.definition.id);
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
          slotId: slot.definition.id,
          patch: { fileAssetId: asset.id },
        }),
      });
      if (!patchRes.ok) {
        const pj = await patchRes.json().catch(() => ({}));
        throw new Error((pj as { error?: { message?: string } }).error?.message || 'Liaison du fichier impossible');
      }
    },
    onSuccess: () => {
      toast.success(t('documents.attached'));
      void queryClient.invalidateQueries({ queryKey: ['dossier-administratif'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const detachMutation = useMutation({
    mutationFn: async () => {
      if (!slot) return;
      const res = await apiFetch('/api/sections/gestion-ressources/compagnie/dossier-administratif', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.definition.id,
          patch: { fileAssetId: null },
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error((j as { error?: { message?: string } }).error?.message || 'Suppression impossible');
      }
    },
    onSuccess: () => {
      toast.success(t('documents.detached'));
      setConfirmDetach(false);
      void queryClient.invalidateQueries({ queryKey: ['dossier-administratif'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!slot || !def) return null;

  const exp = expiryTone(expiresAt || null);
  const dirty =
    reference !== (slot.fiche.reference || '') ||
    (issuedAt || '') !== toDateInput(slot.fiche.issuedAt) ||
    (expiresAt || '') !== toDateInput(slot.fiche.expiresAt) ||
    notes !== (slot.fiche.notes || '');

  const groupTitle = ADMIN_DOCUMENT_GROUPS[def.group]?.title ?? def.group;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE_1000}>
          <SheetHeader className="border-b border-border bg-background px-5 py-4 shrink-0">
            <SheetTitle className="text-left text-base font-bold text-foreground md:text-lg">
              {def.title}
            </SheetTitle>
            <p className="text-left text-sm text-muted-foreground">{def.description}</p>
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Badge variant="outline" className="text-[10px] font-semibold">
                {groupTitle}
              </Badge>
              {def.recommended ? (
                <Badge variant="secondary" className="text-[10px] font-bold uppercase">
                  Pièce courante
                </Badge>
              ) : null}
              {exp === 'expired' ? (
                <Badge variant="destructive" className="gap-1 text-[10px]">
                  <AlertCircle className="size-3" />
                  Expiré
                </Badge>
              ) : null}
              {exp === 'soon' ? (
                <Badge className="border-amber-500/40 bg-amber-500/15 text-[10px] text-amber-950 dark:text-amber-100">
                  À renouveler (&lt; 60 j.)
                </Badge>
              ) : null}
              {exp === 'ok' && expiresAt ? (
                <Badge variant="outline" className="gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="size-3" />
                  Date OK
                </Badge>
              ) : null}
            </div>
          </SheetHeader>

          <SheetBody className="flex flex-1 flex-col overflow-hidden px-5 py-4">
            {slot.lastActor ? (
              <div className="mb-4 flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 px-3 py-2">
                <Avatar className="size-10 shrink-0 border border-border/60">
                  {slot.lastActor.avatar ? (
                    <AvatarImage src={getAvatarUrl(slot.lastActor.avatar)} alt="" />
                  ) : null}
                  <AvatarFallback className="text-xs font-semibold">
                    {getInitials(actorDisplayName(slot.lastActor))}
                  </AvatarFallback>
                  <AvatarIndicator className="-end-0.5 -top-0.5">
                    <AvatarStatus
                      variant={slot.lastActor.status === 'ACTIVE' ? 'online' : 'offline'}
                      className="size-2.5"
                    />
                  </AvatarIndicator>
                </Avatar>
                <div className="min-w-0 text-sm">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                    Dernière modification
                  </p>
                  <p className="truncate font-semibold text-foreground">{actorDisplayName(slot.lastActor)}</p>
                  {slot.lastUpdatedAt ? (
                    <p className="truncate text-xs text-muted-foreground">
                      {formatDateTime(new Date(slot.lastUpdatedAt))}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}

            <Tabs value={sheetTab} onValueChange={(v) => setSheetTab(v as 'fiche' | 'history')} className="flex min-h-0 flex-1 flex-col">
              <TabsList className="mb-4 h-9 w-fit shrink-0">
                <TabsTrigger value="fiche" className="gap-1.5 text-xs">
                  <FileText className="size-3.5" />
                  Fiche
                </TabsTrigger>
                <TabsTrigger value="history" className="gap-1.5 text-xs">
                  <History className="size-3.5" />
                  Historique
                  {slot.history?.length ? (
                    <Badge variant="secondary" className="ms-1 px-1.5 py-0 text-[10px]">
                      {slot.history.length}
                    </Badge>
                  ) : null}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="fiche" className="mt-0 flex min-h-0 flex-1 flex-col overflow-y-auto data-[state=inactive]:hidden">
                {file ? (
                  <div className="mb-4">
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      className="gap-2"
                      onClick={() =>
                        setViewerFile({
                          url: file.url,
                          mimeType: file.mimeType,
                          originalName: file.originalName,
                        })
                      }
                    >
                      <Scan className="size-4" />
                      Voir le document
                    </Button>
                  </div>
                ) : null}

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold">
                      <Hash className="size-3.5 opacity-70" />
                      Référence / numéro
                    </Label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      disabled={!editable}
                      placeholder="N° police, certificat, greffe…"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold">
                      <FileText className="size-3.5 opacity-70" />
                      Fichier (PDF / scan)
                    </Label>
                    <div className="flex flex-wrap items-center gap-2">
                      {editable ? (
                        <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                          <label className="cursor-pointer">
                            <Upload className="size-4" />
                            {uploadMutation.isPending ? 'Envoi…' : file ? 'Remplacer' : 'Joindre'}
                            <input
                              type="file"
                              className="sr-only"
                              accept=".pdf,image/*,.png,.jpg,.jpeg,.webp"
                              disabled={uploadMutation.isPending}
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                e.target.value = '';
                                if (f) uploadMutation.mutate(f);
                              }}
                            />
                          </label>
                        </Button>
                      ) : null}
                      {file ? (
                        <Button type="button" variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-xs" asChild>
                          <a href={file.url} target="_blank" rel="noopener noreferrer">
                            <Download className="size-3.5" />
                            {file.originalName}
                          </a>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Aucun fichier</span>
                      )}
                      {editable && file ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 text-destructive hover:text-destructive"
                          onClick={() => setConfirmDetach(true)}
                        >
                          <Trash2 className="size-4" />
                          Détacher
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold">
                      <Calendar className="size-3.5 opacity-70" />
                      Date d&apos;émission
                    </Label>
                    <Input
                      type="date"
                      value={issuedAt}
                      onChange={(e) => setIssuedAt(e.target.value)}
                      disabled={!editable}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="flex items-center gap-1.5 text-xs font-semibold">
                      <Calendar className="size-3.5 opacity-70" />
                      Date d&apos;expiration
                    </Label>
                    <Input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      disabled={!editable}
                    />
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label className="flex items-center gap-1.5 text-xs font-semibold">
                    <StickyNote className="size-3.5 opacity-70" />
                    Notes internes
                  </Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={5}
                    disabled={!editable}
                    className="resize-y min-h-[100px]"
                  />
                </div>
              </TabsContent>

              <TabsContent
                value="history"
                className="mt-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
              >
                {!slot.history?.length ? (
                  <p className="rounded-lg border border-dashed border-border/80 bg-muted/10 px-4 py-8 text-center text-sm text-muted-foreground">
                    Aucun historique pour le moment. Les prochaines modifications ou pièces jointes apparaîtront ici.
                  </p>
                ) : (
                  <ScrollArea className="h-[min(420px,50vh)] pr-3">
                    <ul className="space-y-3 pb-2">
                      {slot.history.map((entry, idx) => {
                        const a = entry.actor;
                        const label = a ? actorDisplayName(a) : 'Utilisateur';
                        const initials = getInitials(label);
                        return (
                          <li
                            key={`${entry.at}-${entry.userId}-${idx}`}
                            className="flex gap-3 rounded-lg border border-border/70 bg-card/40 px-3 py-2.5"
                          >
                            <Avatar className="size-9 shrink-0 border border-border/60">
                              {a?.avatar ? <AvatarImage src={getAvatarUrl(a.avatar)} alt="" /> : null}
                              <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                              {a ? (
                                <AvatarIndicator className="-end-0.5 -top-0.5">
                                  <AvatarStatus
                                    variant={a.status === 'ACTIVE' ? 'online' : 'offline'}
                                    className="size-2.5"
                                  />
                                </AvatarIndicator>
                              ) : null}
                            </Avatar>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                                <span className="text-sm font-semibold text-foreground">{label}</span>
                                <Badge variant="outline" className="text-[10px] font-semibold">
                                  {historyActionLabel(entry.action)}
                                </Badge>
                              </div>
                              {entry.summary ? (
                                <p className="mt-0.5 text-xs text-muted-foreground">{entry.summary}</p>
                              ) : null}
                              <p className="mt-1 text-[11px] text-muted-foreground">
                                {formatDateTime(new Date(entry.at))}
                              </p>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </ScrollArea>
                )}
              </TabsContent>
            </Tabs>
          </SheetBody>

          <SheetFooter className="flex flex-row flex-wrap items-center gap-2 border-t border-border bg-background px-5 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
            <div className="ms-auto flex flex-wrap items-center gap-2">
              {mode === 'view' ? (
                <Button type="button" variant="outline" onClick={() => setMode('edit')}>
                  Modifier la fiche
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={!dirty || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
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
              )}
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DossierFileViewerDialog
        open={!!viewerFile}
        onOpenChange={(o) => {
          if (!o) setViewerFile(null);
        }}
        file={viewerFile}
      />

      <AlertDialog open={confirmDetach} onOpenChange={setConfirmDetach}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Détacher le fichier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le fichier ne sera plus lié à cette fiche. La fiche (références, dates, notes) est conservée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                detachMutation.mutate();
              }}
            >
              {detachMutation.isPending ? '…' : 'Détacher'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
