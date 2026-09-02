'use client';

import { useEffect, useState } from 'react';
import { Button } from '@repo/ui/button';
import { Label } from '@repo/ui/label';
import { Textarea } from '@repo/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@repo/ui/select';

type Question = {
  code: string;
  label: string;
  type: 'text' | 'select' | 'boolean';
  required: boolean;
  options?: { value: string; label: string }[];
};

export function CandidatureAssessmentForm({
  assessmentId,
  token,
}: {
  assessmentId: string;
  token: string;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [formationName, setFormationName] = useState<string | null>(null);
  const [kind, setKind] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/public/assessment/${assessmentId}?t=${encodeURIComponent(token)}`,
        );
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || 'Chargement impossible');
        if (cancelled) return;
        setQuestions(json.data.questions ?? []);
        setFormationName(json.data.formationName ?? null);
        setKind(json.data.kind ?? '');
        if (json.data.alreadyCompleted) setDone(true);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Erreur');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [assessmentId, token]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/public/assessment/${assessmentId}?t=${encodeURIComponent(token)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers }),
        },
      );
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Soumission refusée');
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="mx-auto max-w-lg p-8 text-sm text-muted-foreground">Chargement…</main>;
  }
  if (done) {
    return (
      <main className="mx-auto max-w-lg space-y-2 p-8">
        <h1 className="text-lg font-semibold">Merci</h1>
        <p className="text-sm text-muted-foreground">
          Vos réponses ont été enregistrées
          {kind === 'NEEDS_ANALYSIS'
            ? '. Vous recevrez éventuellement le questionnaire de positionnement.'
            : '.'}
        </p>
      </main>
    );
  }

  const title =
    kind === 'POSITIONING' ? 'Positionnement initial' : 'Analyse du besoin';

  return (
    <main className="mx-auto max-w-lg space-y-6 p-8">
      <div>
        <h1 className="text-lg font-semibold">{title}</h1>
        {formationName ? (
          <p className="text-sm text-muted-foreground">{formationName}</p>
        ) : null}
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        {questions.map((q) => (
          <div key={q.code} className="space-y-1.5">
            <Label htmlFor={q.code}>
              {q.label}
              {q.required ? ' *' : ''}
            </Label>
            {q.type === 'text' ? (
              <Textarea
                id={q.code}
                required={q.required}
                value={answers[q.code] ?? ''}
                onChange={(ev) => setAnswers((a) => ({ ...a, [q.code]: ev.target.value }))}
                rows={3}
              />
            ) : null}
            {q.type === 'select' && q.options ? (
              <Select
                value={answers[q.code] ?? ''}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [q.code]: v }))}
              >
                <SelectTrigger id={q.code}>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  {q.options.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {q.type === 'boolean' ? (
              <Select
                value={answers[q.code] ?? ''}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [q.code]: v }))}
              >
                <SelectTrigger id={q.code}>
                  <SelectValue placeholder="Choisir…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Oui</SelectItem>
                  <SelectItem value="false">Non</SelectItem>
                </SelectContent>
              </Select>
            ) : null}
          </div>
        ))}
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Envoi…' : 'Envoyer'}
        </Button>
      </form>
    </main>
  );
}
