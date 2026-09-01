'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

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

export function LmsAssignmentBlock({
  activityId,
  assignment,
  onSubmitted,
}: {
  activityId: string;
  assignment: LmsAssignmentContent;
  onSubmitted?: () => void;
}) {
  const [content, setContent] = useState(assignment.submission?.content ?? '');
  const [fileUrl, setFileUrl] = useState(assignment.submission?.fileUrl ?? '');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/portal/apprendre/assignments/${activityId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim() || undefined,
          fileUrl: fileUrl.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof (json as { error?: { message?: string } }).error === 'object'
            ? (json as { error: { message?: string } }).error.message
            : 'Envoi impossible',
        );
      }
      onSubmitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Envoi impossible');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      {assignment.description ? (
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{assignment.description}</p>
      ) : null}
      {assignment.dueDate ? (
        <p className="text-xs text-muted-foreground">
          Échéance : {new Date(assignment.dueDate).toLocaleDateString('fr-FR')}
        </p>
      ) : null}
      {assignment.submission?.grade != null ? (
        <p className="text-sm font-medium text-primary">
          Note : {assignment.submission.grade}/{assignment.maxPoints}
          {assignment.submission.feedback ? ` — ${assignment.submission.feedback}` : ''}
        </p>
      ) : null}
      <label className="block text-xs font-medium">
        Votre rendu
        <Textarea
          className="mt-1"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Réponse texte…"
        />
      </label>
      <label className="block text-xs font-medium">
        Lien fichier (optionnel)
        <Input
          className="mt-1"
          value={fileUrl}
          onChange={(e) => setFileUrl(e.target.value)}
          placeholder="https://…"
        />
      </label>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <Button type="button" size="sm" disabled={pending} onClick={() => void submit()}>
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : null}
        {assignment.submission ? 'Mettre à jour le rendu' : 'Envoyer le devoir'}
      </Button>
    </div>
  );
}
