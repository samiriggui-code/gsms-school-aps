'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useTranslation } from '@/hooks/useTranslation';
import { CandidatureStatus } from '@repo/database/browser';

type Props = {
  candidatureId: string | null;
  candidatureStatus: string | null;
};

export function CandidatureParcoursActions({ candidatureId, candidatureStatus }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: parcours } = useQuery({
    queryKey: ['candidature-parcours', candidatureId],
    enabled: !!candidatureId,
    queryFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/parcours/${candidatureId}`,
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Parcours indisponible');
      return body.data as {
        steps: Array<{ id: string; label: string; status: string }>;
      };
    },
  });

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/parcours/${candidatureId}/complete`,
        { method: 'POST' },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Clôture impossible');
      return body.data;
    },
    onSuccess: () => {
      toast.success(t('candidature.pathCompleted'));
      void queryClient.invalidateQueries({ queryKey: ['candidature-parcours', candidatureId] });
      void queryClient.invalidateQueries({ queryKey: ['candidat-hub'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/parcours/${candidatureId}/archive`,
        { method: 'POST' },
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error?.message || 'Archivage impossible');
      return body.data;
    },
    onSuccess: () => {
      toast.success(t('candidature.archived'));
      void queryClient.invalidateQueries({ queryKey: ['candidature-parcours', candidatureId] });
      void queryClient.invalidateQueries({ queryKey: ['candidat-hub'] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!candidatureId) return null;

  const canComplete = candidatureStatus === CandidatureStatus.VALIDATED;
  const canArchive =
    candidatureStatus === CandidatureStatus.COMPLETED ||
    candidatureStatus === CandidatureStatus.REJECTED;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <p className="text-sm font-medium">Parcours candidat</p>
      {parcours?.steps ? (
        <ul className="space-y-1">
          {parcours.steps.map((step) => (
            <li key={step.id} className="flex items-center justify-between text-sm">
              <span>{step.label}</span>
              <Badge variant="outline">{step.status}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {canComplete ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => completeMutation.mutate()}
            disabled={completeMutation.isPending}
          >
            Clôturer parcours (terminé)
          </Button>
        ) : null}
        {canArchive ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => archiveMutation.mutate()}
            disabled={archiveMutation.isPending}
          >
            Archiver le dossier
          </Button>
        ) : null}
      </div>
    </div>
  );
}
