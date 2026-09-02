'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Lock,
  Loader2,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { lmsAccessLabel, type LmsAccessTier } from '@/lib/portal/lms-access-shared';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalStatGrid } from '@/components/portal/layout/portal-stat-grid';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';

type CourseRow = {
  id: string;
  title: string;
  description: string | null;
  chapterCount: number;
  accessibleChapterCount: number;
  completedChapterCount: number;
  progressPercent: number;
  locked: boolean;
  chapters: Array<{
    id: string;
    title: string;
    accessible: boolean;
    isFree: boolean;
    completed: boolean;
  }>;
};

type FormationInfo = {
  id: string;
  slug: string;
  name: string;
  courseId: string | null;
} | null;

export function ApprendreClient() {
  const [tier, setTier] = useState<LmsAccessTier>('none');
  const [formation, setFormation] = useState<FormationInfo>(null);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiFetch('/api/portal/apprendre');
        const json = (await res.json()) as {
          success?: boolean;
          data?: {
            tier: LmsAccessTier;
            formation: FormationInfo;
            courses: CourseRow[];
          };
          error?: { message?: string };
        };
        if (!res.ok || !json.success || !json.data) {
          throw new Error(json.error?.message ?? 'Impossible de charger les cours.');
        }
        if (!cancelled) {
          setTier(json.data.tier);
          setFormation(json.data.formation);
          setCourses(json.data.courses);
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
  }, []);

  const course = courses[0];
  const stats = useMemo(
    () => [
      {
        label: 'Progression',
        value: course ? `${course.progressPercent} %` : '—',
        hint: course
          ? `${course.completedChapterCount} leçon(s) terminée(s)`
          : 'Aucun parcours',
        icon: Trophy,
        tone: 'primary' as const,
      },
      {
        label: 'Modules accessibles',
        value: course ? `${course.accessibleChapterCount}/${course.chapterCount}` : '—',
        hint: lmsAccessLabel(tier),
        icon: Target,
        tone: tier === 'full' ? ('success' as const) : ('warning' as const),
      },
      {
        label: 'Préparation CNAPS',
        value: course?.chapters.filter((c) => c.isFree && c.accessible).length ?? 0,
        hint: 'Modules gratuits pendant l’instruction',
        icon: Sparkles,
        tone: 'default' as const,
      },
      {
        label: 'Formation',
        value: formation?.name ?? '—',
        hint: formation ? 'Parcours lié à votre dossier' : 'Dossier non lié',
        icon: BookOpen,
        tone: 'default' as const,
      },
    ],
    [course, formation, tier],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de votre espace d&apos;apprentissage…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
        {error}
      </div>
    );
  }

  const nextLesson = course?.chapters.find((c) => c.accessible && !c.completed);

  return (
    <div className="container-fluid mx-auto w-full max-w-full min-w-0 space-y-5 px-4 lg:space-y-8 lg:px-5">
      <PortalPageHero
        badge={lmsAccessLabel(tier)}
        title="Apprendre en autonomie"
        description="Préparez votre formation avant la session en centre : révisions réglementaires, vidéos courtes et quiz de validation. Votre accès évolue avec l’avancement de votre dossier CNAPS."
        actions={
          course && !course.locked && nextLesson ? (
            <Button asChild size="lg">
              <Link href={`/apprendre/${course.id}/lecons/${nextLesson.id}`}>
                <PlayCircle className="mr-2 size-4" />
                {course.completedChapterCount > 0 ? 'Reprendre' : 'Commencer'}
              </Link>
            </Button>
          ) : null
        }
      />

      <PortalStatGrid items={stats} />

      {tier === 'none' ? (
        <div className="rounded-xl border border-amber-500/25 bg-gradient-to-r from-amber-500/10 to-transparent p-5 text-sm">
          <p className="font-medium text-amber-950 dark:text-amber-100">Dossier incomplet</p>
          <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
            Transmettez votre dossier depuis{' '}
            <Link href="/mon-dossier" className="font-medium underline underline-offset-2">
              Mon dossier
            </Link>{' '}
            pour débloquer les modules de préparation.
          </p>
        </div>
      ) : null}

      {!course ? (
        <div className="rounded-xl border bg-card p-10 text-center">
          <BookOpen className="mx-auto size-10 text-muted-foreground/50" />
          <p className="mt-4 font-medium">Contenu en préparation</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Votre parcours e-learning sera disponible dès que votre formation sera associée au
            dossier.
          </p>
        </div>
      ) : (
        <article className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="grid lg:grid-cols-[1fr_320px]">
            <div className="space-y-5 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <BookOpen className="size-7" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight">{course.title}</h2>
                  {course.description ? (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {course.description}
                    </p>
                  ) : null}
                </div>
              </div>

              <div>
                <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                  <span>Avancement global</span>
                  <span>{course.progressPercent} %</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
                    style={{ width: `${course.progressPercent}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button asChild disabled={course.locked}>
                  <Link href={`/apprendre/${course.id}`}>
                    Voir le programme
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
                {nextLesson ? (
                  <Button variant="outline" asChild>
                    <Link href={`/apprendre/${course.id}/lecons/${nextLesson.id}`}>
                      <PlayCircle className="mr-2 size-4" />
                      Leçon suivante
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>

            <aside className="border-t bg-muted/20 p-6 lg:border-l lg:border-t-0">
              <h3 className="text-sm font-semibold">Programme</h3>
              <ul className="mt-4 max-h-80 space-y-1 overflow-y-auto pr-1">
                {course.chapters.map((ch, i) => (
                  <li key={ch.id}>
                    {ch.accessible ? (
                      <Link
                        href={`/apprendre/${course.id}/lecons/${ch.id}`}
                        className={cn(
                          'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-background',
                          ch.completed && 'text-muted-foreground',
                        )}
                      >
                        {ch.completed ? (
                          <CheckCircle2 className="size-4 shrink-0 text-primary" />
                        ) : (
                          <span className="flex size-4 shrink-0 items-center justify-center text-[10px] font-semibold text-muted-foreground">
                            {i + 1}
                          </span>
                        )}
                        <span className="line-clamp-2 flex-1">{ch.title}</span>
                        {ch.isFree ? (
                          <span className="text-[10px] uppercase text-primary">Prépa</span>
                        ) : null}
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground">
                        <Lock className="size-4 shrink-0" />
                        <span className="line-clamp-2 flex-1">{ch.title}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </aside>
          </div>
        </article>
      )}
    </div>
  );
}
