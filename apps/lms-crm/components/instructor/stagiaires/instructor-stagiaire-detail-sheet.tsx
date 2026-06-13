'use client';

import { useEffect, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  MapPin,
  Phone,
  User,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_STAGIAIRE_DETAIL_API } from '@/lib/instructor/instructor-paths';
import type { InstructorTraineeDetail } from '@/lib/instructor/instructor-types';
import { UserAvatar } from '@/components/common/user-avatar';
import { portalLabel, portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | null;
  userId: string | null;
};

export function InstructorStagiaireDetailSheet({ open, onOpenChange, sessionId, userId }: Props) {
  const [detail, setDetail] = useState<InstructorTraineeDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sessionId || !userId) {
      setDetail(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await apiFetch(
          `${INSTRUCTOR_STAGIAIRE_DETAIL_API}?sessionId=${sessionId}&userId=${userId}`,
        );
        const json = (await res.json()) as {
          success?: boolean;
          data?: InstructorTraineeDetail;
          error?: { message?: string };
        };
        if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
        if (!cancelled) setDetail(json.data ?? null);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sessionId, userId]);

  const displayName =
    detail?.user.name ??
    [detail?.user.firstName, detail?.user.lastName].filter(Boolean).join(' ') ??
    'Stagiaire';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="text-left text-base">Fiche stagiaire</SheetTitle>
        </SheetHeader>

        <SheetBody className="min-h-0 flex-1 overflow-hidden p-0">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-20 text-[13px] text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Chargement…
            </div>
          ) : error ? (
            <p className="p-5 text-[13px] text-destructive">{error}</p>
          ) : detail ? (
            <ScrollArea className="h-full max-h-[calc(100vh-8rem)]">
              <div className="space-y-5 p-5">
                <div className="flex items-start gap-3">
                  <UserAvatar
                    avatar={detail.user.avatar}
                    className="size-12 rounded-full border"
                    fallback="/media/avatars/300-2.png"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className={portalSectionTitle}>{displayName}</h2>
                    <p className={cn('mt-0.5 flex items-center gap-1', portalMuted)}>
                      <Mail className="size-3.5" />
                      {detail.user.email}
                    </p>
                    {detail.user.phone ? (
                      <p className={cn('mt-0.5 flex items-center gap-1', portalMuted)}>
                        <Phone className="size-3.5" />
                        {detail.user.phone}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="secondary" appearance="light" size="sm">
                    {detail.enrollmentStatus}
                  </Badge>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-[13px]">
                  <p className={portalLabel}>Session (source de vérité)</p>
                  <p className="mt-1 font-medium">{detail.formationName}</p>
                  <p className={cn('mt-0.5', portalMuted)}>{detail.sessionLabel}</p>
                  <p className={cn('mt-0.5 flex items-center gap-1', portalMuted)}>
                    <MapPin className="size-3.5" />
                    {detail.location}
                  </p>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <span className={portalSectionTitle}>Progression e-formation</span>
                    <span className="text-[13px] font-semibold">{detail.progressPercent} %</span>
                  </div>
                  <Progress value={detail.progressPercent} className="h-2" />
                  <p className={cn('mt-1.5', portalMuted)}>
                    {detail.completedChapters}/{detail.totalChapters} UV · {detail.eFormationNote}
                  </p>
                </div>

                {detail.candidature ? (
                  <div className="grid grid-cols-2 gap-3 text-[13px]">
                    <div>
                      <p className={portalLabel}>Dossier candidat</p>
                      <p className="mt-1 font-medium">{detail.candidature.status}</p>
                    </div>
                    {detail.candidature.cnapsReference ? (
                      <div>
                        <p className={portalLabel}>Réf. CNAPS</p>
                        <p className="mt-1 font-medium">{detail.candidature.cnapsReference}</p>
                      </div>
                    ) : null}
                  </div>
                ) : null}

                <Tabs defaultValue="uv" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="uv" className="text-[13px]">
                      UV / modules
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="text-[13px]">
                      Quiz
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="uv" className="mt-3 space-y-2">
                    {detail.chapters.length === 0 ? (
                      <p className={portalMuted}>Pas de parcours LMS lié.</p>
                    ) : (
                      detail.chapters.map((ch) => (
                        <div
                          key={ch.chapterId}
                          className="flex items-start gap-2 rounded-md border px-3 py-2 text-[13px]"
                        >
                          {ch.completed ? (
                            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                          ) : (
                            <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                          )}
                          <div className="min-w-0">
                            <p className="font-medium">UV {ch.position} — {ch.title}</p>
                            {ch.completedAt ? (
                              <p className={cn('mt-0.5', portalMuted)}>
                                Terminé le {formatPortalDate(ch.completedAt)}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                  <TabsContent value="quiz" className="mt-3 space-y-2">
                    {detail.quizzes.length === 0 ? (
                      <p className={portalMuted}>Aucun quiz sur ce parcours.</p>
                    ) : (
                      detail.quizzes.map((q) => (
                        <div
                          key={q.activityId}
                          className="flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-[13px]"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{q.name}</p>
                            <p className={cn('mt-0.5 flex items-center gap-1', portalMuted)}>
                              <BookOpen className="size-3.5" />
                              {q.chapterTitle}
                            </p>
                          </div>
                          <div className="shrink-0 text-end">
                            {q.passed ? (
                              <Badge variant="success" appearance="light" size="sm">
                                {q.bestScore ?? '—'} %
                              </Badge>
                            ) : (
                              <Badge variant="secondary" appearance="light" size="sm">
                                Non validé
                              </Badge>
                            )}
                            <p className={cn('mt-1', portalMuted)}>{q.attemptCount} tentative(s)</p>
                          </div>
                        </div>
                      ))
                    )}
                  </TabsContent>
                </Tabs>

                {(detail.user.birthDate || detail.user.city) && (
                  <div className="rounded-lg border border-dashed p-3">
                    <p className={cn('flex items-center gap-1.5', portalSectionTitle)}>
                      <User className="size-4" />
                      Identité
                    </p>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-[13px]">
                      {detail.user.birthDate ? (
                        <>
                          <dt className={portalLabel}>Naissance</dt>
                          <dd>{formatPortalDate(detail.user.birthDate)}</dd>
                        </>
                      ) : null}
                      {detail.user.city ? (
                        <>
                          <dt className={portalLabel}>Ville</dt>
                          <dd>
                            {detail.user.postalCode ? `${detail.user.postalCode} ` : ''}
                            {detail.user.city}
                          </dd>
                        </>
                      ) : null}
                    </dl>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </SheetBody>

        <SheetFooter className="border-t px-5 py-3">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fermer
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
