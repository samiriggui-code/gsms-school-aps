'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertCircle,
  CloudUpload,
  FileText,
  Loader2,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { VIE_SCOLAIRE_SHEET_MEDIUM } from '../../constants/sheet-shell-classes';
import { SESSION_DOCUMENT_CATEGORY_LABELS } from '@/lib/formation-session-document-storage';
import { SUIVI_DAY_SLOT_LABELS } from '@/lib/suivi-formations/session-location';
import {
  SESSION_UPLOAD_DOCUMENT_KINDS,
  SUIVI_UPLOAD_CATEGORIES,
  buildSuggestedDocumentTitle,
  categoryRequiresSessionDay,
  categoryRequiresSlot,
  defaultDocumentKind,
  type SuiviDocumentKind,
  type SuiviUploadCategory,
  type SuiviDocumentDepositPrefill,
} from '@/lib/suivi-formations/session-upload-metadata';
import type { SuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context-types';
import type { SuiviSessionOption } from '../types/suivi-formations-api';
import { SuiviSessionContextPanel } from './suivi-session-context-panel';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type DepositContext = {
  sessionContext: SuiviSessionContext;
  journalDays: Array<{ id: string; dayDate: string }>;
};

type SlotKey = 'MORNING' | 'EVENING' | '';

function formatDayLabel(iso: string) {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

const ACCEPT =
  '.pdf,.csv,.xlsx,.xls,image/jpeg,image/png,image/webp,application/pdf,text/csv';

export function SuiviDocumentDepositSheet({
  open,
  onOpenChange,
  sessionId,
  sessionSummary: _sessionSummary,
  prefill,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  sessionSummary: SuiviSessionOption | null;
  /** Pré-remplissage (ex. depuis le journal : jour + créneau). */
  prefill?: SuiviDocumentDepositPrefill | null;
}) {
  const queryClient = useQueryClient();
  const [category, setCategory] = useState<SuiviUploadCategory>('emargement');
  const [documentKind, setDocumentKind] = useState<SuiviDocumentKind>(
    defaultDocumentKind('emargement'),
  );
  const [dayId, setDayId] = useState('');
  const [slot, setSlot] = useState<SlotKey>('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [legalHold, setLegalHold] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [titleTouched, setTitleTouched] = useState(false);

  const contextQueryKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'deposit-context',
    sessionId,
  ] as const;

  const { data: context, isLoading: contextLoading } = useQuery({
    queryKey: contextQueryKey,
    queryFn: async (): Promise<DepositContext> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/documents/deposit-context`,
      );
      if (!res.ok) throw new Error('Contexte session indisponible.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse invalide.');
      return j.data as DepositContext;
    },
    enabled: open && Boolean(sessionId),
  });

  const kindOptions = SESSION_UPLOAD_DOCUMENT_KINDS[category];
  const selectedDay = context?.journalDays.find((d) => d.id === dayId) ?? null;
  const needsDay = categoryRequiresSessionDay(category);
  const needsSlot = categoryRequiresSlot(category, documentKind);

  const resetForm = useCallback(() => {
    setCategory('emargement');
    setDocumentKind(defaultDocumentKind('emargement'));
    setDayId('');
    setSlot('');
    setTitle('');
    setNotes('');
    setLegalHold(false);
    setFile(null);
    setTitleTouched(false);
  }, []);

  useEffect(() => {
    if (!open) resetForm();
  }, [open, resetForm]);

  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.category) setCategory(prefill.category);
    if (prefill.documentKind) setDocumentKind(prefill.documentKind);
    if (prefill.dayId) setDayId(prefill.dayId);
    if (prefill.slot) setSlot(prefill.slot);
    if (prefill.notes) setNotes(prefill.notes);
    setTitleTouched(false);
  }, [open, prefill]);

  useEffect(() => {
    setDocumentKind(defaultDocumentKind(category));
    setDayId('');
    setSlot('');
    setTitleTouched(false);
  }, [category]);

  useEffect(() => {
    if (titleTouched) return;
    const suggested = buildSuggestedDocumentTitle({
      category,
      documentKind,
      dayDateLabel: selectedDay ? formatDayLabel(selectedDay.dayDate) : null,
      slot: slot || null,
      formationName: context?.sessionContext.formationName,
    });
    setTitle(suggested);
  }, [category, documentKind, selectedDay, slot, context, titleTouched]);

  useEffect(() => {
    if (category === 'archives') setLegalHold(true);
  }, [category]);

  const validationError = useMemo(() => {
    if (!file) return null;
    if (needsDay && !dayId) return 'Sélectionnez le jour de formation concerné.';
    if (needsSlot && !slot) return 'Sélectionnez le créneau matin ou après-midi.';
    if (!title.trim()) return 'Indiquez un libellé pour le document.';
    return null;
  }, [file, needsDay, dayId, needsSlot, slot, title]);

  const depositMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !file) throw new Error('Fichier requis.');
      if (validationError) throw new Error(validationError);

      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);
      formData.append('documentKind', documentKind);
      formData.append('title', title.trim());
      if (notes.trim()) formData.append('notes', notes.trim());
      if (dayId) formData.append('dayId', dayId);
      if (selectedDay) formData.append('dayDate', selectedDay.dayDate);
      if (slot) formData.append('slot', slot);
      if (legalHold) formData.append('legalHold', '1');

      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/documents/upload`,
        { method: 'POST', body: formData },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Dépôt impossible.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Document archivé dans le dossier session.');
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'documents', sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'journal', sessionId],
      });
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'journal-day'],
      });
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'dossier-status', sessionId],
      });
      onOpenChange(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pickFile = (picked: File | null) => {
    if (!picked) return;
    setFile(picked);
  };

  const dayDateLabelForPanel =
    prefill?.dayId && context
      ? formatDayLabel(context.journalDays.find((d) => d.id === prefill.dayId)?.dayDate ?? '')
      : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_MEDIUM}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-left">
            {prefill?.dayId ? 'Déposer le scan signé' : 'Déposer un document'}
          </SheetTitle>
          <SheetDescription className="text-left">
            {prefill?.dayId
              ? 'Scan de la feuille d’émargement signée — jour et créneau pré-remplis depuis le journal.'
              : 'Classement structuré dans le dossier session MinIO — métadonnées pour conformité et contrôle.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="min-h-0 flex-1 overflow-hidden px-0 py-0">
          {contextLoading || !context ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Chargement du contexte session…
            </div>
          ) : (
            <ScrollArea className="h-[calc(100dvh-14rem)]">
              <div className="space-y-6 p-6">
                <SuiviSessionContextPanel
                  context={context.sessionContext}
                  variant="compact"
                  dayDateLabel={dayDateLabelForPanel || undefined}
                  showPlanning={false}
                />

                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Dossier MinIO</Label>
                      <Select
                        value={category}
                        onValueChange={(v) => setCategory(v as SuiviUploadCategory)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUIVI_UPLOAD_CATEGORIES.map((key) => (
                            <SelectItem key={key} value={key}>
                              {SESSION_DOCUMENT_CATEGORY_LABELS[key]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Nature du document</Label>
                      <Select
                        value={documentKind}
                        onValueChange={(v) => setDocumentKind(v as SuiviDocumentKind)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {kindOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {kindOptions.find((k) => k.value === documentKind)?.hint ? (
                        <p className="text-xs text-muted-foreground">
                          {kindOptions.find((k) => k.value === documentKind)?.hint}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {(needsDay || context.journalDays.length > 0) && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>
                          Jour de session
                          {needsDay ? ' *' : ''}
                        </Label>
                        {context.journalDays.length === 0 ? (
                          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                            <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                            Aucun jour dans le journal. Générez les jours depuis l’onglet Journal
                            quotidien.
                          </div>
                        ) : (
                          <Select value={dayId || undefined} onValueChange={setDayId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir un jour" />
                            </SelectTrigger>
                            <SelectContent>
                              {context.journalDays.map((d) => (
                                <SelectItem key={d.id} value={d.id}>
                                  {formatDayLabel(d.dayDate)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      </div>

                      {needsSlot ? (
                        <div className="space-y-2">
                          <Label>Créneau *</Label>
                          <Select value={slot || undefined} onValueChange={(v) => setSlot(v as SlotKey)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Matin ou après-midi" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MORNING">{SUIVI_DAY_SLOT_LABELS.MORNING}</SelectItem>
                              <SelectItem value="EVENING">{SUIVI_DAY_SLOT_LABELS.EVENING}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="doc-title">Libellé archivé *</Label>
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(e) => {
                        setTitleTouched(true);
                        setTitle(e.target.value);
                      }}
                      placeholder="Intitulé visible dans le dossier session"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="doc-notes">Notes / référence contrôle</Label>
                    <Textarea
                      id="doc-notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="N° dossier financeur, demande DGEFP, remarques…"
                    />
                  </div>

                  {category === 'archives' ? (
                    <div className="flex items-start gap-2 rounded-md border border-border/60 px-3 py-2">
                      <Checkbox
                        id="legal-hold"
                        checked={legalHold}
                        onCheckedChange={(v) => setLegalHold(v === true)}
                      />
                      <Label htmlFor="legal-hold" className="cursor-pointer text-sm font-normal leading-snug">
                        Figé pour conformité (legal hold) — conservation longue durée, visible en
                        gouvernance des données.
                      </Label>
                    </div>
                  ) : null}

                  <div className="space-y-2">
                    <Label>Fichier *</Label>
                    <div
                      className={cn(
                        'group relative flex min-h-[140px] cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 transition-colors',
                        dragOver
                          ? 'border-primary bg-primary/5'
                          : 'border-border/60 hover:border-primary/40 hover:bg-muted/20',
                        file && 'border-solid border-primary/30 bg-primary/5',
                      )}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOver(true);
                      }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        pickFile(e.dataTransfer.files?.[0] ?? null);
                      }}
                      onClick={() => document.getElementById('suivi-deposit-file')?.click()}
                    >
                      <input
                        id="suivi-deposit-file"
                        type="file"
                        className="hidden"
                        accept={ACCEPT}
                        onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                      />
                      {file ? (
                        <>
                          <FileText className="size-8 text-primary" />
                          <p className="text-center text-sm font-medium">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(file.size / 1024).toFixed(1)} Ko — cliquer pour remplacer
                          </p>
                        </>
                      ) : (
                        <>
                          <CloudUpload className="size-8 text-muted-foreground group-hover:text-primary/70" />
                          <p className="text-sm font-medium">Glisser-déposer ou parcourir</p>
                          <p className="text-xs text-muted-foreground">
                            PDF, images (scan signé), CSV ou Excel
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {validationError && file ? (
                    <p className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="size-3.5" />
                      {validationError}
                    </p>
                  ) : null}
                </div>
              </div>
            </ScrollArea>
          )}
        </SheetBody>

        <SheetFooter className="border-t border-border/60 px-6 py-4 sm:flex-row sm:justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            type="button"
            variant="primary"
            className="gap-2"
            disabled={!file || Boolean(validationError) || depositMutation.isPending}
            onClick={() => depositMutation.mutate()}
          >
            {depositMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <CloudUpload className="size-4" />
            )}
            Archiver dans le dossier session
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
