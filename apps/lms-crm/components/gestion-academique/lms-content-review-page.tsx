'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Loader2, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { portalMuted } from '@/components/portal/layout/portal-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const LMS_REVIEW_API = '/api/sections/gestion-academique/lms-content-review';

type PendingRow = {
  id: string;
  kind: 'chapter' | 'activity';
  title: string;
  courseTitle: string;
  formationName: string | null;
  submittedForReviewAt: string;
  instructorName: string | null;
};

export function LmsContentReviewPage() {
  const qc = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const query = useQuery({
    queryKey: ['lms-content-review'],
    queryFn: async () => {
      const res = await apiFetch(LMS_REVIEW_API);
      const json = (await res.json()) as {
        success?: boolean;
        data?: { items: PendingRow[]; reviewRequired: boolean };
      };
      if (!res.ok || !json.success) throw new Error('File indisponible');
      return json.data ?? { items: [], reviewRequired: false };
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: {
      kind: 'chapter' | 'activity';
      id: string;
      decision: 'APPROVED' | 'REJECTED';
    }) => {
      const res = await apiFetch(LMS_REVIEW_API, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          reviewNote: notes[`${payload.kind}:${payload.id}`] ?? '',
        }),
      });
      const json = (await res.json()) as { success?: boolean; error?: { message?: string } };
      if (!res.ok || !json.success) throw new Error(json.error?.message ?? 'Erreur');
    },
    onSuccess: () => {
      toast.success('Décision enregistrée.');
      void qc.invalidateQueries({ queryKey: ['lms-content-review'] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : 'Erreur'),
  });

  const items = query.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Validation contenu e-formation</h1>
        <p className={cn('mt-1 text-sm', portalMuted)}>
          File d&apos;attente des UV et activités soumises par les formateurs.
          {query.data?.reviewRequired
            ? ' La validation admin est active (LMS_CONTENT_REVIEW_REQUIRED=true).'
            : ' Mode direct : publication sans file (activez LMS_CONTENT_REVIEW_REQUIRED pour exiger une validation).'}
        </p>
      </div>

      {query.isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Chargement…
        </div>
      ) : items.length === 0 ? (
        <p className={portalMuted}>Aucun contenu en attente de validation.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((row) => {
            const key = `${row.kind}:${row.id}`;
            return (
              <li key={key} className="rounded-xl border p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="warning" appearance="light" size="sm">
                        {row.kind === 'chapter' ? 'UV' : 'Activité'}
                      </Badge>
                      {row.formationName ? (
                        <Badge variant="outline" size="sm">
                          {row.formationName}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-2 font-medium">{row.title}</p>
                    <p className={cn('text-sm', portalMuted)}>
                      {row.courseTitle}
                      {row.instructorName ? ` · ${row.instructorName}` : ''}
                    </p>
                    <p className={cn('text-xs', portalMuted)}>
                      Soumis le {new Date(row.submittedForReviewAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          kind: row.kind,
                          id: row.id,
                          decision: 'REJECTED',
                        })
                      }
                    >
                      <X className="me-1 size-4" />
                      Refuser
                    </Button>
                    <Button
                      size="sm"
                      disabled={reviewMutation.isPending}
                      onClick={() =>
                        reviewMutation.mutate({
                          kind: row.kind,
                          id: row.id,
                          decision: 'APPROVED',
                        })
                      }
                    >
                      <Check className="me-1 size-4" />
                      Valider
                    </Button>
                  </div>
                </div>
                <Textarea
                  className="mt-3 text-sm"
                  rows={2}
                  placeholder="Note interne (optionnelle, surtout en cas de refus)"
                  value={notes[key] ?? ''}
                  onChange={(e) => setNotes((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
