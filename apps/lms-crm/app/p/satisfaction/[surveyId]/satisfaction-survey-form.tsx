'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { nextPublicPathPrefix } from '@/lib/next-public-path-prefix';

type SurveyQuestion = {
  code: string;
  label: string;
  description?: string;
  type: 'text' | 'scale';
  required: boolean;
  timing: 'identity' | 'hot' | 'cold';
};

type SurveyScaleOption = { value: string; label: string };

type SurveyGetResponse = {
  timing: 'HOT' | 'COLD';
  questions: SurveyQuestion[];
  scale: SurveyScaleOption[];
  formationName: string;
  sessionLabel: string;
  alreadyCompleted: boolean;
};

function publicApiUrl(surveyId: string, token: string) {
  const pre = nextPublicPathPrefix();
  const base = `${pre}/api/public/satisfaction/${encodeURIComponent(surveyId)}`;
  return `${base}?t=${encodeURIComponent(token)}`;
}

export function SatisfactionSurveyForm({ surveyId, token }: { surveyId: string; token: string }) {
  const [state, setState] = useState<
    | { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; data: SurveyGetResponse }
    | { status: 'done' }
  >({ status: 'loading' });
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(publicApiUrl(surveyId, token), { cache: 'no-store' });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          const msg = (json as { error?: { message?: string } }).error?.message ?? 'Enquête introuvable.';
          setState({ status: 'error', message: msg });
          return;
        }
        setState({ status: 'ready', data: (json as { data: SurveyGetResponse }).data });
      } catch {
        if (!cancelled) setState({ status: 'error', message: 'Chargement impossible.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [surveyId, token]);

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" aria-hidden />
        Chargement du questionnaire…
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <p className="text-sm font-medium text-destructive">{state.message}</p>
      </div>
    );
  }

  if (state.status === 'done' || (state.status === 'ready' && state.data.alreadyCompleted)) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <CheckCircle2 className="mx-auto size-10 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-lg font-semibold text-foreground">Merci pour votre réponse</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {state.status === 'done'
            ? 'Votre questionnaire a bien été enregistré.'
            : 'Vous avez déjà répondu à cette enquête — merci.'}
        </p>
      </div>
    );
  }

  const { data } = state;

  const submit = async () => {
    const missing = data.questions.filter((q) => q.required && !answers[q.code]?.trim());
    if (missing.length > 0) {
      toast.error(`Merci de répondre à : ${missing.map((q) => q.label).join(', ')}.`);
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(publicApiUrl(surveyId, token), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = (json as { error?: { message?: string } }).error?.message ?? 'Soumission impossible.';
        toast.error(msg);
        return;
      }
      toast.success('Merci — votre réponse a été enregistrée.');
      setState({ status: 'done' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Enquête de satisfaction
        </p>
        <h1 className="mt-1 text-xl font-semibold text-foreground">{data.formationName}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{data.sessionLabel}</p>
      </div>

      <div className="space-y-5">
        {data.questions.map((question) => (
          <div key={question.code} className="rounded-2xl border border-border bg-background p-4 shadow-sm">
            <Label className="text-sm font-medium text-foreground">
              {question.label}
              {question.required ? <span className="ml-1 text-destructive">*</span> : null}
            </Label>
            {question.description ? (
              <p className="mt-1 text-xs text-muted-foreground">{question.description}</p>
            ) : null}

            {question.type === 'scale' ? (
              <RadioGroup
                className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"
                value={answers[question.code] ?? ''}
                onValueChange={(value) => setAnswers((prev) => ({ ...prev, [question.code]: value }))}
              >
                {data.scale.map((option) => (
                  <label
                    key={option.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 py-2 text-xs text-foreground hover:bg-muted/40"
                  >
                    <RadioGroupItem value={option.value} size="sm" />
                    {option.label}
                  </label>
                ))}
              </RadioGroup>
            ) : (
              <Input
                className="mt-3"
                value={answers[question.code] ?? ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [question.code]: e.target.value }))}
                placeholder="Votre réponse"
              />
            )}
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="primary"
        className="mt-6 w-full sm:w-auto"
        disabled={submitting}
        onClick={() => void submit()}
      >
        {submitting ? 'Envoi…' : 'Envoyer mes réponses'}
      </Button>
    </div>
  );
}
