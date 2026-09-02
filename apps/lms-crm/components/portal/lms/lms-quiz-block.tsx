'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, Loader2 } from 'lucide-react';
import { Button } from '@repo/ui/button';
import { cn } from '@/lib/utils';
import { apiFetch } from '@/lib/api';
import { E_FORMATION_API } from '@/lib/portal/e-formation-paths';
import { parseQuizContent } from '@/lib/portal/lms-types';

type QuizResult = {
  questionId: string;
  selectedIndex: number;
  correct: boolean;
  correctIndex: number;
};

export function LmsQuizBlock({
  activityId,
  content,
  onPassed,
}: {
  activityId: string;
  content: unknown;
  onPassed?: () => void;
}) {
  const quiz = useMemo(() => parseQuizContent(content), [content]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    passScore: number;
    results: QuizResult[];
  } | null>(
    quiz?.lastAttempt
      ? {
          score: quiz.lastAttempt.score,
          passed: quiz.lastAttempt.passed,
          passScore: quiz.passScore ?? 50,
          results: [],
        }
      : null,
  );

  const resultByQuestion = useMemo(() => {
    const map = new Map<string, QuizResult>();
    for (const r of result?.results ?? []) map.set(r.questionId, r);
    return map;
  }, [result?.results]);

  if (!quiz || quiz.questions.length === 0) return null;

  const submitted = result != null;
  const percent = result?.score ?? 0;
  const passScore = result?.passScore ?? quiz.passScore ?? 50;
  const passed = submitted && (result?.passed ?? false);

  async function submitQuiz() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`${E_FORMATION_API}/quiz/${activityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = (await res.json()) as {
        success?: boolean;
        data?: {
          score: number;
          passed: boolean;
          passScore: number;
          results: QuizResult[];
        };
        error?: { message?: string };
      };
      if (!res.ok || !json.success || !json.data) {
        throw new Error(json.error?.message ?? 'Envoi impossible');
      }
      setResult(json.data);
      if (json.data.passed) onPassed?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur inattendue');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-xl border bg-muted/20 p-5">
      <div className="mb-4 flex items-center gap-2">
        <CircleHelp className="size-5 text-primary" />
        <h3 className="font-semibold">Quiz de validation</h3>
      </div>

      <div className="space-y-5">
        {quiz.questions.map((q, qi) => (
          <fieldset key={q.id} className="space-y-2">
            <legend className="text-sm font-medium">
              {qi + 1}. {q.prompt}
            </legend>
            <div className="space-y-1.5">
              {q.choices.map((choice, ci) => {
                const graded = resultByQuestion.get(q.id);
                return (
                  <label
                    key={ci}
                    className={cn(
                      'flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors',
                      answers[q.id] === ci && 'border-primary bg-primary/5',
                      submitted &&
                        graded &&
                        ci === graded.correctIndex &&
                        'border-green-600/50 bg-green-500/10',
                      submitted &&
                        graded &&
                        answers[q.id] === ci &&
                        !graded.correct &&
                        'border-destructive/40 bg-destructive/5',
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      className="size-4"
                      disabled={submitted || submitting}
                      checked={answers[q.id] === ci}
                      onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: ci }))}
                    />
                    {choice}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error ? <p className="mt-4 text-sm text-destructive">{error}</p> : null}

      {!submitted ? (
        <Button
          type="button"
          className="mt-5"
          disabled={submitting || quiz.questions.some((q) => answers[q.id] === undefined)}
          onClick={() => void submitQuiz()}
        >
          {submitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Correction…
            </>
          ) : (
            'Valider mes réponses'
          )}
        </Button>
      ) : (
        <div
          className={cn(
            'mt-5 rounded-lg border px-4 py-3 text-sm',
            passed
              ? 'border-green-600/30 bg-green-500/10 text-green-800 dark:text-green-300'
              : 'border-amber-600/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
          )}
        >
          Score : {percent} % — {passed ? 'Quiz réussi.' : `Minimum ${passScore} % requis.`}
          {passed ? (
            <p className="mt-1 flex items-center gap-1 text-xs">
              <CheckCircle2 className="size-3.5" /> Leçon marquée comme terminée.
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}
