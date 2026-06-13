/** Chemins UI espace e-formation candidat / stagiaire. */
export const E_FORMATION_BASE = '/e-formation';

export const E_FORMATION_API = '/api/portal/e-formation';

export function eFormationCoursePath(courseId: string) {
  return `${E_FORMATION_BASE}/${courseId}`;
}

export function eFormationModulePath(courseId: string, chapterId: string) {
  return `${E_FORMATION_BASE}/${courseId}/lecons/${chapterId}`;
}

export function eFormationQuizPath() {
  return `${E_FORMATION_BASE}/quiz`;
}

export function eFormationModuleQuizPath(courseId: string, chapterId: string) {
  return `${E_FORMATION_BASE}/${courseId}/lecons/${chapterId}/quiz`;
}

export const E_FORMATION_ANNOUNCEMENTS_API = `${E_FORMATION_API}/announcements`;
export const E_FORMATION_QUIZ_API = `${E_FORMATION_API}/quiz`;
export const E_FORMATION_ACTIVITY_API = `${E_FORMATION_API}/activity`;
