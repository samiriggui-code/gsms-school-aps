'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ClipboardCheck, Loader2, Lock, Target, Trophy } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import {
  E_FORMATION_API,
  E_FORMATION_BASE,
  E_FORMATION_QUIZ_API,
} from '@/lib/portal/e-formation-paths';
import { lmsAccessLabel, type LmsAccessTier } from '@/lib/portal/lms-access-shared';
import { PortalPageHero } from '@/components/portal/layout/portal-page-hero';
import { PortalPageShell } from '@/components/portal/layout/portal-page-shell';
import { PortalStatGrid } from '@/components/portal/layout/portal-stat-grid';
import {
  EFormationQuizPanel,
  type QuizModuleRow,
} from '@/components/portal/e-formation/e-formation-quiz-panel';

export function EFormationQuizPage() {
  const [tier, setTier] = useState<LmsAccessTier>('none');
  const [courseId, setCourseId] = useState<string | null>(null);
  const [quizModules, setQuizModules] = useState<QuizModuleRow[]>([]);
  const [summary, setSummary] = useState({ total: 0, unlocked: 0, passed: 0 });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [courseRes, quizRes] = await Promise.all([
          apiFetch(E_FORMATION_API),
          apiFetch(E_FORMATION_QUIZ_API),
        ]);

        const courseJson = (await courseRes.json()) as {
          success?: boolean;
          data?: { tier: LmsAccessTier; courses: Array<{ id: string }> };
          error?: { message?: string };
        };
        const quizJson = (await quizRes.json()) as {
          success?: boolean;
          data?: { modules: QuizModuleRow[]; summary: typeof summary };
        };

        if (!courseRes.ok || !courseJson.success || !courseJson.data) {
          throw new Error(courseJson.error?.message ?? 'Impossible de charger les quiz.');
        }
        if (!cancelled) {
          setTier(courseJson.data.tier);
          setCourseId(courseJson.data.courses[0]?.id ?? null);
          if (quizJson.success && quizJson.data) {
            setQuizModules(quizJson.data.modules);
            setSummary(quizJson.data.summary);
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

  const stats = useMemo(
    () => [
      {
        label: 'Quiz total',
        value: summary.total || '—',
        hint: 'Dans votre parcours',
        icon: ClipboardCheck,
        tone: 'default' as const,
      },
      {
        label: 'Validés',
        value: summary.total ? `${summary.passed}/${summary.total}` : '—',
        hint: `${Math.round(summary.total ? (summary.passed / summary.total) * 100 : 0)} % de réussite`,
        icon: Trophy,
        tone: 'success' as const,
        progress: summary.total ? (summary.passed / summary.total) * 100 : undefined,
      },
      {
        label: 'Débloqués',
        value: summary.unlocked,
        hint: 'Accessibles maintenant',
        icon: Target,
        tone: 'primary' as const,
      },
      {
        label: 'En attente',
        value: Math.max(0, summary.total - summary.unlocked),
        hint: lmsAccessLabel(tier),
        icon: Lock,
        tone: 'warning' as const,
      },
    ],
    [summary, tier],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-[13px] text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        Chargement de vos quiz…
      </div>
    );
  }

  if (error) {
    return (
      <PortalPageShell width="narrow">
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-[13px] text-destructive">
          {error}
        </div>
      </PortalPageShell>
    );
  }

  return (
    <PortalPageShell width="wide" className="space-y-5 lg:space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={E_FORMATION_BASE}
          className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="size-3.5" />
          Retour au parcours
        </Link>
      </div>

      <PortalPageHero
        badge={lmsAccessLabel(tier)}
        title="Mes quiz"
        description="Validez chaque UV avec son quiz de contrôle des connaissances."
      />

      <PortalStatGrid items={stats} columns={4} />

      <EFormationQuizPanel modules={quizModules} courseId={courseId} />
    </PortalPageShell>
  );
}
