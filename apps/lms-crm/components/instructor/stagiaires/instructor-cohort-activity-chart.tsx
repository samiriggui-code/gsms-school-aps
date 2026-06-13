'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { Loader2, TrendingUp } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { INSTRUCTOR_STAGIAIRES_ACTIVITY_API } from '@/lib/instructor/instructor-paths';
import type { CohortActivityPayload } from '@/lib/instructor/instructor-types';
import { PortalSection } from '@/components/portal/layout/portal-section';
import { portalMuted } from '@/components/portal/layout/portal-ui';

const InstructorCohortActivityChartInner = dynamic(
  () =>
    import('./instructor-cohort-activity-chart-inner').then((m) => ({
      default: m.InstructorCohortActivityChartInner,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Graphique…
      </div>
    ),
  },
);

export function InstructorCohortActivityChart({
  sessionId,
  className,
}: {
  sessionId: string | null;
  className?: string;
}) {
  const [data, setData] = useState<CohortActivityPayload | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!sessionId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    (async () => {
      try {
        const res = await apiFetch(`${INSTRUCTOR_STAGIAIRES_ACTIVITY_API}?sessionId=${sessionId}`);
        const json = (await res.json()) as { success?: boolean; data?: CohortActivityPayload };
        if (!cancelled && res.ok && json.success && json.data) setData(json.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  if (!sessionId) {
    return (
      <PortalSection
        title="Activité e-formation (30 jours)"
        icon={TrendingUp}
        description="Sélectionnez une session pour voir la cohorte."
        className={className}
      >
        <p className={portalMuted}>
          La session présentielle pilote le parcours ; l’e-formation reflète les révisions liées au
          programme en classe.
        </p>
      </PortalSection>
    );
  }

  const hasActivity = data != null && (data.totals.lessons > 0 || data.totals.quizzes > 0);

  return (
    <PortalSection
      title="Activité e-formation — cohorte (30 jours)"
      icon={TrendingUp}
      description={
        data
          ? `${data.participantCount} stagiaire(s) · ${data.totals.lessons} UV · ${data.totals.quizzes} quiz`
          : undefined
      }
      className={className}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-12 text-[13px] text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </div>
      ) : !data || !hasActivity ? (
        <p className={portalMuted}>
          Aucune activité e-formation enregistrée sur les 30 derniers jours pour cette session.
        </p>
      ) : (
        <InstructorCohortActivityChartInner data={data} />
      )}
    </PortalSection>
  );
}
