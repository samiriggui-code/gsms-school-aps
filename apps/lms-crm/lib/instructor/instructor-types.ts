/** Aligné sur le catalogue formations (vie-scolaire) — défini ici pour éviter d’importer le catalogue côté client. */
export type FormationVitrineTrack =
  | 'surete'
  | 'incendie'
  | 'habilitation'
  | 'sst'
  | 'entreprise'
  | 'autres';

export type InstructorSessionStatus = 'upcoming' | 'ongoing' | 'past' | 'unknown';

export type InstructorSessionRow = {
  id: string;
  dateDisplayLabel: string;
  location: string;
  startDate: string | null;
  endDate: string | null;
  participantCount: number;
  sessionKind: string;
  formation: {
    id: string;
    name: string;
    slug: string;
    tag: string;
    track: FormationVitrineTrack;
    duration: string;
    logoUrl: string | null;
    courseId: string | null;
    courseTitle: string | null;
  };
  status: InstructorSessionStatus;
};

export type InstructorFormationRow = {
  id: string;
  name: string;
  slug: string;
  tag: string;
  track: FormationVitrineTrack;
  duration: string;
  logoUrl: string | null;
  deliveryMode: string | null;
  qualiopiCertified: boolean;
  cpfEligible: boolean;
  courseId: string | null;
  courseTitle: string | null;
  assignedSessionCount: number;
  upcomingSessionCount: number;
  participantCount: number;
  nextSessionLabel: string | null;
  nextSessionStartDate: string | null;
};

export type InstructorTraineeRow = {
  participantId: string;
  userId: string;
  sessionId: string;
  sessionLabel: string;
  formationId: string;
  formationName: string;
  formationSlug: string;
  courseId: string | null;
  name: string | null;
  email: string;
  phone: string | null;
  avatar: string | null;
  enrollmentStatus: string;
  examOutcome: string;
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  quizPassed: number;
  quizTotal: number;
  lastActivityAt: string | null;
};

export type InstructorTraineeChapterProgress = {
  chapterId: string;
  title: string;
  position: number;
  completed: boolean;
  completedAt: string | null;
};

export type InstructorTraineeQuizRow = {
  activityId: string;
  name: string;
  chapterTitle: string;
  bestScore: number | null;
  passed: boolean;
  attemptCount: number;
  lastAttemptAt: string | null;
};

export type InstructorTraineeDetail = {
  participantId: string;
  userId: string;
  sessionId: string;
  sessionLabel: string;
  location: string;
  formationName: string;
  user: {
    name: string | null;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    avatar: string | null;
    birthDate: string | null;
    city: string | null;
    postalCode: string | null;
  };
  candidature: {
    status: string;
    cnapsReference: string | null;
  } | null;
  enrollmentStatus: string;
  examOutcome: string;
  progressPercent: number;
  completedChapters: number;
  totalChapters: number;
  chapters: InstructorTraineeChapterProgress[];
  quizzes: InstructorTraineeQuizRow[];
  eFormationNote: string;
};

export type CohortActivityPoint = {
  date: string;
  label: string;
  lessons: number;
  quizzes: number;
};

export type CohortActivityPayload = {
  days: number;
  series: CohortActivityPoint[];
  totals: { lessons: number; quizzes: number };
  participantCount: number;
};

export type SessionAttendanceAssetRow = {
  id: string;
  originalName: string;
  url: string;
  mimeType: string;
  size: number;
  category: string;
  attendanceDate: string | null;
  kind: 'generated' | 'scan';
  createdAt: string;
  createdByName: string | null;
};

export type InstructorAnnouncementRow = {
  id: string;
  formationId: string;
  formationName: string;
  sessionId: string | null;
  sessionLabel: string | null;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string;
  scope: 'formation' | 'session';
  state: 'draft' | 'scheduled' | 'live';
};

export type InstructorCourseRow = {
  id: string;
  title: string;
  formationId: string;
  formationName: string;
  chapterCount: number;
  activityCount: number;
  isPublished: boolean;
};

export type InstructorChartSlice = {
  name: string;
  value: number;
  color: string;
};

export type InstructorDashboardAlert = {
  id: string;
  kind: 'session' | 'trainee' | 'announcement' | 'notification';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  title: string;
  body: string;
  href: string;
  createdAt: string;
  unread?: boolean;
};

export type InstructorDashboardPayload = {
  stats: {
    sessionCount: number;
    upcomingSessionCount: number;
    formationCount: number;
    traineeCount: number;
    courseCount: number;
    avgProgressPercent: number;
  };
  nextSession: InstructorSessionRow | null;
  sessions: InstructorSessionRow[];
  formations: InstructorFormationRow[];
  courses: InstructorCourseRow[];
  charts: {
    sessionsByStatus: InstructorChartSlice[];
  };
  activity: CohortActivityPayload | null;
  highlights: {
    overallProgress: number;
    trend: number;
    rows: Array<{
      icon: string;
      text: string;
      total: number | string;
      stats: number;
      trend: 'up' | 'down' | 'neutral';
      unit?: string;
    }>;
    categories: Array<{ badgeColor: string; label: string }>;
  };
  alerts: InstructorDashboardAlert[];
  overview: {
    sessions: InstructorSessionRow[];
    trainees: InstructorTraineeRow[];
    announcements: InstructorAnnouncementRow[];
  };
};
