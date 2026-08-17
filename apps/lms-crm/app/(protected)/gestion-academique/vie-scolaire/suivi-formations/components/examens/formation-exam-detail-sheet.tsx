'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CloudUpload,
  ExternalLink,
  FileText,
  FolderOpen,
  Loader2,
  Package,
  Save,
  Users,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { formatDateTime, getAvatarUrl } from '@/lib/helpers';
import {
  formationExamOutcomeBadgeVariant,
  formationExamOutcomeLabelI18n,
  formationExamStatusLabel,
} from '@/lib/vie-scolaire/formation-exam-labels';
import type {
  ExamArchivedDocumentSummary,
  FormationExamDetailResponse,
} from '@/lib/vie-scolaire/formation-exam-detail-loader';
import { FormationExamContextPanel } from './formation-exam-context-panel';
import { SessionEquipmentDispatchGuide } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/components/session-equipment-dispatch-guide';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../constants/sheet-shell-classes';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

const STATUS_OPTIONS = ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const OUTCOME_OPTIONS = ['PENDING', 'PASSED', 'FAILED', 'ABSENT'] as const;

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function examTitle(exam: FormationExamDetailResponse) {
  const formation = exam.session.formation?.name ?? 'Formation';
  if (exam.scheduledAt) {
    try {
      const d = format(parseISO(exam.scheduledAt), 'd MMMM yyyy', { locale: fr });
      return `Examen — ${formation} · ${d}`;
    } catch {
      /* fallthrough */
    }
  }
  return `Examen — ${formation}`;
}

export function FormationExamDetailSheet({
  examId,
  open,
  onOpenChange,
  initialTab = 'documents',
}: {
  examId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialTab?: string;
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [juryPresident, setJuryPresident] = useState('');
  const [juryMembersText, setJuryMembersText] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState('PLANNED');

  const { data: exam, isLoading } = useQuery({
    queryKey: ['vie-scolaire', 'formation-exams', examId, 'detail'],
    enabled: open && Boolean(examId),
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data.item as FormationExamDetailResponse;
    },
  });

  useEffect(() => {
    if (!exam) return;
    setJuryPresident(exam.juryPresidentName ?? '');
    setJuryMembersText((exam.juryMemberNames ?? []).join('\n'));
    setNotes(exam.notes ?? '');
    setStatus(exam.status);
  }, [exam]);

  useEffect(() => {
    if (!open) setActiveTab('documents');
  }, [open]);

  useEffect(() => {
    if (open) setActiveTab(initialTab);
  }, [open, initialTab, examId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!examId) throw new Error('Examen non sélectionné');
      const juryMemberNames = juryMembersText
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status,
            juryPresidentName: juryPresident.trim() || null,
            juryMemberNames,
            notes: notes.trim() || null,
          }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Enregistrement impossible');
      return body.data.item as FormationExamDetailResponse;
    },
    onSuccess: () => {
      toast.success(t('vieScolaire.examens.sheetSaved'));
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const outcomeMutation = useMutation({
    mutationFn: async ({ participantId, examOutcome }: { participantId: string; examOutcome: string }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens/${participantId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examOutcome, examDate: new Date().toISOString() }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message ?? body.error ?? 'Mise à jour impossible');
      return body.data;
    },
    onSuccess: (_data, variables) => {
      toast.success(
        variables.examOutcome === 'PASSED'
          ? t('vieScolaire.examens.examResultPassedAuto')
          : t('academic.examResultSaved'),
      );
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams', examId, 'detail'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const openPdf = (docType: string) => {
    if (!examId) return;
    window.open(
      `/api/sections/gestion-academique/vie-scolaire/formation-exams/${examId}/pdf/${docType}`,
      '_blank',
      'noopener,noreferrer',
    );
    window.setTimeout(() => {
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'formation-exams', examId, 'detail'] });
    }, 2500);
  };

  const archivedByType = useMemo(() => {
    if (!exam?.archivedDocuments) return new Map<string, ExamArchivedDocumentSummary>();
    return new Map(exam.archivedDocuments.map((d) => [d.docType, d]));
  }, [exam?.archivedDocuments]);

  const suiviDocumentsHref = exam
    ? `/gestion-academique/vie-scolaire/suivi-formations`
    : '#';

  const sessionEditHref = exam
    ? `/gestion-academique/vie-scolaire/sessions?highlight=${exam.session.id}`
    : '#';

  const dispatchEquipmentIds = useMemo(() => {
    if (!exam) return [];
    return exam.session.examReservedEquipmentIds ?? [];
  }, [exam]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="shrink-0 border-b border-border/60 px-6 py-5">
          <SheetTitle className="text-left text-base sm:text-lg">
            {exam ? examTitle(exam) : 'Fiche examen'}
          </SheetTitle>
          <SheetDescription className="text-left">
            {exam
              ? `${exam.session.dateDisplayLabel} — documents officiels, jury, candidats et matériel plateau.`
              : 'Organisation examen présentiel, impressions PDF et saisie des résultats.'}
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="flex min-h-0 flex-1 flex-col overflow-hidden px-0 py-0">
          {isLoading || !exam ? (
            <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Chargement de la fiche examen…
            </div>
          ) : (
            <ScrollArea className="min-h-0 flex-1">
              <div className="pb-6">
                <div className="space-y-4 border-b border-border/60 px-6 py-4">
                  <FormationExamContextPanel exam={exam} />
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col">
                  <div className="sticky top-0 z-10 border-b border-border/60 bg-background px-6 py-4">
                    <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
                      <TabsTrigger value="documents">Documents & PDF</TabsTrigger>
                      <TabsTrigger value="candidats">Candidats & résultats</TabsTrigger>
                      <TabsTrigger value="jury">Jury & organisation</TabsTrigger>
                      <TabsTrigger value="materiel">Matériel plateau</TabsTrigger>
                    </TabsList>
                  </div>

                  <TabsContent value="documents" className="mt-0 space-y-5 p-6">
                    <div>
                      <p className="text-sm font-medium">Documents officiels examen</p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Génération à la volée et archivage automatique dans le dossier session (suivi,
                        examen, certification). Les convocations regroupent tous les stagiaires confirmés
                        dans un seul PDF — une page par personne.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      {exam.officialDocuments.map((doc) => {
                        const archived = archivedByType.get(doc.type);
                        return (
                        <div
                          key={doc.type}
                          className="flex flex-col gap-3 rounded-xl border border-border/70 bg-muted/15 p-4"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background">
                              <FileText className="size-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-foreground">{doc.label}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                                {doc.description}
                              </p>
                              {archived ? (
                                <p className="mt-2 text-[11px] text-muted-foreground">
                                  Archivé le {formatDateTime(archived.createdAt)}
                                  {archived.createdByName ? ` · ${archived.createdByName}` : ''}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => openPdf(doc.type)}
                            >
                              <FileText className="size-4" />
                              Générer & archiver
                            </Button>
                            {archived?.url ? (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="w-full gap-2"
                                asChild
                              >
                                <a href={archived.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="size-4" />
                                  Dernière version
                                </a>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                        );
                      })}
                    </div>

                    <div className="rounded-xl border border-border/70 bg-background p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">Dossier session — archives centralisées</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Émargements journal, PDF examen et pièces certification sont regroupés dans le
                            suivi de la session {exam.session.dateDisplayLabel}.
                          </p>
                        </div>
                        <Button type="button" variant="outline" className="gap-2 shrink-0" asChild>
                          <a href={suiviDocumentsHref}>
                            <FolderOpen className="size-4" />
                            Ouvrir suivi documents
                          </a>
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-dashed border-border bg-muted/10 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">Émargement signé (archivage)</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Après l&apos;examen, scannez la feuille d&apos;émargement signée par les candidats.
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          className="gap-2 shrink-0"
                          onClick={() =>
                            toast.info(
                              'Déposez le scan signé depuis Suivi formations → Documents (catégorie Émargement ou Examen).',
                            )
                          }
                        >
                          <CloudUpload className="size-4" />
                          Déposer scan signé
                        </Button>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="candidats" className="mt-0 p-6">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">Candidats inscrits à l&apos;examen</p>
                        <p className="text-xs text-muted-foreground">
                          {t('vieScolaire.examens.outcomeEntryHint')}
                        </p>
                      </div>
                      <Badge variant="secondary" appearance="outline">
                        <Users className="size-3 mr-1" />
                        {exam.participantCount} inscrit(s)
                      </Badge>
                    </div>

                    <div className="overflow-hidden rounded-lg border border-border/60">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/40">
                          <tr>
                            <th className="w-12 px-3 py-2" />
                            <th className="px-4 py-2 text-left font-medium">Candidat</th>
                            <th className="px-4 py-2 text-left font-medium">Résultat</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exam.participants.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-4 py-8 text-center text-xs text-muted-foreground">
                                Aucun candidat avec dossier validé. Inscrivez des stagiaires depuis la session.
                              </td>
                            </tr>
                          ) : (
                            exam.participants.map((p) => {
                              const name =
                                p.user.name ||
                                [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
                                p.user.email;
                              return (
                                <tr key={p.id} className="border-t border-border/50">
                                  <td className="px-3 py-3">
                                    <Avatar className="size-9">
                                      <AvatarImage src={getAvatarUrl(p.user.avatar)} alt={name} />
                                      <AvatarFallback className="text-xs">
                                        {initialsFromName(name)}
                                      </AvatarFallback>
                                    </Avatar>
                                  </td>
                                  <td className="px-4 py-3">
                                    <p className="font-medium">{name}</p>
                                    <p className="text-xs text-muted-foreground">{p.user.email}</p>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Select
                                      value={p.examOutcome}
                                      onValueChange={(value) =>
                                        outcomeMutation.mutate({ participantId: p.id, examOutcome: value })
                                      }
                                      disabled={outcomeMutation.isPending}
                                    >
                                      <SelectTrigger className="h-9 w-full min-w-[140px] max-w-[180px]">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {OUTCOME_OPTIONS.map((value) => (
                                          <SelectItem key={value} value={value}>
                                            {formationExamOutcomeLabelI18n(t, value)}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>

                  <TabsContent value="jury" className="mt-0 space-y-5 p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="exam-status">Statut examen</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger id="exam-status">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((v) => (
                              <SelectItem key={v} value={v}>
                                {formationExamStatusLabel(v)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="jury-president">Président du jury</Label>
                        <Input
                          id="jury-president"
                          value={juryPresident}
                          onChange={(e) => setJuryPresident(e.target.value)}
                          placeholder="Nom du président (jury externe CNAPS…)"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="jury-members">Membres du jury (un par ligne)</Label>
                      <Textarea
                        id="jury-members"
                        value={juryMembersText}
                        onChange={(e) => setJuryMembersText(e.target.value)}
                        rows={4}
                        placeholder="Assesseur 1&#10;Assesseur 2&#10;Représentant entreprise…"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exam-notes">Notes organisation & consignes jour J</Label>
                      <Textarea
                        id="exam-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        placeholder="Horaires QCM / pratique, accueil jury, consignes PCS…"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="materiel" className="mt-0 space-y-5 p-6">
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <Package className="size-4" />
                        Matériel pédagogique examen
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        Install fixe PCS / plateau (VSS, SSI, radio PTI…) + matériel mobile réservé sur la session
                        (magnétomètre, fumigènes…). Modifiez la session pour ajuster salle et réservations.
                      </p>
                    </div>

                    <SessionEquipmentDispatchGuide
                      formationId={exam.session.formation?.id ?? null}
                      venueRoomId={exam.session.examVenueRoomId}
                      examVenueRoomId={exam.session.examVenueRoomId}
                      hasExamDate={Boolean(exam.scheduledAt)}
                      sessionKind={exam.session.sessionKind}
                      selectedEquipmentIds={dispatchEquipmentIds}
                    />

                    {exam.examEquipment.length > 0 ? (
                      <div className="rounded-lg border border-border divide-y">
                        {exam.examEquipment.map((eq) => (
                          <div key={eq.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                            <span className="font-medium">{eq.name}</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {eq.serialNumber ?? eq.type ?? '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground rounded-lg border border-dashed p-3">
                        Aucun matériel mobile réservé pour l&apos;examen — configurez depuis la fiche session (onglet
                        Équipement).
                      </p>
                    )}

                    <div className="rounded-lg border border-border/60 bg-muted/20 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                        Référentiel réglementaire (extrait)
                      </p>
                      <ul className="space-y-1.5 text-xs text-muted-foreground">
                        {exam.pedagogicalChecklist.map((item) => (
                          <li key={item.label} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>
                              {item.label}
                              {item.regulatoryRef ? (
                                <span className="block text-[10px] opacity-80">{item.regulatoryRef}</span>
                              ) : null}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </ScrollArea>
          )}
        </SheetBody>

        <SheetFooter className="shrink-0 flex-row flex-wrap gap-2 border-t border-border/60 px-6 py-4 sm:justify-between">
          <Button variant="ghost" type="button" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Button type="button" variant="outline" className="gap-2" asChild disabled={!exam}>
              <a href={sessionEditHref}>
                <ExternalLink className="size-4" />
                Modifier session
              </a>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!examId}
              onClick={() => openPdf('emargement')}
            >
              <FileText className="size-4" />
              PDF émargement
            </Button>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!examId}
              onClick={() => openPdf('convocation')}
            >
              <FileText className="size-4" />
              Convocations
            </Button>
            <Button
              type="button"
              variant="primary"
              className="gap-2"
              disabled={saveMutation.isPending || !examId}
              onClick={() => saveMutation.mutate()}
            >
              {saveMutation.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Enregistrer
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
