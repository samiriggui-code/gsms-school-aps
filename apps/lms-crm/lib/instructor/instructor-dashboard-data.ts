import { buildNotificationScopeWhere } from '@/lib/notifications-scope';
import { listInstructorAnnouncements } from '@/lib/instructor/instructor-announcements-data';
import {
  listInstructorFormations,
  listInstructorSessions,
} from '@/lib/instructor/instructor-assignments-data';
import { listInstructorTrainees, buildInstructorGlobalActivity } from '@/lib/instructor/instructor-trainees-data';
import type {
  InstructorCourseRow,
  InstructorDashboardAlert,
  InstructorDashboardPayload,
  InstructorSessionRow,
  InstructorSessionStatus,
  InstructorTraineeRow,
} from '@/lib/instructor/instructor-types';
import {
  buildSessionsByStatusChart,
  normalizeInstructorDashboardPayload,
} from '@/lib/instructor/instructor-dashboard-normalize';
import { prisma } from '@/lib/prisma';

export type {
  InstructorCourseRow,
  InstructorDashboardPayload,
  InstructorFormationRow,
  InstructorSessionRow,
  InstructorSessionStatus,
} from '@/lib/instructor/instructor-types';

function daysUntil(dateIso: string | null): number | null {
  if (!dateIso) return null;
  const target = new Date(dateIso);
  if (Number.isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function buildDashboardAlerts(
  sessions: InstructorSessionRow[],
  trainees: InstructorTraineeRow[],
  announcements: Awaited<ReturnType<typeof listInstructorAnnouncements>>,
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    href: string | null;
    createdAt: Date;
    readAt: Date | null;
  }>,
): InstructorDashboardAlert[] {
  const alerts: InstructorDashboardAlert[] = [];
  const nowIso = new Date().toISOString();

  for (const session of sessions) {
    if (session.status === 'ongoing') {
      alerts.push({
        id: `session-ongoing-${session.id}`,
        kind: 'session',
        severity: 'INFO',
        title: `Session en cours — ${session.formation.name}`,
        body: `${session.dateDisplayLabel} · ${session.participantCount} stagiaire(s)`,
        href: `/formateur/sessions?highlight=${session.id}`,
        createdAt: session.startDate ?? nowIso,
      });
      continue;
    }

    if (session.status !== 'upcoming') continue;

    const days = daysUntil(session.startDate);
    if (days == null) continue;

    if (days <= 7 && days >= 0) {
      alerts.push({
        id: `session-upcoming-${session.id}`,
        kind: 'session',
        severity: days <= 2 ? 'CRITICAL' : 'WARNING',
        title:
          days === 0
            ? `Session aujourd'hui — ${session.formation.name}`
            : `Session dans ${days} jour${days > 1 ? 's' : ''} — ${session.formation.name}`,
        body: `${session.dateDisplayLabel} · ${session.location}`,
        href: `/formateur/sessions?highlight=${session.id}`,
        createdAt: session.startDate ?? nowIso,
      });
    }
  }

  for (const trainee of trainees) {
    if (trainee.totalChapters > 0 && trainee.progressPercent < 25) {
      alerts.push({
        id: `trainee-low-${trainee.participantId}`,
        kind: 'trainee',
        severity: trainee.progressPercent === 0 ? 'WARNING' : 'INFO',
        title: `Progression faible — ${trainee.name ?? trainee.email}`,
        body: `${trainee.formationName} · ${trainee.progressPercent} % du parcours LMS`,
        href: `/formateur/stagiaires?session=${trainee.sessionId}`,
        createdAt: trainee.lastActivityAt ?? nowIso,
      });
    }
  }

  for (const ann of announcements.filter((a) => a.state === 'draft').slice(0, 3)) {
    alerts.push({
      id: `announcement-draft-${ann.id}`,
      kind: 'announcement',
      severity: 'INFO',
      title: `Brouillon — ${ann.title}`,
      body: `${ann.formationName}${ann.sessionLabel ? ` · ${ann.sessionLabel}` : ''}`,
      href: '/formateur/annonces',
      createdAt: ann.publishedAt,
    });
  }

  for (const n of notifications) {
    alerts.push({
      id: `notification-${n.id}`,
      kind: 'notification',
      severity: 'INFO',
      title: n.title,
      body: n.body,
      href: n.href ?? '/formateur/notifications',
      createdAt: n.createdAt.toISOString(),
      unread: !n.readAt,
    });
  }

  return alerts
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 12);
}

function buildHighlights(
  stats: InstructorDashboardPayload['stats'],
  sessions: InstructorSessionRow[],
  trainees: InstructorTraineeRow[],
): InstructorDashboardPayload['highlights'] {
  const ongoing = sessions.filter((s) => s.status === 'ongoing').length;
  const upcoming = sessions.filter((s) => s.status === 'upcoming').length;
  const activeTrainees = trainees.filter((t) => t.lastActivityAt != null).length;
  const lowProgress = trainees.filter((t) => t.totalChapters > 0 && t.progressPercent < 50).length;

  return {
    overallProgress: stats.avgProgressPercent,
    trend: activeTrainees > 0 ? Math.min(100, Math.round((activeTrainees / Math.max(trainees.length, 1)) * 100)) : 0,
    categories: [
      { badgeColor: 'bg-blue-500', label: 'Sessions' },
      { badgeColor: 'bg-green-500', label: 'Stagiaires' },
      { badgeColor: 'bg-violet-500', label: 'E-formation' },
    ],
    rows: [
      {
        icon: 'CalendarDays',
        text: 'Sessions à venir',
        total: upcoming,
        stats: stats.sessionCount > 0 ? Math.round((upcoming / stats.sessionCount) * 100) : 0,
        trend: upcoming > 0 ? 'up' : 'neutral',
      },
      {
        icon: 'TrendingUp',
        text: 'Sessions en cours',
        total: ongoing,
        stats: stats.sessionCount > 0 ? Math.round((ongoing / stats.sessionCount) * 100) : 0,
        trend: ongoing > 0 ? 'up' : 'neutral',
      },
      {
        icon: 'Users',
        text: 'Stagiaires actifs LMS',
        total: activeTrainees,
        stats: stats.traineeCount > 0 ? Math.round((activeTrainees / stats.traineeCount) * 100) : 0,
        trend: activeTrainees > 0 ? 'up' : 'neutral',
        unit: `/${stats.traineeCount}`,
      },
      {
        icon: 'BookOpen',
        text: 'Progression < 50 %',
        total: lowProgress,
        stats: stats.traineeCount > 0 ? Math.round((lowProgress / stats.traineeCount) * 100) : 0,
        trend: lowProgress > 0 ? 'down' : 'neutral',
      },
      {
        icon: 'GraduationCap',
        text: 'Parcours LMS',
        total: stats.courseCount,
        stats: stats.formationCount > 0 ? Math.round((stats.courseCount / stats.formationCount) * 100) : 0,
        trend: 'neutral',
      },
    ],
  };
}

export async function buildInstructorDashboard(userId: string): Promise<InstructorDashboardPayload> {
  const [sessions, formations, trainees, announcements, recentNotifications] = await Promise.all([
    listInstructorSessions(userId),
    listInstructorFormations(userId),
    listInstructorTrainees(userId),
    listInstructorAnnouncements(userId),
    prisma.inAppNotification.findMany({
      where: {
        userId,
        archivedAt: null,
        ...buildNotificationScopeWhere('formateur'),
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        body: true,
        href: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);

  let activity: InstructorDashboardPayload['activity'] = null;
  try {
    activity = await buildInstructorGlobalActivity(userId);
  } catch (error) {
    console.error('[instructor-dashboard] activity series failed:', error);
  }

  const upcomingSessions = sessions.filter((s) => s.status === 'upcoming' || s.status === 'ongoing');
  const nextSession =
    sessions.find((s) => s.status === 'upcoming') ??
    sessions.find((s) => s.status === 'ongoing') ??
    sessions[0] ??
    null;

  const sessionIds = sessions.map((s) => s.id);
  const participants =
    sessionIds.length > 0
      ? await prisma.formationSessionParticipant.findMany({
          where: { sessionId: { in: sessionIds } },
          select: { userId: true },
        })
      : [];
  const traineeUserIds = Array.from(new Set(participants.map((p) => p.userId)));

  const courseIds = Array.from(
    new Set(formations.map((f) => f.courseId).filter((id): id is string => Boolean(id))),
  );

  let avgProgressPercent = 0;
  if (trainees.length > 0) {
    avgProgressPercent = Math.round(
      trainees.reduce((sum, t) => sum + t.progressPercent, 0) / trainees.length,
    );
  } else if (courseIds.length > 0 && traineeUserIds.length > 0) {
    const chapters = await prisma.chapter.findMany({
      where: { courseId: { in: courseIds }, isPublished: true },
      select: { id: true },
    });
    const chapterIds = chapters.map((c) => c.id);
    if (chapterIds.length > 0) {
      const completed = await prisma.userProgress.count({
        where: {
          userId: { in: traineeUserIds },
          isCompleted: true,
          chapterId: { in: chapterIds },
        },
      });
      const denominator = chapterIds.length * traineeUserIds.length;
      avgProgressPercent = denominator > 0 ? Math.round((completed / denominator) * 100) : 0;
    }
  }

  const coursesRaw =
    courseIds.length > 0
      ? await prisma.course.findMany({
          where: { id: { in: courseIds } },
          select: {
            id: true,
            title: true,
            isPublished: true,
            formationCatalog: { select: { id: true, name: true } },
            chapters: {
              where: { isPublished: true },
              select: {
                id: true,
                _count: { select: { activities: true } },
              },
            },
          },
        })
      : [];

  const courses: InstructorCourseRow[] = coursesRaw.map((c) => ({
    id: c.id,
    title: c.title,
    formationId: c.formationCatalog?.id ?? '',
    formationName: c.formationCatalog?.name ?? c.title,
    chapterCount: c.chapters.length,
    activityCount: c.chapters.reduce((sum, ch) => sum + ch._count.activities, 0),
    isPublished: c.isPublished,
  }));

  const stats = {
    sessionCount: sessions.length,
    upcomingSessionCount: upcomingSessions.length,
    formationCount: formations.length,
    traineeCount: traineeUserIds.length,
    courseCount: courses.length,
    avgProgressPercent,
  };

  const overviewTrainees = [...trainees]
    .sort((a, b) => {
      if (a.progressPercent !== b.progressPercent) return a.progressPercent - b.progressPercent;
      const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
      const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 12);

  const overviewSessions = [...sessions]
    .sort((a, b) => {
      const order: Record<InstructorSessionStatus, number> = {
        ongoing: 0,
        upcoming: 1,
        unknown: 2,
        past: 3,
      };
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      const aDate = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      const bDate = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
      return aDate - bDate;
    })
    .slice(0, 12);

  return normalizeInstructorDashboardPayload({
    stats,
    nextSession,
    sessions,
    formations,
    courses,
    charts: {
      sessionsByStatus: buildSessionsByStatusChart(sessions),
    },
    activity,
    highlights: buildHighlights(stats, sessions, trainees),
    alerts: buildDashboardAlerts(sessions, trainees, announcements, recentNotifications),
    overview: {
      sessions: overviewSessions,
      trainees: overviewTrainees,
      announcements: announcements.slice(0, 8),
    },
  });
}
