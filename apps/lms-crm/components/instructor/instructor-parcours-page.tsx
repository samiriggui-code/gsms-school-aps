'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  GripVertical,
  Loader2,
  Save,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  INSTRUCTOR_COURSES_API,
  instructorCourseApi,
  instructorCoursePreviewApi,
} from '@/lib/instructor/instructor-paths';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { Input } from '@repo/ui/input';
import { Label } from '@repo/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';
import { Switch } from '@repo/ui/switch';
import { Textarea } from '@repo/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { InstructorCoursePreview } from './parcours/instructor-course-preview';
import { InstructorQuizBankPicker } from './parcours/instructor-quiz-bank-picker';
import { ModuleKpiStatsRow } from '@/components/common/module-kpi-stats-row';
import { instructorParcoursKpis } from '@/lib/instructor/instructor-kpi-stats';

type ReviewStatus = 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';

function reviewBadgeVariant(status: ReviewStatus): 'success' | 'warning' | 'destructive' | 'secondary' {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING_REVIEW':
      return 'warning';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function reviewLabel(status: ReviewStatus): string {
  switch (status) {
    case 'PENDING_REVIEW':
      return 'En validation';
    case 'APPROVED':
      return 'Validé';
    case 'REJECTED':
      return 'Refusé';
    default:
      return 'Brouillon';
  }
}

type CourseListRow = {
  id: string;
  title: string;
  formationName: string;
  chapterCount: number;
  activityCount: number;
};

type Activity = {
  id: string;
  name: string;
  subType: string;
  position: number;
  isPublished: boolean;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  content: unknown;
  details: unknown;
};

type Chapter = {
  id: string;
  title: string;
  position: number;
  isPublished: boolean;
  isFree: boolean;
  reviewStatus: ReviewStatus;
  reviewNote: string | null;
  muxPlaybackId: string | null;
  muxAssetId: string | null;
  activities: Activity[];
};

type CourseBuilder = {
  id: string;
  title: string;
  chapters: Chapter[];
};

function subTypeLabel(subType: string) {
  switch (subType) {
    case 'DYNAMIC_MARKDOWN':
      return 'Markdown';
    case 'VIDEO_YOUTUBE':
      return 'YouTube';
    case 'VIDEO_HOSTED':
      return 'Mux / hébergé';
    case 'QUIZ_MULTIPLE_CHOICE':
      return 'Quiz QCM';
    default:
      return subType;
  }
}

function parseMarkdown(content: unknown): string {
  if (content && typeof content === 'object' && 'markdown' in content) {
    const md = (content as { markdown?: unknown }).markdown;
    return typeof md === 'string' ? md : '';
  }
  return '';
}

function parseYoutube(content: unknown): { youtubeId: string; caption: string } {
  if (!content || typeof content !== 'object') return { youtubeId: '', caption: '' };
  const c = content as Record<string, unknown>;
  return {
    youtubeId: typeof c.youtubeId === 'string' ? c.youtubeId : '',
    caption: typeof c.caption === 'string' ? c.caption : '',
  };
}

type QuizQuestionForm = {
  id: string;
  prompt: string;
  choices: string;
  correctIndex: number;
};

function parseQuizForms(content: unknown, details: unknown): {
  passScore: number;
  questions: QuizQuestionForm[];
} {
  const c = content && typeof content === 'object' ? (content as Record<string, unknown>) : {};
  const d = details && typeof details === 'object' ? (details as Record<string, unknown>) : {};
  const passScore = typeof c.passScore === 'number' ? c.passScore : 50;
  const contentQs = Array.isArray(c.questions) ? c.questions : [];
  const detailQs = Array.isArray(d.questions) ? d.questions : [];
  const correctById = new Map<string, number>();
  for (const item of detailQs) {
    if (item && typeof item === 'object') {
      const o = item as Record<string, unknown>;
      if (typeof o.id === 'string' && typeof o.correctIndex === 'number') {
        correctById.set(o.id, o.correctIndex);
      }
    }
  }
  const questions: QuizQuestionForm[] = contentQs.map((item, i) => {
    const o = item && typeof item === 'object' ? (item as Record<string, unknown>) : {};
    const id = typeof o.id === 'string' ? o.id : `q${i + 1}`;
    const choices = Array.isArray(o.choices)
      ? o.choices.filter((x): x is string => typeof x === 'string').join('\n')
      : '';
    return {
      id,
      prompt: typeof o.prompt === 'string' ? o.prompt : '',
      choices,
      correctIndex: correctById.get(id) ?? 0,
    };
  });
  return { passScore, questions };
}

function buildQuizPayload(questions: QuizQuestionForm[], passScore: number) {
  const parsed = questions
    .map((q, i) => ({
      id: q.id.trim() || `q${i + 1}`,
      prompt: q.prompt.trim(),
      choices: q.choices
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      correctIndex: q.correctIndex,
    }))
    .filter((q) => q.prompt && q.choices.length >= 2);

  return {
    content: {
      passScore,
      questions: parsed.map(({ id, prompt, choices }) => ({ id, prompt, choices })),
    },
    details: {
      questions: parsed.map(({ id, correctIndex }) => ({ id, correctIndex })),
    },
  };
}

export function InstructorParcoursPage() {
  const qc = useQueryClient();
  const [courseId, setCourseId] = useState<string>('');
  const [chapterId, setChapterId] = useState<string>('');
  const [activityId, setActivityId] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);

  const [markdown, setMarkdown] = useState('');
  const [youtubeId, setYoutubeId] = useState('');
  const [youtubeCaption, setYoutubeCaption] = useState('');
  const [passScore, setPassScore] = useState(50);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionForm[]>([]);
  const [activityName, setActivityName] = useState('');
  const [activityPublished, setActivityPublished] = useState(true);
  const [muxAssetId, setMuxAssetId] = useState('');
  const [muxPlaybackId, setMuxPlaybackId] = useState('');
  const [contentReviewRequired, setContentReviewRequired] = useState(false);

  const coursesQuery = useQuery({
    queryKey: ['instructor-courses-list'],
    queryFn: async () => {
      const res = await apiFetch(INSTRUCTOR_COURSES_API);
      const json = (await res.json()) as { success?: boolean; data?: { items: CourseListRow[] } };
      if (!res.ok || !json.success) throw new Error('Parcours indisponibles');
      return json.data?.items ?? [];
    },
  });

  useEffect(() => {
    if (!courseId && coursesQuery.data?.[0]) setCourseId(coursesQuery.data[0].id);
  }, [coursesQuery.data, courseId]);

  const builderQuery = useQuery({
    queryKey: ['instructor-course-builder', courseId],
    enabled: Boolean(courseId),
    queryFn: async () => {
      const res = await apiFetch(instructorCourseApi(courseId));
      const json = (await res.json()) as {
        success?: boolean;
        data?: { course: CourseBuilder; contentReviewRequired?: boolean };
      };
      if (!res.ok || !json.success || !json.data) throw new Error('Chargement impossible');
      setContentReviewRequired(Boolean(json.data.contentReviewRequired));
      return json.data.course;
    },
  });

  const course = builderQuery.data;
  const chapters = course?.chapters ?? [];

  useEffect(() => {
    if (!chapterId && chapters[0]) setChapterId(chapters[0].id);
  }, [chapters, chapterId]);

  const selectedChapter = useMemo(
    () => chapters.find((c) => c.id === chapterId) ?? null,
    [chapters, chapterId],
  );

  const activities = selectedChapter?.activities ?? [];

  useEffect(() => {
    if (!activityId && activities[0]) setActivityId(activities[0].id);
    if (activityId && !activities.some((a) => a.id === activityId) && activities[0]) {
      setActivityId(activities[0].id);
    }
  }, [activities, activityId]);

  const selectedActivity = useMemo(
    () => activities.find((a) => a.id === activityId) ?? null,
    [activities, activityId],
  );

  useEffect(() => {
    if (!selectedActivity) return;
    setActivityName(selectedActivity.name);
    setActivityPublished(selectedActivity.isPublished);
    if (selectedActivity.subType === 'DYNAMIC_MARKDOWN') {
      setMarkdown(parseMarkdown(selectedActivity.content));
    }
    if (selectedActivity.subType === 'VIDEO_YOUTUBE') {
      const y = parseYoutube(selectedActivity.content);
      setYoutubeId(y.youtubeId);
      setYoutubeCaption(y.caption);
    }
    if (selectedActivity.subType === 'QUIZ_MULTIPLE_CHOICE') {
      const q = parseQuizForms(selectedActivity.content, selectedActivity.details);
      setPassScore(q.passScore);
      setQuizQuestions(q.questions.length ? q.questions : [{ id: 'q1', prompt: '', choices: '', correctIndex: 0 }]);
    }
  }, [selectedActivity]);

  useEffect(() => {
    if (!selectedChapter) return;
    setMuxAssetId(selectedChapter.muxAssetId ?? '');
    setMuxPlaybackId(selectedChapter.muxPlaybackId ?? '');
  }, [selectedChapter]);

  const importBankItems = (items: { id: string; prompt: string; choices: string[]; correctIndex: number }[]) => {
    const mapped = items.map((item, i) => ({
      id: item.id || `q${quizQuestions.length + i + 1}`,
      prompt: item.prompt,
      choices: item.choices.join('\n'),
      correctIndex: item.correctIndex,
    }));
    setQuizQuestions((prev) => [...prev, ...mapped]);
    toast.success(`${mapped.length} question(s) importée(s).`);
  };

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ['instructor-course-builder', courseId] });
  };

  const reorderChapters = async (index: number, direction: 'up' | 'down') => {
    const ids = chapters.map((c) => c.id);
    const j = direction === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    const res = await apiFetch(INSTRUCTOR_COURSES_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, action: 'reorder-chapters', orderedChapterIds: ids }),
    });
    if (!res.ok) {
      toast.error('Réordonnancement impossible');
      return;
    }
    invalidate();
  };

  const reorderActivities = async (index: number, direction: 'up' | 'down') => {
    if (!chapterId) return;
    const ids = activities.map((a) => a.id);
    const j = direction === 'up' ? index - 1 : index + 1;
    if (j < 0 || j >= ids.length) return;
    [ids[index], ids[j]] = [ids[j], ids[index]];
    const res = await apiFetch(INSTRUCTOR_COURSES_API, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId,
        action: 'reorder-activities',
        chapterId,
        orderedActivityIds: ids,
      }),
    });
    if (!res.ok) {
      toast.error('Réordonnancement impossible');
      return;
    }
    invalidate();
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedActivity) throw new Error('Aucune activité');

      let content: unknown = selectedActivity.content;
      let details: unknown = selectedActivity.details;

      if (selectedActivity.subType === 'DYNAMIC_MARKDOWN') {
        content = { markdown };
      } else if (selectedActivity.subType === 'VIDEO_YOUTUBE') {
        content = { youtubeId: youtubeId.trim(), caption: youtubeCaption.trim() || undefined };
      } else if (selectedActivity.subType === 'QUIZ_MULTIPLE_CHOICE') {
        const built = buildQuizPayload(quizQuestions, passScore);
        content = built.content;
        details = built.details;
      }

      const res = await apiFetch(instructorCourseApi(courseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'activity',
          activityId: selectedActivity.id,
          name: activityName,
          wantsPublished: activityPublished,
          content,
          details,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      if (activityPublished && contentReviewRequired) {
        toast.success('Soumis à validation admin.');
      } else {
        toast.success(activityPublished ? 'Activité publiée.' : 'Brouillon enregistré.');
      }
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const toggleChapterPublish = async (ch: Chapter, wantsPublished: boolean) => {
    const res = await apiFetch(instructorCourseApi(courseId), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        target: 'chapter',
        chapterId: ch.id,
        wantsPublished,
      }),
    });
    if (!res.ok) {
      toast.error('Mise à jour UV impossible');
      return;
    }
    if (wantsPublished && contentReviewRequired) {
      toast.success('UV soumise à validation admin.');
    } else {
      toast.success(wantsPublished ? 'UV publiée.' : 'UV en brouillon.');
    }
    invalidate();
  };

  const saveMuxMutation = useMutation({
    mutationFn: async () => {
      if (!chapterId || !muxAssetId.trim()) throw new Error('Asset ID Mux requis');
      const res = await apiFetch(instructorCourseApi(courseId), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'mux',
          chapterId,
          muxAssetId: muxAssetId.trim(),
          muxPlaybackId: muxPlaybackId.trim() || undefined,
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      toast.success('Vidéo Mux enregistrée sur l’UV.');
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  return (
    <PortalPageShell width="full">
      <PortalPageHero
        title="Mes parcours e-formation"
        description="Course builder : ordre UV/activités, markdown, YouTube, Mux, quiz QCM (banque réutilisable), aperçu stagiaire, validation admin optionnelle."
        badge="Phase 2+"
      />

      <div className="mt-6">
        <ModuleKpiStatsRow items={instructorParcoursKpis(coursesQuery.data ?? [])} />
      </div>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="min-w-[240px] space-y-1">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Parcours LMS
          </Label>
          <Select value={courseId} onValueChange={setCourseId}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Choisir un parcours" />
            </SelectTrigger>
            <SelectContent>
              {(coursesQuery.data ?? []).map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.formationName} ({c.chapterCount} UV)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {chapterId ? (
          <Button size="sm" variant="outline" onClick={() => setPreviewOpen(true)}>
            <Eye className="me-2 size-4" />
            Aperçu stagiaire (UV)
          </Button>
        ) : null}
      </div>

      {builderQuery.isLoading ? (
        <div className="mt-8 flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement du parcours…
        </div>
      ) : !course ? (
        <p className={cn('mt-8', portalMuted)}>
          Aucun parcours LMS lié à vos formations. Contactez l’administration pour associer un cours.
        </p>
      ) : (
        <div className="mt-6 grid gap-6 xl:grid-cols-[280px_1fr_1fr]">
          <PortalSection title="UV (chapitres)" icon={BookOpen} contentClassName="!p-2">
            <ul className="space-y-1">
              {chapters.map((ch, i) => (
                <li key={ch.id}>
                  <div
                    className={cn(
                      'flex items-start gap-1 rounded-lg border p-2 text-[13px]',
                      chapterId === ch.id && 'border-primary/40 bg-primary/5',
                    )}
                  >
                    <div className="flex flex-col gap-0.5 pt-0.5">
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                        disabled={i === 0}
                        onClick={() => void reorderChapters(i, 'up')}
                        aria-label="Monter"
                      >
                        <ArrowUp className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                        disabled={i === chapters.length - 1}
                        onClick={() => void reorderChapters(i, 'down')}
                        aria-label="Descendre"
                      >
                        <ArrowDown className="size-3.5" />
                      </button>
                    </div>
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => setChapterId(ch.id)}
                    >
                      <span className="flex items-center gap-1">
                        <GripVertical className="size-3 shrink-0 text-muted-foreground" />
                        <span className={cn('line-clamp-2 font-medium', portalSectionTitle)}>
                          {ch.title}
                        </span>
                      </span>
                      <span className="mt-1 flex flex-wrap gap-1">
                        <Badge variant={ch.isPublished ? 'success' : 'warning'} size="sm" appearance="light" className="text-[9px]">
                          {ch.isPublished ? 'Live' : 'Draft'}
                        </Badge>
                        <Badge variant={reviewBadgeVariant(ch.reviewStatus)} size="sm" appearance="light" className="text-[9px]">
                          {reviewLabel(ch.reviewStatus)}
                        </Badge>
                        {ch.isFree ? (
                          <Badge variant="outline" size="sm" className="text-[9px]">
                            Pré-CNAPS
                          </Badge>
                        ) : null}
                      </span>
                    </button>
                    <Switch
                      checked={ch.isPublished || ch.reviewStatus === 'PENDING_REVIEW'}
                      onCheckedChange={(v) => void toggleChapterPublish(ch, v)}
                      aria-label="Publier UV"
                    />
                  </div>
                </li>
              ))}
            </ul>
            {selectedChapter ? (
              <div className="mt-4 space-y-2 border-t pt-3">
                <p className="text-[12px] font-medium">Vidéo Mux (UV)</p>
                <Label className="text-[11px]">Asset ID</Label>
                <Input value={muxAssetId} onChange={(e) => setMuxAssetId(e.target.value)} placeholder="Mux asset ID" />
                <Label className="text-[11px]">Playback ID</Label>
                <Input value={muxPlaybackId} onChange={(e) => setMuxPlaybackId(e.target.value)} placeholder="x36xhzz" />
                <p className={cn('text-[10px]', portalMuted)}>
                  Collez les IDs depuis le dashboard Mux ou demandez à l&apos;admin CRM. Upload direct Mux API : prochaine itération.
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  disabled={saveMuxMutation.isPending}
                  onClick={() => saveMuxMutation.mutate()}
                >
                  {saveMuxMutation.isPending ? <Loader2 className="me-2 size-3 animate-spin" /> : null}
                  Enregistrer Mux
                </Button>
              </div>
            ) : null}
          </PortalSection>

          <PortalSection title="Activités de l’UV" description={selectedChapter?.title}>
            {!selectedChapter ? (
              <p className={portalMuted}>Sélectionnez une UV.</p>
            ) : (
              <ul className="space-y-1">
                {activities.map((act, i) => (
                  <li key={act.id}>
                    <div
                      className={cn(
                        'flex items-center gap-2 rounded-lg border px-2 py-2 text-[13px]',
                        activityId === act.id && 'border-primary/40 bg-primary/5',
                      )}
                    >
                      <div className="flex flex-col">
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                          disabled={i === 0}
                          onClick={() => void reorderActivities(i, 'up')}
                        >
                          <ArrowUp className="size-3" />
                        </button>
                        <button
                          type="button"
                          className="rounded p-0.5 hover:bg-muted disabled:opacity-30"
                          disabled={i === activities.length - 1}
                          onClick={() => void reorderActivities(i, 'down')}
                        >
                          <ArrowDown className="size-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="min-w-0 flex-1 text-left"
                        onClick={() => setActivityId(act.id)}
                      >
                        <p className="font-medium">{act.name}</p>
                        <p className="text-[11px] text-muted-foreground">{subTypeLabel(act.subType)}</p>
                      </button>
                      <Badge variant={act.isPublished ? 'success' : 'warning'} appearance="light" size="sm" className="shrink-0 text-[9px]">
                        {act.isPublished ? 'Live' : 'Draft'}
                      </Badge>
                      {act.reviewStatus !== 'APPROVED' ? (
                        <Badge variant={reviewBadgeVariant(act.reviewStatus)} appearance="light" size="sm" className="shrink-0 text-[9px]">
                          {reviewLabel(act.reviewStatus)}
                        </Badge>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </PortalSection>

          <PortalSection title="Éditeur" description={selectedActivity ? subTypeLabel(selectedActivity.subType) : undefined}>
            {!selectedActivity ? (
              <p className={portalMuted}>Sélectionnez une activité.</p>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nom affiché</Label>
                  <Input value={activityName} onChange={(e) => setActivityName(e.target.value)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                  <div>
                    <p className="text-[13px] font-medium">Publié (visible stagiaire)</p>
                    <p className={cn('text-[11px]', portalMuted)}>
                      {contentReviewRequired
                        ? 'Publication soumise à validation admin (Gestion académique → Contenu e-formation).'
                        : 'Désactivé = brouillon non visible côté stagiaire.'}
                    </p>
                  </div>
                  <Switch checked={activityPublished} onCheckedChange={setActivityPublished} />
                </div>
                {selectedActivity.reviewStatus === 'REJECTED' && selectedActivity.reviewNote ? (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-[11px] text-destructive">
                    Refus admin : {selectedActivity.reviewNote}
                  </p>
                ) : null}

                {selectedActivity.subType === 'DYNAMIC_MARKDOWN' ? (
                  <div className="space-y-2">
                    <Label>Contenu markdown</Label>
                    <Textarea
                      value={markdown}
                      onChange={(e) => setMarkdown(e.target.value)}
                      rows={14}
                      className="font-mono text-[12px]"
                    />
                  </div>
                ) : null}

                {selectedActivity.subType === 'VIDEO_YOUTUBE' ? (
                  <>
                    <div className="space-y-2">
                      <Label>ID YouTube</Label>
                      <Input
                        value={youtubeId}
                        onChange={(e) => setYoutubeId(e.target.value)}
                        placeholder="dQw4w9WgXcQ"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Légende</Label>
                      <Input value={youtubeCaption} onChange={(e) => setYoutubeCaption(e.target.value)} />
                    </div>
                    <p className={cn('text-[11px]', portalMuted)}>
                      Vidéo Mux hébergée : configurez l&apos;asset sur l&apos;UV (panneau gauche). Les activités VIDEO_HOSTED utilisent ce flux.
                    </p>
                  </>
                ) : null}

                {selectedActivity.subType === 'VIDEO_HOSTED' ? (
                  <p className={cn('text-[12px]', portalMuted)}>
                    Lecture Mux liée à l&apos;UV sélectionnée. Renseignez Asset ID / Playback ID dans le panneau UV.
                  </p>
                ) : null}

                {selectedActivity.subType === 'QUIZ_MULTIPLE_CHOICE' ? (
                  <div className="space-y-4">
                    <InstructorQuizBankPicker courseId={courseId} onImport={importBankItems} />
                    <div className="space-y-2">
                      <Label>Score minimum (%)</Label>
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={passScore}
                        onChange={(e) => setPassScore(Number(e.target.value) || 50)}
                      />
                    </div>
                    {quizQuestions.map((q, qi) => (
                      <div key={q.id} className="space-y-2 rounded-lg border p-3">
                        <Label>Question {qi + 1}</Label>
                        <Input
                          value={q.prompt}
                          onChange={(e) => {
                            const next = [...quizQuestions];
                            next[qi] = { ...q, prompt: e.target.value };
                            setQuizQuestions(next);
                          }}
                        />
                        <Label className="text-[11px]">Réponses (une par ligne)</Label>
                        <Textarea
                          value={q.choices}
                          rows={4}
                          onChange={(e) => {
                            const next = [...quizQuestions];
                            next[qi] = { ...q, choices: e.target.value };
                            setQuizQuestions(next);
                          }}
                        />
                        <Label className="text-[11px]">Index bonne réponse (0 = 1ère ligne)</Label>
                        <Input
                          type="number"
                          min={0}
                          value={q.correctIndex}
                          onChange={(e) => {
                            const next = [...quizQuestions];
                            next[qi] = { ...q, correctIndex: Number(e.target.value) || 0 };
                            setQuizQuestions(next);
                          }}
                        />
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setQuizQuestions([
                          ...quizQuestions,
                          { id: `q${quizQuestions.length + 1}`, prompt: '', choices: '', correctIndex: 0 },
                        ])
                      }
                    >
                      + Question
                    </Button>
                  </div>
                ) : null}

                <Button
                  className="w-full"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="me-2 size-4 animate-spin" />
                  ) : (
                    <Save className="me-2 size-4" />
                  )}
                  Enregistrer
                </Button>
              </div>
            )}
          </PortalSection>
        </div>
      )}

      {previewOpen && courseId && chapterId ? (
        <InstructorCoursePreview
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          previewUrl={instructorCoursePreviewApi(courseId, chapterId)}
          courseId={courseId}
          chapterId={chapterId}
          chapterTitle={selectedChapter?.title ?? 'UV'}
        />
      ) : null}
    </PortalPageShell>
  );
}
