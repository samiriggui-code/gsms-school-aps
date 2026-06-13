export const INSTRUCTOR_BASE = '/formateur';

export const INSTRUCTOR_DASHBOARD_API = '/api/instructor/dashboard';
export const INSTRUCTOR_FORMATIONS_API = '/api/instructor/formations';
export const INSTRUCTOR_SESSIONS_API = '/api/instructor/sessions';
export const INSTRUCTOR_STAGIAIRES_API = '/api/instructor/stagiaires';
export const INSTRUCTOR_STAGIAIRE_DETAIL_API = '/api/instructor/stagiaires/detail';
export const INSTRUCTOR_STAGIAIRES_ACTIVITY_API = '/api/instructor/stagiaires/activity';
export const INSTRUCTOR_ATTENDANCE_API = '/api/instructor/stagiaires/attendance';
export const INSTRUCTOR_SUMMARY_API = '/api/instructor/summary';
export const INSTRUCTOR_ANNOUNCEMENTS_API = '/api/instructor/announcements';
export const INSTRUCTOR_COURSES_API = '/api/instructor/courses';

export function instructorCourseApi(courseId: string) {
  return `${INSTRUCTOR_COURSES_API}/${courseId}`;
}

export function instructorCoursePreviewApi(courseId: string, chapterId: string) {
  return `${INSTRUCTOR_COURSES_API}/${courseId}/preview?chapterId=${chapterId}`;
}

export function instructorCoursePlaybackApi(courseId: string, chapterId: string) {
  return `${INSTRUCTOR_COURSES_API}/${courseId}/playback?chapterId=${chapterId}`;
}

export function instructorCourseQuestionBankApi(courseId: string) {
  return `${INSTRUCTOR_COURSES_API}/${courseId}/question-bank`;
}

export function instructorSessionPath(sessionId?: string) {
  return sessionId ? `${INSTRUCTOR_BASE}/sessions?session=${sessionId}` : `${INSTRUCTOR_BASE}/sessions`;
}
