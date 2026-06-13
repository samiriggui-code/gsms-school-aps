'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CircleHelp, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  E_FORMATION_API,
  eFormationModulePath,
} from '@/lib/portal/e-formation-paths';
import { LmsQuizBlock } from '@/components/portal/lms/lms-quiz-block';
import { Button } from '@/components/ui/button';
import type { LmsActivityRow } from '@/lib/portal/lms-types';

type LessonPayload = {
  course: { id: string; title: string };
  chapter: {
    id: string;
    title: string;
    position: number;
    isFree: boolean;
    activities: LmsActivityRow[];
  };
};

export function LeconQuizClient({ courseId, chapterId }: { courseId: string; chapterId: string }) {
  const [data, setData] = useState<LessonPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(
        `${E_FORMATION_API}/courses/${courseId}/chapters/${chapterId}`,
      );
      const json = (await res.json()) as {
        success?: boolean;
        data?: LessonPayload;
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Quiz introuvable.');
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

  const quizActivities = useMemo(
    () =>
      data?.chapter.activities.filter((a) => a.subType === 'QUIZ_MULTIPLE_CHOICE') ?? [],
    [data?.chapter.activities],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement du quiz…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? 'Quiz introuvable.'}
      </div>
    );
  }

  if (quizActivities.length === 0) {
    return (
      <div className="container-fluid mx-auto w-full max-w-full min-w-0 space-y-5 px-4 lg:px-5">
        <Button variant="ghost" size="sm" asChild>
          <Link href={eFormationModulePath(courseId, chapterId)}>
            <ArrowLeft className="mr-1 size-4" />
            Retour à la leçon
          </Link>
        </Button>
        <div className="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Aucun quiz associé à cette UV.
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 space-y-5 px-4 pb-8 lg:space-y-6 lg:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <Button variant="ghost" size="sm" asChild>
          <Link href={eFormationModulePath(courseId, chapterId)}>
            <ArrowLeft className="mr-1 size-4" />
            Retour à la leçon
          </Link>
        </Button>
      </div>

      <header className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          UV {data.chapter.position}
          {data.chapter.isFree ? ' · Préparation CNAPS' : ''}
        </p>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
          <CircleHelp className="size-7 text-primary" />
          Quiz — {data.chapter.title}
        </h1>
        <p className="text-sm text-muted-foreground">{data.course.title}</p>
      </header>

      <div className="mx-auto w-full max-w-3xl space-y-6">
        {quizActivities.map((activity) => (
          <LmsQuizBlock
            key={activity.id}
            activityId={activity.id}
            content={activity.content}
            onPassed={() => {
              void load();
            }}
          />
        ))}
      </div>
    </div>
  );
}
