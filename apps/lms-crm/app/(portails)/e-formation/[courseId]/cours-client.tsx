'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Loader2, PlayCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_API, E_FORMATION_BASE, eFormationModulePath } from '@/lib/portal/e-formation-paths';
import { lmsAccessLabel, type LmsAccessTier } from '@/lib/portal/lms-access-shared';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { LmsCourseSidebar } from '@/components/portal/lms/lms-course-sidebar';
import { Button } from '@repo/ui/button';
import type { LmsSyllabusItem } from '@/lib/portal/lms-types';

type CoursePayload = {
  id: string;
  title: string;
  description: string | null;
  progressPercent: number;
  chapterCount: number;
  completedChapterCount: number;
  formation: { slug: string; name: string; duration: string; tag: string } | null;
  chapters: LmsSyllabusItem[];
};

export function CoursClient({ courseId }: { courseId: string }) {
  const [tier, setTier] = useState<LmsAccessTier>('none');
  const [course, setCourse] = useState<CoursePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch(`${E_FORMATION_API}/courses/${courseId}`);
        const json = (await res.json()) as {
          success?: boolean;
          data?: { tier: LmsAccessTier; course: CoursePayload };
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? 'Parcours introuvable.');
        }
        if (!cancelled) {
          setTier(json.data.tier);
          setCourse(json.data.course);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur inattendue');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement du parcours…
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error ?? 'Parcours introuvable.'}
      </div>
    );
  }

  const firstAccessible = course.chapters.find((c) => c.accessible);

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 space-y-5 px-4 lg:space-y-6 lg:px-5">
      <PortalPageHero
        badge={course.formation?.tag ?? 'Parcours'}
        title={course.title}
        description={course.description ?? undefined}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(260px,300px)_1fr] lg:items-start">
      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)]">
        <LmsCourseSidebar
          courseId={course.id}
          courseTitle={course.title}
          progressPercent={course.progressPercent}
          tier={tier}
          items={course.chapters}
        />
      </div>

        <div className="min-w-0 space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="font-semibold">Continuer votre formation</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.completedChapterCount} / {course.chapterCount} leçons terminées ·{' '}
              {lmsAccessLabel(tier)}
            </p>
            {firstAccessible ? (
              <Button asChild className="mt-4" size="lg">
                <Link href={eFormationModulePath(course.id, firstAccessible.id)}>
                  <PlayCircle className="mr-2 size-4" />
                  {course.completedChapterCount > 0 ? 'Reprendre' : 'Commencer'}
                  <ArrowRight className="ml-2 size-4" />
                </Link>
              </Button>
            ) : (
              <p className="mt-4 text-sm text-amber-800 dark:text-amber-300">
                Aucune leçon accessible — complétez votre dossier administratif.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
