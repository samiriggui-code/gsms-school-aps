import {
  BookOpen,
  CalendarClock,
  CalendarDays,
  GraduationCap,
  Layers,
  Megaphone,
  Send,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import type { ModuleKpiStatItem } from '@/components/common/module-kpi-stats-row';
import type {
  InstructorAnnouncementRow,
  InstructorDashboardPayload,
  InstructorFormationRow,
  InstructorSessionRow,
  InstructorTraineeRow,
} from '@/lib/instructor/instructor-types';

type CourseListRow = {
  formationName: string;
  chapterCount: number;
  activityCount: number;
};

export function instructorDashboardKpis(
  stats: InstructorDashboardPayload['stats'],
): ModuleKpiStatItem[] {
  return [
    {
      label: 'Formations',
      value: stats.formationCount,
      subtitle: 'Catalogue assigné',
      icon: GraduationCap,
    },
    {
      label: 'Sessions',
      value: stats.sessionCount,
      subtitle: `${stats.upcomingSessionCount} à venir ou en cours`,
      icon: CalendarDays,
    },
    {
      label: 'Stagiaires',
      value: stats.traineeCount,
      subtitle: 'Sur vos sessions',
      icon: Users,
    },
    {
      label: 'Parcours LMS',
      value: stats.courseCount,
      subtitle: 'Liés à vos formations',
      icon: BookOpen,
    },
    {
      label: 'Progression',
      value: `${stats.avgProgressPercent} %`,
      subtitle: 'Moyenne e-formation',
      icon: TrendingUp,
    },
  ];
}

export function instructorFormationsKpis(rows: InstructorFormationRow[]): ModuleKpiStatItem[] {
  const withCourse = rows.filter((r) => r.courseId).length;
  const sessions = rows.reduce((n, r) => n + r.assignedSessionCount, 0);
  const active = rows.reduce((n, r) => n + r.upcomingSessionCount, 0);
  const trainees = rows.reduce((n, r) => n + r.participantCount, 0);

  return [
    {
      label: 'Formations',
      value: rows.length,
      subtitle: 'Référent sur le catalogue',
      icon: GraduationCap,
    },
    {
      label: 'Sessions',
      value: sessions,
      subtitle: 'Affectations cumulées',
      icon: CalendarDays,
    },
    {
      label: 'Actives',
      value: active,
      subtitle: 'À venir ou en cours',
      icon: CalendarClock,
    },
    {
      label: 'Stagiaires',
      value: trainees,
      subtitle: 'Inscrits sur vos sessions',
      icon: Users,
    },
    {
      label: 'E-formation',
      value: withCourse,
      subtitle: 'Parcours LMS rattachés',
      icon: BookOpen,
    },
  ];
}

export function instructorSessionsKpis(rows: InstructorSessionRow[]): ModuleKpiStatItem[] {
  const upcoming = rows.filter((r) => r.status === 'upcoming').length;
  const ongoing = rows.filter((r) => r.status === 'ongoing').length;
  const past = rows.filter((r) => r.status === 'past').length;
  const trainees = rows.reduce((n, r) => n + r.participantCount, 0);

  return [
    {
      label: 'Sessions',
      value: rows.length,
      subtitle: 'Assignées par l’école',
      icon: CalendarDays,
    },
    {
      label: 'À venir',
      value: upcoming,
      subtitle: 'Prochainement',
      icon: CalendarClock,
    },
    {
      label: 'En cours',
      value: ongoing,
      subtitle: 'Session en animation',
      icon: TrendingUp,
    },
    {
      label: 'Stagiaires',
      value: trainees,
      subtitle: 'Participants cumulés',
      icon: Users,
    },
    {
      label: 'Terminées',
      value: past,
      subtitle: 'Sessions clôturées',
      icon: GraduationCap,
    },
  ];
}

export function instructorStagiairesKpis(rows: InstructorTraineeRow[]): ModuleKpiStatItem[] {
  const avgProgress =
    rows.length > 0
      ? Math.round(rows.reduce((n, r) => n + r.progressPercent, 0) / rows.length)
      : 0;
  const sessions = new Set(rows.map((r) => r.sessionId)).size;
  const quizOk = rows.filter((r) => r.quizTotal > 0 && r.quizPassed >= r.quizTotal).length;
  const active = rows.filter((r) => r.lastActivityAt != null).length;

  return [
    {
      label: 'Stagiaires',
      value: rows.length,
      subtitle: 'Sur vos sessions',
      icon: Users,
    },
    {
      label: 'Progression',
      value: `${avgProgress} %`,
      subtitle: 'Moyenne e-formation',
      icon: TrendingUp,
    },
    {
      label: 'Sessions',
      value: sessions,
      subtitle: 'Cohortes distinctes',
      icon: CalendarDays,
    },
    {
      label: 'Quiz validés',
      value: quizOk,
      subtitle: 'Parcours QCM complétés',
      icon: BookOpen,
    },
    {
      label: 'Actifs',
      value: active,
      subtitle: 'Avec activité LMS enregistrée',
      icon: Layers,
    },
  ];
}

export function instructorParcoursKpis(courses: CourseListRow[]): ModuleKpiStatItem[] {
  const chapters = courses.reduce((n, c) => n + c.chapterCount, 0);
  const activities = courses.reduce((n, c) => n + c.activityCount, 0);
  const avgUv =
    courses.length > 0 ? Math.round((chapters / courses.length) * 10) / 10 : 0;
  const formations = new Set(courses.map((c) => c.formationName)).size;

  return [
    {
      label: 'Parcours',
      value: courses.length,
      subtitle: 'Courses LMS assignés',
      icon: BookOpen,
    },
    {
      label: 'UV',
      value: chapters,
      subtitle: 'Unités de valeur',
      icon: Layers,
    },
    {
      label: 'Activités',
      value: activities,
      subtitle: 'Contenus et quiz',
      icon: GraduationCap,
    },
    {
      label: 'Moyenne UV',
      value: avgUv,
      subtitle: 'Par parcours',
      icon: TrendingUp,
    },
    {
      label: 'Formations',
      value: formations,
      subtitle: 'Formations distinctes',
      icon: CalendarDays,
    },
  ];
}

export function instructorAnnoncesKpis(items: InstructorAnnouncementRow[]): ModuleKpiStatItem[] {
  const live = items.filter((a) => a.state === 'live').length;
  const draft = items.filter((a) => a.state === 'draft').length;
  const scheduled = items.filter((a) => a.state === 'scheduled').length;
  const targeted = items.filter((a) => a.scope === 'session').length;

  return [
    {
      label: 'Annonces',
      value: items.length,
      subtitle: 'Toutes vos publications',
      icon: Megaphone,
    },
    {
      label: 'Publiées',
      value: live,
      subtitle: 'Visibles stagiaires',
      icon: Send,
    },
    {
      label: 'Brouillons',
      value: draft,
      subtitle: 'En préparation',
      icon: BookOpen,
    },
    {
      label: 'Planifiées',
      value: scheduled,
      subtitle: 'Publication différée',
      icon: CalendarClock,
    },
    {
      label: 'Ciblées',
      value: targeted,
      subtitle: 'Par session',
      icon: Users,
    },
  ];
}

/** Placeholder skeleton values while loading (5 cartes). */
export function instructorKpiSkeleton(icons: LucideIcon[]): ModuleKpiStatItem[] {
  return icons.map((icon, i) => ({
    label: '—',
    value: '—',
    subtitle: 'Chargement…',
    icon,
  }));
}
