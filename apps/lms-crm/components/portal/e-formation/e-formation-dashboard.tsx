'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Loader2,
  Lock,
  Megaphone,
  PlayCircle,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  E_FORMATION_ANNOUNCEMENTS_API,
  E_FORMATION_API,
  E_FORMATION_BASE,
  E_FORMATION_QUIZ_API,
  eFormationModulePath,
  eFormationQuizPath,
} from '@/lib/portal/e-formation-paths';
import { lmsAccessLabel, type LmsAccessTier } from '@/lib/portal/lms-access-shared';
import { PortalNavTabs } from '@/components/portal/layout/portal-nav-tabs';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { PortalStatGrid } from '@/components/portal/layout/portal-stat-grid';
import { portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { EFormationActionTiles } from '@/components/portal/e-formation/dashboard/e-formation-action-tiles';
import { EFormationActivityChart } from '@/components/portal/e-formation/dashboard/e-formation-activity-chart';
import { EFormationResumeCard } from '@/components/portal/e-formation/dashboard/e-formation-resume-card';
import {
  EFormationUvDonut,
  EFormationUvKpiRow,
  type UvProgressBreakdown,
} from '@/components/portal/e-formation/dashboard/e-formation-uv-donut';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatPortalDate } from '@/lib/portal/format-portal-date';

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

type QuizSummary = { total: number; unlocked: number; passed: number };

type Announcement = {
  id: string;
  title: string;
  content: string;
  publishedAt: string;
  scope: 'formation' | 'session';
  sessionLabel: string | null;
};

const TAB_VALUES = ['parcours', 'annonces'] as const;
type TabValue = (typeof TAB_VALUES)[number];

function isTabValue(v: string | null): v is TabValue {
  return TAB_VALUES.includes(v as TabValue);
}

export function EFormationDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const activeTab: TabValue = isTabValue(tabParam) ? tabParam : 'parcours';

  useEffect(() => {
    if (tabParam === 'quiz') {
      router.replace(eFormationQuizPath());
    }
  }, [tabParam, router]);

  const [tier, setTier] = useState<LmsAccessTier>('none');
  const [course, setCourse] = useState<CourseRow | null>(null);
  const [quizSummary, setQuizSummary] = useState<QuizSummary>({ total: 0, unlocked: 0, passed: 0 });
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseRes, quizRes, annRes] = await Promise.all([
          apiFetch(E_FORMATION_API),
          apiFetch(E_FORMATION_QUIZ_API),
          apiFetch(E_FORMATION_ANNOUNCEMENTS_API),
        ]);

        const courseJson = (await courseRes.json()) as {
          success?: boolean;
          data?: { tier: LmsAccessTier; courses: CourseRow[] };
          error?: { message?: string };
        };
        const quizJson = (await quizRes.json()) as {
          success?: boolean;
          data?: { summary: QuizSummary };
        };
        const annJson = (await annRes.json()) as {
          success?: boolean;
          data?: { announcements: Announcement[] };
        };

        if (!courseRes.ok || !courseJson.success || !courseJson.data) {
          throw new Error(courseJson.error?.message ?? 'Impossible de charger l’e-formation.');
        }
        if (!cancelled) {
          setTier(courseJson.data.tier);
          setCourse(courseJson.data.courses[0] ?? null);
          if (quizJson.success && quizJson.data) {
            setQuizSummary(quizJson.data.summary);
          }
          if (annJson.success && annJson.data) {
            setAnnouncements(annJson.data.announcements);
          }
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

  const nextLesson = course?.chapters.find((c) => c.accessible && !c.completed);

  const uvBreakdown = useMemo((): UvProgressBreakdown => {
    if (!course) {
      return { total: 0, completed: 0, inProgress: 0, locked: 0 };
    }
    const completed = course.chapters.filter((c) => c.completed).length;
    const inProgress = course.chapters.filter((c) => c.accessible && !c.completed).length;
    const locked = course.chapters.filter((c) => !c.accessible).length;
    return {
      total: course.chapterCount,
      completed,
      inProgress,
      locked,
    };
  }, [course]);

  const nextLessonMeta = useMemo(() => {
    if (!course || !nextLesson) return null;
    const uvIndex = course.chapters.findIndex((c) => c.id === nextLesson.id) + 1;
    return {
      href: eFormationModulePath(course.id, nextLesson.id),
      uvIndex,
      title: nextLesson.title,
      isFree: nextLesson.isFree,
    };
  }, [course, nextLesson]);

  const lockedCount = course
    ? course.chapterCount - course.accessibleChapterCount
    : 0;
  const prepaCount = course?.chapters.filter((c) => c.isFree).length ?? 0;

  const stats = useMemo(
    () => [
      {
        label: 'Progression',
        value: course ? `${course.progressPercent} %` : '—',
        hint: course
          ? `${course.completedChapterCount}/${course.chapterCount} UV terminées`
          : 'Aucun parcours',
        icon: Trophy,
        tone: 'primary' as const,
        progress: course?.progressPercent,
      },
      {
        label: 'UV accessibles',
        value: course ? `${course.accessibleChapterCount}/${course.chapterCount}` : '—',
        hint: lmsAccessLabel(tier),
        icon: Target,
        tone: tier === 'full' ? ('success' as const) : ('warning' as const),
      },
      {
        label: 'Quiz réussis',
        value: quizSummary.total ? `${quizSummary.passed}/${quizSummary.total}` : '—',
        hint: `${quizSummary.unlocked} débloqué(s)`,
        icon: ClipboardCheck,
        tone: 'success' as const,
        href: eFormationQuizPath(),
      },
      {
        label: 'Prochaine leçon',
        value: nextLesson ? `UV ${course?.chapters.findIndex((c) => c.id === nextLesson.id)! + 1}` : '—',
        hint: nextLesson?.title ?? (course ? 'Parcours terminé' : 'Non disponible'),
        icon: PlayCircle,
        tone: 'default' as const,
        href:
          course && nextLesson
            ? eFormationModulePath(course.id, nextLesson.id)
            : undefined,
      },
      {
        label: 'UV verrouillées',
        value: course ? String(lockedCount) : '—',
        hint: tier === 'none' ? 'Dossier requis' : 'Déblocage progressif',
        icon: Lock,
        tone: lockedCount > 0 ? ('warning' as const) : ('success' as const),
      },
      {
        label: 'Prépa CNAPS',
        value: prepaCount ? String(prepaCount) : '—',
        hint: 'Modules gratuits',
        icon: Sparkles,
        tone: 'default' as const,
      },
      {
        label: 'Annonces',
        value: announcements.length,
        hint: 'Messages formateur / école',
        icon: Bell,
        tone: announcements.length ? ('primary' as const) : ('default' as const),
      },
      {
        label: 'Accès LMS',
        value: lmsAccessLabel(tier),
        hint: tier === 'full' ? 'Parcours complet' : 'Accès partiel',
        icon: Zap,
        tone: tier === 'full' ? ('success' as const) : ('default' as const),
      },
    ],
    [course, nextLesson, quizSummary, tier, lockedCount, prepaCount, announcements.length],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de votre e-formation…
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

  return (
    <PortalPageShell width="full" className="space-y-5 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/formation"
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Retour à ma fiche formation
        </Link>
      </div>

      <PortalPageHero
        badge={lmsAccessLabel(tier)}
        title="E-formation"
        description={
          course?.title
            ? `${course.title} — modules, vidéos et quiz UV par UV.`
            : 'Parcours en ligne de votre formation.'
        }
        meta={
          course ? (
            <Badge variant="outline" size="sm" className="text-[10px]">
              {course.completedChapterCount}/{course.chapterCount} UV · {course.progressPercent} %
            </Badge>
          ) : null
        }
      />

      {course ? (
        <EFormationResumeCard
          courseTitle={course.title}
          nextLesson={nextLessonMeta}
          progressPercent={course.progressPercent}
          completedCount={course.completedChapterCount}
          chapterCount={course.chapterCount}
          canStart={tier !== 'none'}
        />
      ) : null}

      <EFormationActionTiles />

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <EFormationActivityChart />
        {course ? <EFormationUvDonut breakdown={uvBreakdown} /> : null}
      </div>

      {course ? <EFormationUvKpiRow breakdown={uvBreakdown} /> : null}

      <PortalStatGrid items={stats} columns={4} />

      {tier === 'none' ? (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5 text-[13px]">
          <p className="font-medium text-amber-950 dark:text-amber-100">Dossier incomplet</p>
          <p className="mt-0.5 text-amber-900/80 dark:text-amber-200/80">
            Transmettez votre dossier depuis{' '}
            <Link href="/mon-dossier" className="font-medium underline underline-offset-2">
              Mon dossier
            </Link>{' '}
            pour débloquer les modules.
          </p>
        </div>
      ) : null}

      <PortalNavTabs
        tabs={[
          {
            id: 'parcours',
            label: 'Mon parcours',
            icon: BookOpen,
            href: `${E_FORMATION_BASE}?tab=parcours`,
            active: activeTab === 'parcours',
          },
          {
            id: 'quiz',
            label: 'Mes quiz',
            icon: ClipboardCheck,
            href: eFormationQuizPath(),
            badge: quizSummary.total > 0 ? `${quizSummary.passed}/${quizSummary.total}` : undefined,
          },
          {
            id: 'annonces',
            label: 'Annonces',
            icon: Bell,
            href: `${E_FORMATION_BASE}?tab=annonces`,
            active: activeTab === 'annonces',
            count: announcements.length,
          },
        ]}
      />

      {activeTab === 'parcours' ? (
        <div className="space-y-4">
          {!course ? (
            <PortalSection title="Parcours" icon={BookOpen} variant="outline">
              <p className={portalMuted}>Contenu en préparation.</p>
            </PortalSection>
          ) : (
            <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
              <PortalSection
                title={course.title}
                icon={GraduationCap}
                action={
                  nextLesson ? (
                    <Button asChild size="sm" variant="outline" className="h-7 text-[12px]">
                      <Link href={eFormationModulePath(course.id, nextLesson.id)}>
                        <PlayCircle className="mr-1 size-3" />
                        Reprendre
                      </Link>
                    </Button>
                  ) : null
                }
              >
                {course.description ? (
                  <p className={cn('mb-4', portalMuted)}>{course.description}</p>
                ) : null}

                <div className="mb-4">
                  <div className="mb-1.5 flex justify-between text-[11px] text-muted-foreground">
                    <span>Avancement global</span>
                    <span className="font-medium text-foreground">{course.progressPercent} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${course.progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild size="sm" disabled={course.locked} className="text-[13px]">
                    <Link href={`${E_FORMATION_BASE}/${course.id}`}>
                      Détail du parcours
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Link>
                  </Button>
                </div>
              </PortalSection>

              <PortalSection title="Programme en ligne" icon={BookOpen} contentClassName="!p-0">
                <ul className="max-h-[420px] space-y-0.5 overflow-y-auto px-2 py-2">
                  {course.chapters.map((ch, i) => (
                    <li key={ch.id}>
                      {ch.accessible ? (
                        <Link
                          href={eFormationModulePath(course.id, ch.id)}
                          className={cn(
                            'group flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] transition-colors hover:bg-muted/60',
                            ch.completed && 'text-muted-foreground',
                          )}
                        >
                          {ch.completed ? (
                            <CheckCircle2 className="size-3.5 shrink-0 text-primary" />
                          ) : (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-md bg-muted text-[10px] font-semibold group-hover:bg-primary/10 group-hover:text-primary">
                              {i + 1}
                            </span>
                          )}
                          <span className="line-clamp-2 min-w-0 flex-1">{ch.title}</span>
                          {ch.isFree ? (
                            <span className="shrink-0 text-[9px] font-semibold uppercase text-primary">
                              Prépa
                            </span>
                          ) : null}
                        </Link>
                      ) : (
                        <div
                          className="flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] text-muted-foreground/70"
                          title="Module verrouillé"
                        >
                          <Lock className="size-3.5 shrink-0" />
                          <span className="line-clamp-2 flex-1">{ch.title}</span>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </PortalSection>
            </div>
          )}
        </div>
      ) : null}

      {activeTab === 'annonces' ? (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <PortalSection title="Annonces" icon={Megaphone} variant="outline">
              <p className={portalMuted}>Les messages de votre formateur apparaîtront ici.</p>
            </PortalSection>
          ) : (
            announcements.map((ann) => (
              <article
                key={ann.id}
                className="relative overflow-hidden rounded-xl border bg-card shadow-xs transition-shadow hover:shadow-sm"
              >
                <div
                  className={cn(
                    'absolute left-0 top-0 bottom-0 w-0.5',
                    ann.scope === 'session' ? 'bg-primary' : 'bg-purple-500',
                  )}
                />
                <div className="px-4 py-4 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <span>{formatPortalDate(ann.publishedAt)}</span>
                    <Badge variant="outline" size="sm" appearance="light" className="text-[10px]">
                      {ann.scope === 'session' ? ann.sessionLabel ?? 'Ma session' : 'Formation'}
                    </Badge>
                  </div>
                  <h3 className={cn('mt-2', portalSectionTitle)}>{ann.title}</h3>
                  <p className={cn('mt-1.5 whitespace-pre-line', portalMuted)}>{ann.content}</p>
                </div>
              </article>
            ))
          )}
        </div>
      ) : null}
    </PortalPageShell>
  );
}
