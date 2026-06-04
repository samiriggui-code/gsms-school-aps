'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';

type ExamRow = {
  id: string;
  examOutcome: string;
  examDate: string | null;
  user: { name: string | null; email: string };
  session: { dateDisplayLabel: string; formation: { name: string } | null };
  candidature: { id: string; status: string } | null;
};

const OUTCOME_LABEL: Record<string, string> = {
  PENDING: 'En attente',
  PASSED: 'Réussi',
  FAILED: 'Échoué',
  ABSENT: 'Absent',
};

export function ParcoursSessionExamensPanel() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['vie-scolaire', 'examens'],
    queryFn: async () => {
      const res = await apiFetch('/api/sections/gestion-academique/vie-scolaire/examens?limit=50');
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Chargement impossible');
      return body.data as { items: ExamRow[] };
    },
  });

  const patchMutation = useMutation({
    mutationFn: async ({ id, examOutcome }: { id: string; examOutcome: string }) => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/examens/${id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ examOutcome, examDate: new Date().toISOString() }),
        },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Mise à jour impossible');
      return body.data;
    },
    onSuccess: () => {
      toast.success(t('academic.examResultSaved'));
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens'] });
      void queryClient.invalidateQueries({ queryKey: ['vie-scolaire', 'examens', 'stats'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inscrits session — résultats d&apos;examen</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Chargement…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun inscrit avec dossier candidature. Validez un dossier puis inscrivez-le à une session.
          </p>
        ) : (
          items.map((row) => (
            <div
              key={row.id}
              className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">{row.user.name || row.user.email}</p>
                <p className="text-sm text-muted-foreground">
                  {row.session.formation?.name ?? 'Formation'} — {row.session.dateDisplayLabel}
                </p>
                <Badge variant="outline" className="mt-1">
                  {OUTCOME_LABEL[row.examOutcome] ?? row.examOutcome}
                </Badge>
              </div>
              <Select
                value={row.examOutcome}
                onValueChange={(value) => patchMutation.mutate({ id: row.id, examOutcome: value })}
              >
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue placeholder="Résultat" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="PASSED">Réussi</SelectItem>
                  <SelectItem value="FAILED">Échoué</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
