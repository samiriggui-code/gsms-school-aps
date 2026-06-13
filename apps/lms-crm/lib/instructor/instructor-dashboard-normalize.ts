import type {
  InstructorChartSlice,
  InstructorDashboardPayload,
  InstructorSessionRow,
  InstructorSessionStatus,
} from '@/lib/instructor/instructor-types';

const SESSION_STATUS_META: Record<
  InstructorSessionStatus,
  { name: string; color: string }
> = {
  upcoming: { name: 'À venir', color: '#3b82f6' },
  ongoing: { name: 'En cours', color: '#10b981' },
  past: { name: 'Terminées', color: '#94a3b8' },
  unknown: { name: 'Planifiées', color: '#f59e0b' },
};

export function buildSessionsByStatusChart(
  sessions: InstructorSessionRow[],
): InstructorChartSlice[] {
  const counts = new Map<InstructorSessionStatus, number>();
  for (const s of sessions) {
    counts.set(s.status, (counts.get(s.status) ?? 0) + 1);
  }
  return (['upcoming', 'ongoing', 'past', 'unknown'] as const)
    .map((status) => ({
      name: SESSION_STATUS_META[status].name,
      value: counts.get(status) ?? 0,
      color: SESSION_STATUS_META[status].color,
    }))
    .filter((slice) => slice.value > 0);
}

const EMPTY_STATS: InstructorDashboardPayload['stats'] = {
  sessionCount: 0,
  upcomingSessionCount: 0,
  formationCount: 0,
  traineeCount: 0,
  courseCount: 0,
  avgProgressPercent: 0,
};

const EMPTY_HIGHLIGHTS: InstructorDashboardPayload['highlights'] = {
  overallProgress: 0,
  trend: 0,
  rows: [],
  categories: [],
};

/** Garantit tous les champs attendus par l'UI (rétrocompat / réponses partielles). Sans Prisma — safe client. */
export function normalizeInstructorDashboardPayload(
  raw: Partial<InstructorDashboardPayload> | null | undefined,
): InstructorDashboardPayload {
  const sessions = raw?.sessions ?? [];
  return {
    stats: raw?.stats ?? EMPTY_STATS,
    nextSession: raw?.nextSession ?? null,
    sessions,
    formations: raw?.formations ?? [],
    courses: raw?.courses ?? [],
    charts: raw?.charts ?? { sessionsByStatus: buildSessionsByStatusChart(sessions) },
    activity: raw?.activity ?? null,
    highlights: raw?.highlights ?? EMPTY_HIGHLIGHTS,
    alerts: raw?.alerts ?? [],
    overview: raw?.overview ?? { sessions: [], trainees: [], announcements: [] },
  };
}
