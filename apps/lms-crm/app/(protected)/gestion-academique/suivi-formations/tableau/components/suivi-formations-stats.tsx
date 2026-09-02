'use client';

import type { ComponentType } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import {
  MODULE_LANDING_STATS_GRID_ROW,
  MODULE_PAGE_KPI_COUNT,
  SECTION_KPI_CARD_ACCENTS,
  kpiStatsGridClass,
} from '@/components/common/stat-card-metric-layout';
import {
  Award,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Flag,
  GraduationCap,
  Timer,
  UserCheck,
  Users,
  Workflow,
  XCircle,
} from 'lucide-react';
import { Skeleton } from '@repo/ui/skeleton';
import { cn } from '@/lib/utils';
import type { SuiviFormationsStatsPayload } from '../types/suivi-formations-api';

export type SuiviFormationsStatsTab =
  | 'stagiaires'
  | 'journal'
  | 'documents'
  | 'examens'
  | 'certifications'
  | 'eformation';

type StatCard = {
  title: string;
  value: string | number;
  subtitle: string;
  Icon: ComponentType<{ className?: string }>;
};

type ExamStatsPayload = {
  pendingExams: number;
  passedExams: number;
  failedOrAbsent: number;
  attestations: number;
  completed: number;
};

type CertificationStatsPayload = {
  totalAttestations: number;
  passedWithoutAttestation: number;
  readyToClose: number;
  validated: number;
  completed: number;
};

type AutomationRunRow = {
  status: string;
};

export const suiviFormationsStatsQueryKey = (
  sessionId: string | null,
  activeTab: SuiviFormationsStatsTab,
) => ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'stats', sessionId, activeTab] as const;

/** Préfixe pour invalider toutes les stats d'une session (tous onglets). */
export const suiviFormationsStatsSessionQueryKey = (sessionId: string | null) =>
  ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'stats', sessionId] as const;

function buildSessionCards(
  data: SuiviFormationsStatsPayload,
  tab: 'stagiaires' | 'journal' | 'documents',
): StatCard[] {
  if (tab === 'journal') {
    return [
      {
        title: 'Présents aujourd’hui',
        value: data.presentToday,
        subtitle: 'Marqués présents ou en retard',
        Icon: UserCheck,
      },
      {
        title: 'Émargement du jour',
        value: `${data.emargementSlotsCompleted}/${data.emargementSlotsTotal}`,
        subtitle: 'Créneaux matin / soir complétés',
        Icon: ClipboardCheck,
      },
      {
        title: 'Stagiaires inscrits',
        value: data.participantsTotal,
        subtitle: data.formationName,
        Icon: Users,
      },
      {
        title: 'Progression e-learning',
        value: `${data.avgProgressPercent} %`,
        subtitle: 'Moyenne UV complétées',
        Icon: BookOpenCheck,
      },
      {
        title: 'Quiz validés',
        value: `${data.avgQuizCompletionPercent} %`,
        subtitle: 'Moyenne par stagiaire',
        Icon: GraduationCap,
      },
    ];
  }

  if (tab === 'documents') {
    return [
      {
        title: 'Stagiaires inscrits',
        value: data.participantsTotal,
        subtitle: data.formationName,
        Icon: Users,
      },
      {
        title: 'Dossiers actifs',
        value: data.participantsTotal,
        subtitle: 'Un dossier par inscrit session',
        Icon: ClipboardList,
      },
      {
        title: 'Progression parcours',
        value: `${data.avgProgressPercent} %`,
        subtitle: 'Moyenne e-learning',
        Icon: BookOpenCheck,
      },
      {
        title: 'Présents aujourd’hui',
        value: data.presentToday,
        subtitle: 'Suivi présence du jour',
        Icon: UserCheck,
      },
      {
        title: 'Émargement du jour',
        value: `${data.emargementSlotsCompleted}/${data.emargementSlotsTotal}`,
        subtitle: 'Créneaux complétés',
        Icon: ClipboardCheck,
      },
    ];
  }

  return [
    {
      title: 'Stagiaires inscrits',
      value: data.participantsTotal,
      subtitle: data.formationName,
      Icon: Users,
    },
    {
      title: 'Progression e-learning',
      value: `${data.avgProgressPercent} %`,
      subtitle: 'Moyenne UV complétées',
      Icon: BookOpenCheck,
    },
    {
      title: 'Présents aujourd’hui',
      value: data.presentToday,
      subtitle: 'Marqués présents ou en retard',
      Icon: UserCheck,
    },
    {
      title: 'Émargement du jour',
      value: `${data.emargementSlotsCompleted}/${data.emargementSlotsTotal}`,
      subtitle: 'Créneaux matin / soir complétés',
      Icon: ClipboardCheck,
    },
    {
      title: 'Quiz validés',
      value: `${data.avgQuizCompletionPercent} %`,
      subtitle: 'Moyenne par stagiaire',
      Icon: GraduationCap,
    },
  ];
}

function buildExamCards(data: ExamStatsPayload): StatCard[] {
  return [
    {
      title: 'Examens en attente',
      value: data.pendingExams,
      subtitle: 'Inscrits session sans résultat',
      Icon: Timer,
    },
    {
      title: 'Examens réussis',
      value: data.passedExams,
      subtitle: 'Éligibles attestation',
      Icon: CheckCircle2,
    },
    {
      title: 'Non aboutis',
      value: data.failedOrAbsent,
      subtitle: 'Échec ou absence',
      Icon: XCircle,
    },
    {
      title: 'Attestations liées',
      value: data.attestations,
      subtitle: 'Délivrées sur le parcours',
      Icon: Award,
    },
    {
      title: 'Dossiers terminés',
      value: data.completed,
      subtitle: 'Parcours clôturés',
      Icon: ClipboardList,
    },
  ];
}

function buildCertificationCards(data: CertificationStatsPayload): StatCard[] {
  return [
    {
      title: 'Attestations délivrées',
      value: data.totalAttestations,
      subtitle: 'Enregistrées CRM',
      Icon: Award,
    },
    {
      title: 'Réussis sans attestation',
      value: data.passedWithoutAttestation,
      subtitle: 'Examen OK — attestation à faire',
      Icon: Users,
    },
    {
      title: 'Prêts à clôturer',
      value: data.readyToClose,
      subtitle: 'Examen + attestation OK',
      Icon: CheckCircle2,
    },
    {
      title: 'Dossiers validés',
      value: data.validated,
      subtitle: 'Parcours en cours',
      Icon: UserCheck,
    },
    {
      title: 'Parcours terminés',
      value: data.completed,
      subtitle: 'Dossiers COMPLETED',
      Icon: Flag,
    },
  ];
}

function buildEformationCards(
  data: SuiviFormationsStatsPayload,
  automationRuns: AutomationRunRow[],
): StatCard[] {
  const running = automationRuns.filter((r) => r.status === 'RUNNING').length;
  const completed = automationRuns.filter((r) => r.status === 'COMPLETED').length;

  return [
    {
      title: 'Progression e-learning',
      value: `${data.avgProgressPercent} %`,
      subtitle: 'Moyenne UV complétées',
      Icon: BookOpenCheck,
    },
    {
      title: 'Quiz validés',
      value: `${data.avgQuizCompletionPercent} %`,
      subtitle: 'Moyenne par stagiaire',
      Icon: GraduationCap,
    },
    {
      title: 'Stagiaires actifs',
      value: data.participantsTotal,
      subtitle: data.formationName,
      Icon: Users,
    },
    {
      title: 'Circuits en cours',
      value: running,
      subtitle: 'Automatisations Qualiopi / n8n',
      Icon: Workflow,
    },
    {
      title: 'Circuits terminés',
      value: completed,
      subtitle: 'Exécutions clôturées',
      Icon: CheckCircle2,
    },
  ];
}

export function SuiviFormationsStats({
  sessionId,
  activeTab = 'stagiaires',
  variant = 'row',
}: {
  sessionId: string | null;
  activeTab?: SuiviFormationsStatsTab;
  variant?: 'grid' | 'row';
}) {
  const usesSessionStats = ['stagiaires', 'journal', 'documents', 'eformation'].includes(activeTab);
  const usesExamStats = activeTab === 'examens';
  const usesCertificationStats = activeTab === 'certifications';

  const sessionQuery = useQuery({
    queryKey: suiviFormationsStatsQueryKey(sessionId, activeTab),
    queryFn: async (): Promise<SuiviFormationsStatsPayload> => {
      if (!sessionId) throw new Error('Session requise.');
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/stats`,
      );
      if (!res.ok) throw new Error('Indicateurs suivi indisponibles.');
      const j = await res.json();
      if (!j?.success || !j?.data) throw new Error('Réponse stats invalide.');
      return j.data as SuiviFormationsStatsPayload;
    },
    enabled: Boolean(sessionId) && usesSessionStats,
    staleTime: 60_000,
  });

  const examQuery = useQuery({
    queryKey: ['vie-scolaire', 'examens', 'stats', sessionId],
    queryFn: async (): Promise<ExamStatsPayload> => {
      const params = new URLSearchParams();
      if (sessionId) params.set('sessionId', sessionId);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens/stats?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Stats examens indisponibles');
      return body.data as ExamStatsPayload;
    },
    enabled: Boolean(sessionId) && usesExamStats,
    staleTime: 60_000,
  });

  const certificationQuery = useQuery({
    queryKey: ['vie-scolaire', 'certifications', 'stats', sessionId],
    queryFn: async (): Promise<CertificationStatsPayload> => {
      const params = new URLSearchParams();
      if (sessionId) params.set('sessionId', sessionId);
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/certifications/stats?${params}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Stats certifications indisponibles');
      return body.data as CertificationStatsPayload;
    },
    enabled: Boolean(sessionId) && usesCertificationStats,
    staleTime: 60_000,
  });

  const automationQuery = useQuery({
    queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'automation-runs', sessionId],
    queryFn: async (): Promise<AutomationRunRow[]> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/automation-runs`,
      );
      if (!res.ok) return [];
      const j = await res.json();
      return (j?.data?.items ?? []) as AutomationRunRow[];
    },
    enabled: Boolean(sessionId) && activeTab === 'eformation',
    staleTime: 30_000,
  });

  const gridClasses =
    variant === 'row' ? MODULE_LANDING_STATS_GRID_ROW : kpiStatsGridClass(MODULE_PAGE_KPI_COUNT);

  if (!sessionId) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        Sélectionnez une session pour afficher les indicateurs de suivi.
      </div>
    );
  }

  const isLoading =
    (usesSessionStats && sessionQuery.isLoading) ||
    (usesExamStats && examQuery.isLoading) ||
    (usesCertificationStats && certificationQuery.isLoading) ||
    (activeTab === 'eformation' && (sessionQuery.isLoading || automationQuery.isLoading));

  const error =
    (usesSessionStats && sessionQuery.error) ||
    (usesExamStats && examQuery.error) ||
    (usesCertificationStats && certificationQuery.error);

  if (isLoading) {
    return (
      <div className={gridClasses}>
        {Array.from({ length: MODULE_PAGE_KPI_COUNT }, (_, i) => i + 1).map((i) => (
          <div key={i} className="rounded-xl border border-border/70 p-4 shadow-none">
            <Skeleton className="mb-3 h-8 w-8 rounded-lg" />
            <Skeleton className="mb-2 h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {(error as Error)?.message ?? 'Impossible de charger les indicateurs.'}
      </div>
    );
  }

  let cards: StatCard[] = [];

  if (usesExamStats && examQuery.data) {
    cards = buildExamCards(examQuery.data);
  } else if (usesCertificationStats && certificationQuery.data) {
    cards = buildCertificationCards(certificationQuery.data);
  } else if (activeTab === 'eformation' && sessionQuery.data) {
    cards = buildEformationCards(sessionQuery.data, automationQuery.data ?? []);
  } else if (sessionQuery.data) {
    cards = buildSessionCards(
      sessionQuery.data,
      activeTab as 'stagiaires' | 'journal' | 'documents',
    );
  }

  if (cards.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-6 text-sm text-muted-foreground">
        Aucun indicateur disponible pour cette vue.
      </div>
    );
  }

  return (
    <div className={gridClasses}>
      {cards.map((c, index) => {
        const Icon = c.Icon;
        const accent = SECTION_KPI_CARD_ACCENTS[index % SECTION_KPI_CARD_ACCENTS.length];
        return (
          <div
            key={c.title}
            className="relative overflow-hidden rounded-xl border border-border/70 bg-gradient-to-br from-background via-background to-muted/30 px-4 py-4"
          >
            <div className={cn('absolute -end-8 -top-8 size-24 rounded-full', accent.orb)} aria-hidden />
            <div className="relative flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">{c.title}</p>
                <p className="mt-1 text-2xl font-semibold text-foreground">{c.value}</p>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{c.subtitle}</p>
              </div>
              <div
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg border',
                  accent.box,
                )}
              >
                <Icon className={cn('size-5', accent.icon)} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
