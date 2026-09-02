'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Archive, Loader2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiFetch } from '@/lib/api';
import { Button } from '@repo/ui/button';
import { Textarea } from '@repo/ui/textarea';
import { Label } from '@repo/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@repo/ui/alert-dialog';
import { toast } from 'sonner';

type DossierStatus = {
  closed: boolean;
  closedAt: string | null;
  closedByName: string | null;
  documentCount: number;
  closureManifestId: string | null;
};

export function SuiviDossierCloseButton({ sessionId }: { sessionId: string | null }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState('');

  const statusKey = [
    'gestion-academique',
    'vie-scolaire',
    'suivi-formations',
    'dossier-status',
    sessionId,
  ] as const;

  const { data: status, isLoading } = useQuery({
    queryKey: statusKey,
    queryFn: async (): Promise<DossierStatus> => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/dossier`,
      );
      if (!res.ok) throw new Error('Statut dossier indisponible.');
      const j = await res.json();
      return j.data as DossierStatus;
    },
    enabled: Boolean(sessionId),
    staleTime: 20_000,
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/suivi-formations/${sessionId}/dossier`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ notes: notes.trim() || null }),
        },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error ?? 'Clôture impossible.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Dossier session clôturé — legal hold appliqué sur tous les documents.');
      setOpen(false);
      setNotes('');
      queryClient.invalidateQueries({ queryKey: statusKey });
      queryClient.invalidateQueries({
        queryKey: ['gestion-academique', 'vie-scolaire', 'suivi-formations', 'documents', sessionId],
      });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!sessionId || isLoading) return null;

  if (status?.closed) {
    const closedLabel = status.closedAt
      ? format(parseISO(status.closedAt), 'd MMM yyyy à HH:mm', { locale: fr })
      : '—';
    return (
      <span className="text-xs text-muted-foreground">
        Dossier clôturé le {closedLabel}
        {status.closedByName ? ` par ${status.closedByName}` : ''}
      </span>
    );
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 shrink-0 gap-1.5 px-2.5"
        onClick={() => setOpen(true)}
      >
        <Archive className="size-3.5" />
        <span className="hidden sm:inline">Clôturer dossier</span>
      </Button>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clôturer le dossier session ?</AlertDialogTitle>
            <AlertDialogDescription>
              Applique un <strong>legal hold</strong> sur les {status?.documentCount ?? 0} document
              {(status?.documentCount ?? 0) > 1 ? 's' : ''} du dossier et génère un manifeste JSON
              archivé sur MinIO. Les fichiers restent téléchargeables pour contrôle ou demande des
              autorités (conservation 3 ans minimum).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="close-notes">Notes de clôture (optionnel)</Label>
            <Textarea
              id="close-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Fin de session, contrôle interne, référence…"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={closeMutation.isPending}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              disabled={closeMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                closeMutation.mutate();
              }}
            >
              {closeMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Archive className="mr-2 size-4" />
              )}
              Confirmer la clôture
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
