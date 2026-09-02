'use client';

import Link from 'next/link';
import { CheckCircle2, ClipboardCheck, Lock } from 'lucide-react';
import {
  E_FORMATION_BASE,
  eFormationModuleQuizPath,
} from '@/lib/portal/e-formation-paths';
import { formatPortalDate } from '@/lib/portal/format-portal-date';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalLabel, portalMuted, portalSectionTitle } from '@/components/portal/layout/portal-ui';
import { Badge } from '@repo/ui/badge';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';

export type QuizModuleRow = {
  id: string;
  title: string;
  position: number;
  isFree: boolean;
  accessible: boolean;
  completed: boolean;
  lockReason: string | null;
  quizzes: Array<{
    id: string;
    name: string;
    unlocked: boolean;
    lockReason: string | null;
    attempt: { score: number; passed: boolean; createdAt: string } | null;
  }>;
};

type Props = {
  modules: QuizModuleRow[];
  courseId: string | null;
};

export function EFormationQuizPanel({ modules, courseId }: Props) {
  if (modules.length === 0) {
    return (
      <PortalSection title="Aucun quiz" icon={ClipboardCheck} variant="outline">
        <p className={portalMuted}>Aucun quiz disponible pour votre formation.</p>
      </PortalSection>
    );
  }

  return (
    <div className="space-y-4">
      <p className={portalMuted}>
        Quiz débloqués au fil de votre progression (UV précédente validée ou session ouverte).
      </p>

      <div className="grid gap-3 lg:grid-cols-2">
        {modules.map((mod) =>
          mod.quizzes.map((quiz) => {
            const passed = quiz.attempt?.passed;
            const locked = !quiz.unlocked;
            return (
              <article
                key={quiz.id}
                className={cn(
                  'group overflow-hidden rounded-xl border bg-card shadow-xs transition-all',
                  !locked && !passed && 'hover:border-primary/30 hover:shadow-sm',
                  passed && 'border-emerald-500/20 bg-emerald-500/[0.03]',
                )}
              >
                <div className="flex items-start gap-3 border-b border-border/50 px-4 py-3">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold',
                      passed
                        ? 'bg-emerald-500/10 text-emerald-600'
                        : locked
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-primary/10 text-primary',
                    )}
                  >
                    {passed ? <CheckCircle2 className="size-4" /> : `UV${mod.position}`}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={portalLabel}>
                      UV {mod.position}
                      {mod.isFree ? ' · Prépa CNAPS' : ''}
                    </p>
                    <h3 className={cn('mt-0.5', portalSectionTitle)}>{quiz.name}</h3>
                    <p className={cn('mt-0.5 line-clamp-1', portalMuted)}>{mod.title}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 text-[13px]">
                    {quiz.lockReason && locked ? (
                      <p className="text-amber-700 dark:text-amber-300">{quiz.lockReason}</p>
                    ) : passed && quiz.attempt ? (
                      <p className="text-emerald-600">
                        Score {quiz.attempt.score} % · {formatPortalDate(quiz.attempt.createdAt)}
                      </p>
                    ) : (
                      <p className="text-muted-foreground">Quiz de validation des acquis</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {passed ? (
                      <Badge variant="success" appearance="light" className="text-[10px]">
                        Validé
                      </Badge>
                    ) : locked ? (
                      <Badge variant="secondary" appearance="light" className="text-[10px]">
                        <Lock className="mr-1 size-3" />
                        Verrouillé
                      </Badge>
                    ) : (
                      <Button asChild size="sm" className="text-[13px]">
                        <Link
                          href={
                            courseId
                              ? eFormationModuleQuizPath(courseId, mod.id)
                              : E_FORMATION_BASE
                          }
                        >
                          Passer le quiz
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          }),
        )}
      </div>
    </div>
  );
}
