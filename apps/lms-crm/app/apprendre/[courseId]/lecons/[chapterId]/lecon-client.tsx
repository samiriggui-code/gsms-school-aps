'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { LmsActivityList } from '@/components/portal/lms/lms-activity-list';
import { LmsCourseSidebar } from '@/components/portal/lms/lms-course-sidebar';
import { Button } from '@/components/ui/button';
import type { LmsActivityRow, LmsSyllabusItem } from '@/lib/portal/lms-types';
import type { LmsAccessTier } from '@/lib/portal/lms-access-shared';

type LessonPayload = {
  tier: LmsAccessTier;
  course: { id: string; title: string };
  chapter: {
    id: string;
    title: string;
    description: string | null;
    position: number;
    isFree: boolean;
    completed: boolean;
    activities: LmsActivityRow[];
  };
  syllabus: LmsSyllabusItem[];
  navigation: { prevChapterId: string | null; nextChapterId: string | null };
};

export function LeconClient({ courseId, chapterId }: { courseId: string; chapterId: string }) {
  const [data, setData] = useState<LessonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `/api/portal/apprendre/courses/${courseId}/chapters/${chapterId}`,
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: LessonPayload;
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Leçon introuvable.');
      }
      setData(json.data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setLoading(false);
    }
  }, [courseId, chapterId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function markComplete(completed: boolean) {
    setSaving(true);
    try {
      const res = await apiFetch('/api/portal/apprendre/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chapterId, completed }),
      });
      if (!res.ok) throw new Error('Enregistrement impossible');
      await load();
    } catch {
      setError('Impossible d’enregistrer la progression.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de la leçon…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? 'Leçon introuvable.'}
      </div>
    );
  }

  const progressPercent =
    data.syllabus.length > 0
      ? Math.round(
          (data.syllabus.filter((s) => s.completed).length / data.syllabus.length) * 100,
        )
      : 0;

  const syllabusWithCurrent = data.syllabus.map((s) => ({
    ...s,
    current: s.id === chapterId,
  }));

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 space-y-5 px-4 lg:space-y-6 lg:px-5">
      <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
      <div className="order-2 lg:order-1 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
        <LmsCourseSidebar
          courseId={courseId}
          courseTitle={data.course.title}
          progressPercent={progressPercent}
          tier={data.tier}
          items={syllabusWithCurrent}
        />
      </div>

      <div className="order-1 min-w-0 space-y-6 lg:order-2">
        <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/20 px-6 py-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Leçon {data.chapter.position}
              {data.chapter.isFree ? ' · Préparation CNAPS' : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{data.chapter.title}</h1>
              {data.chapter.completed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <CheckCircle2 className="size-3.5" /> Terminée
                </span>
              ) : null}
            </div>
            {data.chapter.description ? (
              <p className="mt-2 text-sm text-muted-foreground">{data.chapter.description}</p>
            ) : null}
          </div>

          <div className="space-y-8 p-6">
            <LmsActivityList
              courseId={courseId}
              chapterId={chapterId}
              activities={data.chapter.activities}
              onQuizPassed={() => {
                void load();
              }}
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/10 px-6 py-4">
          <div className="flex gap-2">
            {data.navigation.prevChapterId ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/apprendre/${courseId}/lecons/${data.navigation.prevChapterId}`}>
                  <ArrowLeft className="mr-1 size-4" /> Précédent
                </Link>
              </Button>
            ) : null}
            {data.navigation.nextChapterId ? (
              <Button size="sm" asChild>
                <Link href={`/apprendre/${courseId}/lecons/${data.navigation.nextChapterId}`}>
                  Suivant <ArrowRight className="ml-1 size-4" />
                </Link>
              </Button>
            ) : null}
          </div>

          {!data.chapter.completed ? (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => void markComplete(true)}
            >
              {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Marquer comme terminée
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => void markComplete(false)}>
              Réinitialiser
            </Button>
          )}
          </div>
        </article>
      </div>
      </div>
    </div>
  );
}
