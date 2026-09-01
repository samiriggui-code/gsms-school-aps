export type LmsQuizQuestion = {
  id: string;
  prompt: string;
  choices: string[];
};

export type LmsQuizContent = {
  passScore?: number;
  questions: LmsQuizQuestion[];
  lastAttempt?: { score: number; passed: boolean; createdAt: string } | null;
};
export type LmsAssignmentContent = {
  assignmentId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  maxPoints: number;
  submission: {
    content: string | null;
    fileUrl: string | null;
    grade: number | null;
    feedback: string | null;
    updatedAt: string;
  } | null;
};

export type LmsActivityRow = {
  id: string;
  name: string;
  type: string;
  subType: string;
  position: number;
  content: unknown;
};

export type LmsSyllabusItem = {
  id: string;
  title: string;
  position: number;
  isFree: boolean;
  accessible: boolean;
  completed: boolean;
  current?: boolean;
  lockReason?: string | null;
};
export function parseQuizContent(content: unknown): LmsQuizContent | null {
  if (!content || typeof content !== 'object') return null;
  const c = content as Record<string, unknown>;
  if (!Array.isArray(c.questions)) return null;
  return {
    passScore: typeof c.passScore === 'number' ? c.passScore : 50,
    questions: c.questions as LmsQuizQuestion[],
    lastAttempt:
      c.lastAttempt && typeof c.lastAttempt === 'object'
        ? (c.lastAttempt as LmsQuizContent['lastAttempt'])
        : null,
  };
}

export function parseMarkdownContent(content: unknown): string | null {
  if (!content || typeof content !== 'object') return null;
  const md = (content as Record<string, unknown>).markdown;
  return typeof md === 'string' ? md : null;
}

export function parseYoutubeContent(content: unknown): { youtubeId: string; caption?: string } | null {
  if (!content || typeof content !== 'object') return null;
  const c = content as Record<string, unknown>;
  const youtubeId = c.youtubeId;
  if (typeof youtubeId !== 'string' || !youtubeId) return null;
  return {
    youtubeId,
    caption: typeof c.caption === 'string' ? c.caption : undefined,
  };
}
