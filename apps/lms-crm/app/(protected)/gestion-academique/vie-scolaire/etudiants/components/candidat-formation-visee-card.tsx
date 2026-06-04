'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { candidatHubDetailQueryKey } from '../constants/query-keys';
import { BookOpen } from 'lucide-react';

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Transmis',
  MISSING_DOCUMENTS: 'Pièces manquantes',
  VALIDATION_PENDING: 'En validation',
  PENDING_CNAPS: 'Attente décision PN / CNAPS',
  CNAPS_APPROVED: 'Avis PN / CNAPS favorable',
  CNAPS_REJECTED: 'Avis défavorable',
  VALIDATED: 'Dossier validé',
  COMPLETED: 'Parcours terminé',
  REJECTED: 'Dossier refusé',
  ARCHIVED: 'Archivé',
};

type HubCandidature = {
  id: string;
  status: string;
  formation?: { name?: string | null } | null;
  interestedSession?: { dateDisplayLabel?: string | null } | null;
};

type HubDetail = {
  id: string;
  candidatures?: HubCandidature[];
};

/**
 * Synthèse « formation visée » avant validation complète du dossier : relit le même hub CRM
 * que la fiche Parcours (dossiers catalogue).
 */
export function CandidatFormationViseeCard({
  userId,
  dense = false,
}: {
  userId: string;
  /** Affichage plus compact sous le bandeau d’alerte présence / absence */
  dense?: boolean;
}) {
  const enabled = Boolean(userId?.trim());
  const { data, isPending, error } = useQuery({
    queryKey: [...candidatHubDetailQueryKey, userId] as const,
    enabled,
    staleTime: 1000 * 30,
    queryFn: async () => {
      const res = await apiFetch(`/api/sections/gestion-ressources/rh/CandidatHub/${userId}`);
      const json = await res.json();
      if (!res.ok)
        throw new Error((json as { message?: string }).message ?? 'Chargement du dossier impossible.');
      return (json as { data: HubDetail }).data;
    },
  });

  if (!enabled) return null;

  if (isPending) {
    return <Skeleton className={dense ? 'h-16 w-full rounded-lg' : 'h-24 w-full rounded-xl'} />;
  }

  if (error) {
    return (
      <Alert variant="secondary" appearance="outline" className="border-border/80">
        <AlertTitle className="text-sm font-semibold">Formation visée — chargement incomplet</AlertTitle>
        <AlertDescription className="text-muted-foreground text-xs">
          {(error as Error).message}
        </AlertDescription>
      </Alert>
    );
  }

  const primary = data?.candidatures?.[0] ?? null;

  if (!primary) {
    return (
      <Alert variant="secondary" appearance="outline" className="border-dashed border-border bg-muted/20">
        <div className="flex gap-2 items-start">
          <BookOpen className="size-4 text-muted-foreground shrink-0 mt-0.5" />
          <div>
            <AlertTitle className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Aucune intention de formation enregistrée
            </AlertTitle>
            <AlertDescription className="text-sm text-muted-foreground mt-1">
              Associez un catalogue formation (onglet « Parcours » / création de dossier) pour suivre la cible pré-inscription avant validation et inscription en session.
            </AlertDescription>
          </div>
        </div>
      </Alert>
    );
  }

  const formationNom = primary.formation?.name?.trim() || '— non renseignée —';
  const sessionVue = primary.interestedSession?.dateDisplayLabel?.trim();
  const statutLib = STATUS_LABEL[primary.status] ?? primary.status;

  return (
    <div
      className={`rounded-xl border border-border bg-gradient-to-br from-primary/5 to-transparent ${
        dense ? 'px-4 py-3' : 'p-4 md:p-5'
      } space-y-2`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="info" appearance="outline" size="sm" className="font-bold uppercase text-[10px]">
          Formation visée
        </Badge>
        <Badge variant="secondary" appearance="outline" size="sm" className="text-[10px] font-semibold">
          Dossier : {statutLib}
        </Badge>
      </div>
      <div className="space-y-1">
        <p className={`font-bold text-foreground ${dense ? 'text-base' : 'text-lg'} leading-snug`}>
          {formationNom}
        </p>
        {sessionVue ?
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground/80">Session précisée</span>
            {' · '}
            {sessionVue}
          </p>
        : <p className="text-sm text-muted-foreground">Pas encore de session catalogue indiquée sur le dossier.</p>}
      </div>
      {!dense && (
        <p className="text-[11px] leading-relaxed text-muted-foreground border-t border-border/60 pt-2 mt-1">
          Cette vue résume la formation ciblée avant validation définitive : le candidat prépare généralement son dossier
          puis peut s’inscrire à une session après accord (voir l’onglet Parcours / pipeline).
        </p>
      )}
    </div>
  );
}
