'use client';

import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, getAvatarUrl, getInitials } from '@/lib/helpers';
import { apiFetch } from '@/lib/api';
import { VIE_SCOLAIRE_SHEET_LARGE } from '../../../vie-scolaire/constants/sheet-shell-classes';
import { SuiviStagiaireFundingTab } from './suivi-stagiaire-funding-tab';
import {
  SUIVI_DAY_SLOT_LABELS,
  SUIVI_EMARGEMENT_STATUS_LABELS,
  SUIVI_ENROLLMENT_STATUS_LABELS,
  SUIVI_EXAM_OUTCOME_LABELS,
  type SuiviParticipantLearningPayload,
  type SuiviPresenceHistoryRow,
  type SuiviStagiaireRow,
} from '../types/suivi-formations-api';

function formatPresenceDay(iso: string) {
  try {
    return format(parseISO(iso), 'EEE d MMM yyyy', { locale: fr });
  } catch {
    return iso;
  }
}

function PresenceTab({
  sessionId,
  participantId,
}: {
  sessionId: string | null;
  participantId: string;
}) {
  const { data, isLoading, error } = useQuery({
    queryKey: [
      'gestion-academique',
      'vie-scolaire',
      'suivi-formations',
      'presence',
      sessionId,
      participantId,
    ],
    queryFn: async (): Promise<SuiviPresenceHistoryRow[]> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants/${participantId}/presence`,
      );
      if (!res.ok) throw new Error('Historique présence indisponible.');
      const j = await res.json();
      return (j?.data?.items ?? []) as SuiviPresenceHistoryRow[];
    },
    enabled: Boolean(sessionId && participantId),
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        {(error as Error).message}
      </div>
    );
  }

  const items = data ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 bg-muted/20 p-8 m-6 text-center text-sm text-muted-foreground">
        Aucun émargement enregistré pour ce stagiaire.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="overflow-hidden rounded-lg border border-border/60">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-4 py-2 text-left font-medium">Jour</th>
              <th className="px-4 py-2 text-left font-medium">Créneau</th>
              <th className="px-4 py-2 text-left font-medium">Statut</th>
              <th className="px-4 py-2 text-left font-medium">Horodatage</th>
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={`${row.dayId}-${row.slot}`} className="border-t border-border/50">
                <td className="px-4 py-3 capitalize">{formatPresenceDay(row.dayDate)}</td>
                <td className="px-4 py-3">{SUIVI_DAY_SLOT_LABELS[row.slot]}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" appearance="outline">
                    {SUIVI_EMARGEMENT_STATUS_LABELS[row.status] ?? row.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {row.markedAt ? formatDateTime(row.markedAt) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function useParticipantLearning(
  sessionId: string | null,
  participantId: string,
  enabled: boolean,
) {
  return useQuery({
    queryKey: [
      'gestion-academique',
      'vie-scolaire',
      'suivi-formations',
      'learning',
      sessionId,
      participantId,
    ],
    queryFn: async (): Promise<SuiviParticipantLearningPayload> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/participants/${participantId}/learning`,
      );
      if (!res.ok) throw new Error('Progression indisponible.');
      const j = await res.json();
      return j.data as SuiviParticipantLearningPayload;
    },
    enabled: enabled && Boolean(sessionId && participantId),
  });
}

function ElearningTab({
  sessionId,
  participantId,
  open,
  fallback,
}: {
  sessionId: string | null;
  participantId: string;
  open: boolean;
  fallback: SuiviStagiaireRow;
}) {
  const { data, isLoading, error } = useParticipantLearning(sessionId, participantId, open);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>;
  }

  const detail = data ?? {
    progressPercent: fallback.progressPercent,
    completedChapters: fallback.completedChapters,
    totalChapters: fallback.totalChapters,
    quizPassed: fallback.quizPassed,
    quizTotal: fallback.quizTotal,
    lastActivityAt: fallback.lastActivityAt,
    chapters: [],
    quizzes: [],
  };

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-lg border border-border/60 p-4">
        <p className="text-sm font-medium">Modules complétés</p>
        <p className="mt-1 text-2xl font-semibold">
          {detail.completedChapters}
          <span className="text-base font-normal text-muted-foreground">
            {' '}
            / {detail.totalChapters} UV
          </span>
        </p>
        <Progress value={detail.progressPercent} className="mt-3 h-2" />
      </div>

      {detail.chapters.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">UV</th>
                <th className="px-4 py-2 text-left font-medium">Titre</th>
                <th className="px-4 py-2 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {detail.chapters.map((ch) => (
                <tr key={ch.chapterId} className="border-t border-border/50">
                  <td className="px-4 py-3">{ch.position}</td>
                  <td className="px-4 py-3">{ch.title}</td>
                  <td className="px-4 py-3">
                    <Badge variant={ch.completed ? 'success' : 'secondary'} appearance="outline">
                      {ch.completed ? 'Complété' : 'En cours'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun module e-learning publié pour cette formation.</p>
      )}
    </div>
  );
}

function QuizTab({
  sessionId,
  participantId,
  open,
  fallback,
}: {
  sessionId: string | null;
  participantId: string;
  open: boolean;
  fallback: SuiviStagiaireRow;
}) {
  const { data, isLoading, error } = useParticipantLearning(sessionId, participantId, open);

  if (isLoading) {
    return (
      <div className="space-y-3 p-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (error) {
    return <div className="p-6 text-sm text-destructive">{(error as Error).message}</div>;
  }

  const detail = data ?? {
    progressPercent: fallback.progressPercent,
    completedChapters: fallback.completedChapters,
    totalChapters: fallback.totalChapters,
    quizPassed: fallback.quizPassed,
    quizTotal: fallback.quizTotal,
    lastActivityAt: fallback.lastActivityAt,
    chapters: [],
    quizzes: [],
  };

  return (
    <div className="space-y-4 p-6">
      <div className="rounded-lg border border-border/60 p-4">
        <p className="text-sm font-medium">Quiz réussis</p>
        <p className="mt-1 text-2xl font-semibold">
          {detail.quizPassed}
          <span className="text-base font-normal text-muted-foreground">
            {' '}
            / {detail.quizTotal}
          </span>
        </p>
      </div>

      {detail.quizzes.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border/60">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-4 py-2 text-left font-medium">Quiz</th>
                <th className="px-4 py-2 text-left font-medium">UV</th>
                <th className="px-4 py-2 text-left font-medium">Score</th>
                <th className="px-4 py-2 text-left font-medium">Statut</th>
              </tr>
            </thead>
            <tbody>
              {detail.quizzes.map((q) => (
                <tr key={q.activityId} className="border-t border-border/50">
                  <td className="px-4 py-3">{q.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{q.chapterTitle}</td>
                  <td className="px-4 py-3">{q.bestScore ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={q.passed ? 'success' : 'secondary'} appearance="outline">
                      {q.passed ? 'Validé' : 'Non validé'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Aucun quiz publié pour cette formation.</p>
      )}
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/60 bg-muted/20 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function SuiviStagiaireDetailsSheet({
  open,
  onOpenChange,
  stagiaire,
  sessionId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stagiaire: SuiviStagiaireRow | null;
  sessionId: string | null;
}) {
  if (!stagiaire) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={VIE_SCOLAIRE_SHEET_LARGE}>
        <SheetHeader className="border-b border-border/60 px-6 py-5">
          <div className="flex items-start gap-4">
            <Avatar className="size-14">
              <AvatarImage src={getAvatarUrl(stagiaire.avatar)} alt={stagiaire.name ?? stagiaire.email} />
              <AvatarFallback>{getInitials(stagiaire.name ?? stagiaire.email)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-left">{stagiaire.name ?? stagiaire.email}</SheetTitle>
              <SheetDescription className="text-left">
                Progression LMS, historique de présence et financement du stagiaire.
              </SheetDescription>
              <p className="text-sm text-muted-foreground">{stagiaire.email}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge variant="secondary" appearance="outline">
                  {SUIVI_ENROLLMENT_STATUS_LABELS[stagiaire.enrollmentStatus] ??
                    stagiaire.enrollmentStatus}
                </Badge>
                <Badge
                  variant={stagiaire.examOutcome === 'PASSED' ? 'success' : 'secondary'}
                  appearance="outline"
                >
                  {SUIVI_EXAM_OUTCOME_LABELS[stagiaire.examOutcome] ?? stagiaire.examOutcome}
                </Badge>
                <Badge variant="secondary" appearance="outline">
                  {stagiaire.fundingModeLabel}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <SheetBody className="min-h-0 flex-1 overflow-hidden px-0 py-0">
          <Tabs defaultValue="synthese" className="flex h-full min-h-0 flex-col">
            <div className="border-b border-border/60 px-6">
              <TabsList className="h-auto w-full justify-start gap-1 bg-transparent p-0 flex-wrap">
                <TabsTrigger value="synthese">Synthèse</TabsTrigger>
                <TabsTrigger value="financeur">Financeur</TabsTrigger>
                <TabsTrigger value="presence">Présence</TabsTrigger>
                <TabsTrigger value="elearning">E-learning</TabsTrigger>
                <TabsTrigger value="quiz">Quiz</TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="min-h-0 flex-1">
              <TabsContent value="synthese" className="mt-0 space-y-5 p-6">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <StatBlock label="Financeur" value={stagiaire.fundingModeLabel} />
                  <StatBlock
                    label="Progression e-learning"
                    value={`${stagiaire.progressPercent} %`}
                  />
                  <StatBlock
                    label="Quiz validés"
                    value={`${stagiaire.quizPassed}/${stagiaire.quizTotal}`}
                  />
                  <StatBlock
                    label="Dernière activité"
                    value={
                      stagiaire.lastActivityAt ? formatDateTime(stagiaire.lastActivityAt) : '—'
                    }
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Avancement parcours</span>
                    <span className="text-muted-foreground">{stagiaire.progressPercent} %</span>
                  </div>
                  <Progress value={stagiaire.progressPercent} className="h-2" />
                </div>

                {stagiaire.phone ? (
                  <p className="text-sm text-muted-foreground">
                    Téléphone : <span className="text-foreground">{stagiaire.phone}</span>
                  </p>
                ) : null}

                {sessionId ? (
                  <p className="text-xs text-muted-foreground">
                    Session : {sessionId.slice(0, 8)}…
                  </p>
                ) : null}
              </TabsContent>

              <TabsContent value="financeur" className="mt-0">
                <SuiviStagiaireFundingTab
                  sessionId={sessionId}
                  participantId={stagiaire.participantId}
                  initialFunding={stagiaire}
                />
              </TabsContent>

              <TabsContent value="presence" className="mt-0">
                <PresenceTab
                  sessionId={sessionId}
                  participantId={stagiaire.participantId}
                />
              </TabsContent>

              <TabsContent value="elearning" className="mt-0">
                <ElearningTab
                  sessionId={sessionId}
                  participantId={stagiaire.participantId}
                  open={open}
                  fallback={stagiaire}
                />
              </TabsContent>

              <TabsContent value="quiz" className="mt-0">
                <QuizTab
                  sessionId={sessionId}
                  participantId={stagiaire.participantId}
                  open={open}
                  fallback={stagiaire}
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
