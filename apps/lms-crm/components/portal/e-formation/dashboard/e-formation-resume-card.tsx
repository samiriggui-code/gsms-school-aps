'use client';

import Link from 'next/link';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { portalLabel, portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { cn } from '@/lib/utils';

type Props = {
  courseTitle: string;
  nextLesson: {
    href: string;
    uvIndex: number;
    title: string;
    isFree: boolean;
  } | null;
  progressPercent: number;
  completedCount: number;
  chapterCount: number;
  canStart: boolean;
  className?: string;
};

export function EFormationResumeCard({
  courseTitle,
  nextLesson,
  progressPercent,
  completedCount,
  chapterCount,
  canStart,
  className,
}: Props) {
  const allDone = chapterCount > 0 && completedCount >= chapterCount;

  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-xl border bg-gradient-to-br from-primary/10 via-card to-card p-5 shadow-xs sm:p-6',
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 space-y-2">
          <p className={portalLabel}>Reprendre ici</p>
          {allDone ? (
            <>
              <h2 className={portalSectionTitle}>Parcours e-learning terminé</h2>
              <p className={portalMuted}>
                Félicitations — vous avez validé toutes les UV de {courseTitle}.
              </p>
            </>
          ) : !canStart ? (
            <>
              <h2 className={portalSectionTitle}>Dossier requis pour démarrer</h2>
              <p className={portalMuted}>
                Complétez votre dossier administratif pour accéder aux modules de préparation.
              </p>
            </>
          ) : nextLesson ? (
            <>
              <h2 className={cn(portalSectionTitle, 'text-base sm:text-[15px]')}>
                UV {nextLesson.uvIndex} — {nextLesson.title}
              </h2>
              <p className={portalMuted}>
                {completedCount > 0
                  ? `Reprenez votre formation · ${progressPercent} % du parcours`
                  : 'Commencez votre première leçon en ligne'}
                {nextLesson.isFree ? ' · Module prépa CNAPS' : ''}
              </p>
            </>
          ) : (
            <>
              <h2 className={portalSectionTitle}>{courseTitle}</h2>
              <p className={portalMuted}>Aucune leçon accessible pour le moment.</p>
            </>
          )}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {!canStart ? (
            <Button asChild size="sm">
              <Link href="/mon-dossier">
                Compléter mon dossier
                <ArrowRight className="ml-1.5 size-3.5" />
              </Link>
            </Button>
          ) : nextLesson && !allDone ? (
            <Button asChild size="md" className="min-w-[160px]">
              <Link href={nextLesson.href}>
                <PlayCircle className="mr-2 size-4" />
                {completedCount > 0 ? 'Reprendre' : 'Commencer'}
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
