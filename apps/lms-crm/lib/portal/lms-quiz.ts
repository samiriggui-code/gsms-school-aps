import type { LmsActivityRow, LmsAssignmentContent } from './lms-types';

export type QuizQuestionKey = {
  id: string;
  correctIndex: number;
};

export type ClientQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

export type ClientQuizPayload = {
  passScore: number;
  questions: ClientQuizQuestion[];
  lastAttempt?: { score: number; passed: boolean; createdAt: string } | null;
};

function asRecord(v: unknown): Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

export function extractQuizAnswerKeys(
  content: unknown,
  details: unknown,
): QuizQuestionKey[] {
  const detailQuestions = asRecord(details).questions;
  if (Array.isArray(detailQuestions) && detailQuestions.length > 0) {
    const keys: QuizQuestionKey[] = [];
    for (const item of detailQuestions) {
      const o = asRecord(item);
      const id = typeof o.id === 'string' ? o.id : null;
      const correctIndex = typeof o.correctIndex === 'number' ? o.correctIndex : null;
      if (id != null && correctIndex != null) keys.push({ id, correctIndex });
    }
    if (keys.length > 0) return keys;
  }

  const contentQuestions = asRecord(content).questions;
  if (!Array.isArray(contentQuestions)) return [];
  const keys: QuizQuestionKey[] = [];
  for (const item of contentQuestions) {
    const o = asRecord(item);
    const id = typeof o.id === 'string' ? o.id : null;
    const correctIndex = typeof o.correctIndex === 'number' ? o.correctIndex : null;
    if (id != null && correctIndex != null) keys.push({ id, correctIndex });
  }
  return keys;
}

export function sanitizeQuizForClient(
  content: unknown,
  details: unknown,
  lastAttempt?: { score: number; passed: boolean; createdAt: Date } | null,
): ClientQuizPayload | null {
  const c = asRecord(content);
  const questionsRaw = c.questions;
  if (!Array.isArray(questionsRaw) || questionsRaw.length === 0) return null;

  const questions: ClientQuizQuestion[] = [];
  for (const item of questionsRaw) {
    const o = asRecord(item);
    const id = typeof o.id === 'string' ? o.id : null;
    const prompt = typeof o.prompt === 'string' ? o.prompt : null;
    const choices = Array.isArray(o.choices)
      ? o.choices.filter((x): x is string => typeof x === 'string')
      : [];
    if (!id || !prompt || choices.length === 0) continue;
    questions.push({ id, prompt, choices });
  }
  if (questions.length === 0) return null;

  const passScore = typeof c.passScore === 'number' ? c.passScore : 50;

  return {
    passScore,
    questions,
    lastAttempt: lastAttempt
      ? {
          score: lastAttempt.score,
          passed: lastAttempt.passed,
          createdAt: lastAttempt.createdAt.toISOString(),
        }
      : null,
  };
}

export function gradeQuizAttempt(
  content: unknown,
  details: unknown,
  answers: Record<string, number>,
): {
  score: number;
  passed: boolean;
  passScore: number;
  results: Array<{ questionId: string; selectedIndex: number; correctIndex: number; correct: boolean }>;
} {
  const c = asRecord(content);
  const passScore = typeof c.passScore === 'number' ? c.passScore : 50;
  const keys = extractQuizAnswerKeys(content, details);
  if (keys.length === 0) {
    return { score: 0, passed: false, passScore, results: [] };
  }

  let correctCount = 0;
  const results: Array<{
    questionId: string;
    selectedIndex: number;
    correctIndex: number;
    correct: boolean;
  }> = [];

  for (const key of keys) {
    const selectedIndex = answers[key.id];
    const correct = selectedIndex === key.correctIndex;
    if (correct) correctCount += 1;
    results.push({
      questionId: key.id,
      selectedIndex: selectedIndex ?? -1,
      correctIndex: key.correctIndex,
      correct,
    });
  }

  const score = Math.round((correctCount / keys.length) * 100);
  return { score, passed: score >= passScore, passScore, results };
}

export function serializePortalActivity(
  activity: {
    id: string;
    name: string;
    type: string;
    subType: string;
    position: number;
    content: unknown;
    details?: unknown;
    assignment?: {
      id: string;
      title: string;
      description: string | null;
      dueDate: Date | null;
      maxPoints: number;
    } | null;
  },
  quizAttempt?: { score: number; passed: boolean; createdAt: Date } | null,
  assignmentSubmission?: {
    content: string | null;
    fileUrl: string | null;
    grade: number | null;
    feedback: string | null;
    updatedAt: Date;
  } | null,
): LmsActivityRow {
  if (activity.type === 'ASSIGNMENT' && activity.assignment) {
    const a = activity.assignment;
    const assignmentPayload: LmsAssignmentContent = {
      assignmentId: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate?.toISOString() ?? null,
      maxPoints: a.maxPoints,
      submission: assignmentSubmission
        ? {
            content: assignmentSubmission.content,
            fileUrl: assignmentSubmission.fileUrl,
            grade: assignmentSubmission.grade,
            feedback: assignmentSubmission.feedback,
            updatedAt: assignmentSubmission.updatedAt.toISOString(),
          }
        : null,
    };
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      subType: activity.subType,
      position: activity.position,
      content: assignmentPayload,
    };
  }

  if (activity.subType === 'QUIZ_MULTIPLE_CHOICE') {
    const quiz = sanitizeQuizForClient(activity.content, activity.details ?? null, quizAttempt);
    return {
      id: activity.id,
      name: activity.name,
      type: activity.type,
      subType: activity.subType,
      position: activity.position,
      content: quiz ?? {},
    };
  }

  return {
    id: activity.id,
    name: activity.name,
    type: activity.type,
    subType: activity.subType,
    position: activity.position,
    content: activity.content,
  };
}
