'use client';

import { useQuery } from '@tanstack/react-query';
import { Badge } from '@repo/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { FileUp, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import {
  CNAPS_DOSSIER_SLOTS,
  fetchUserRhDocuments,
  hasRhDocForCategory,
} from '../../lib/cnaps-dossier-documents';

export function CandidatConformiteDossierSection({ userId }: { userId: string }) {
  const { data: uploads = [], isLoading } = useQuery({
    queryKey: ['gestion-academique', 'rh-documents-cnaps', userId],
    queryFn: () => fetchUserRhDocuments(userId),
    enabled: Boolean(userId),
    staleTime: 30_000,
  });

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
          <FileUp className="size-4 text-muted-foreground" />
          Dépôt du dossier (autorisation préalable CNAPS)
        </CardTitle>
        <CardDescription className="text-xs">
          Centralisez ici les pièces destinées au dossier transmis depuis le mail personnel du candidat vers les
          canaux prévus par le CNAPS ; le téléversement structuré (catégories ci-dessous) sera relié lorsque la route RH
          d’upload sera activée pour ces types.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert appearance="outline" variant="secondary" className="border-border shadow-none bg-muted/20">
          <AlertIcon>
            <Info className="size-4" />
          </AlertIcon>
          <AlertTitle className="text-xs font-semibold">Process métier</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Une fois la demande préalable instruite et l’accord CNAPS délivré, le candidat pourra être inscrit aux
            sessions CRM (voir statut dossier « validé »).
          </AlertDescription>
        </Alert>

        <ul className="space-y-2">
          {CNAPS_DOSSIER_SLOTS.map((slot) => {
            const ok = hasRhDocForCategory(uploads, slot.category);
            return (
              <li
                key={slot.category}
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2.5"
              >
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">{slot.title}</p>
                  <p className="text-xs text-muted-foreground leading-snug">{slot.description}</p>
                </div>
                <Badge variant={ok ? 'success' : 'outline'} appearance="light" className="shrink-0 text-[10px]">
                  {isLoading ? '…' : ok ? 'Fichier associé' : 'À déposer'}
                </Badge>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
