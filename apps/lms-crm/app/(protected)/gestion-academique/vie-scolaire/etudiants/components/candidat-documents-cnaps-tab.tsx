'use client';

import { useState } from 'react';
import { User as Etudiant } from '@/app/models/user';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { Alert, AlertDescription, AlertIcon, AlertTitle } from '@repo/ui/alert';
import { Badge } from '@repo/ui/badge';
import { ExternalLink, FileDown, Info, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { CNAPS_DOSSIER_SLOTS } from '../lib/cnaps-dossier-documents';

const CNAPS_FORMULAIRE_URL =
  'https://www.cnaps.interieur.gouv.fr/contenu/telechargement/5034/42210/file/20260210%20Formulaire%20d%27autorisation%20pr%C3%A9alable%20ou%20provisoire%20d%27entr%C3%A9e%20en%20formation.pdf';

export function CandidatDocumentsCnapsTab({
  Etudiant,
  candidatureId,
}: {
  Etudiant: Etudiant;
  candidatureId: string | null;
  formationLabel?: string | null;
  companyProfile?: Record<string, unknown> | null;
}) {
  const [loading, setLoading] = useState(false);

  const handleGeneratePrefilled = async () => {
    if (!Etudiant?.id) return;
    setLoading(true);
    try {
      const qs = candidatureId ? `?candidatureId=${encodeURIComponent(candidatureId)}` : '';
      const res = await apiFetch(
        `/api/sections/gestion-academique/vie-scolaire/etudiants/cnaps-prefilled-form/${Etudiant.id}${qs}`,
      );
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(
          (j?.error?.message as string | undefined) ?? j?.error ?? 'Génération impossible.',
        );
      }
      const missing = res.headers.get('X-Cnaps-Missing-Fields');
      const blob = await res.blob();
      const cd = res.headers.get('Content-Disposition');
      const filenameMatch = cd?.match(/filename=\"([^\"]+)\"/i);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download =
        filenameMatch?.[1] ??
        `cnaps-prefill_${Etudiant.lastName || 'candidat'}_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);

      if (missing) {
        toast.warning(`PDF généré — champs à compléter : ${missing.replace(/\|/g, ', ')}`);
      } else {
        toast.success('Formulaire CNAPS prérempli téléchargé.');
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erreur génération PDF.');
    } finally {
      setLoading(false);
    }
  };

  const formSlot = CNAPS_DOSSIER_SLOTS.find((s) => s.category === 'CNAPS_FORM_OF');

  return (
    <div className="space-y-5">
      <Alert variant="secondary" appearance="outline" className="border-border/70">
        <AlertIcon>
          <Info className="size-4" />
        </AlertIcon>
        <div>
          <AlertTitle className="text-sm">Circuit dossier CNAPS</AlertTitle>
          <AlertDescription className="text-xs leading-relaxed">
            1) Générer le PDF prérempli depuis les données onboarding · 2) Imprimer, faire signer le
            candidat, apposer le tampon école · 3) Rescanner et déposer dans le dossier · 4) Le
            candidat envoie lui-même depuis sa boîte mail au CNAPS (hors CRM) · 5) En attente :
            accès e-formation limité (modules préparatoires).
          </AlertDescription>
        </div>
      </Alert>

      <Card className="shadow-none border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold uppercase tracking-wider">
            Formulaire officiel CNAPS — préremplissage
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed">
            Pre-remplissage sur le PDF officiel CNAPS (fev. 2026) : nom, adresse, centre de formation,
            activites, type de formation, CNI. Prenom, naissance, tel et mail ne sont pas sur ce modele
            &mdash; ils restent dans la fiche candidat CRM. Nom d&apos;usage et signature : manuels.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            className="gap-2"
            disabled={loading || !Etudiant?.id}
            onClick={() => void handleGeneratePrefilled()}
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <FileDown className="size-4" />}
            Télécharger le formulaire prérempli
          </Button>
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={CNAPS_FORMULAIRE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Modèle vierge CNAPS
            </a>
          </Button>
        </CardContent>
      </Card>

      <Card className="shadow-none border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Pièces attendues dans le dossier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {CNAPS_DOSSIER_SLOTS.map((slot) => (
            <div
              key={slot.category}
              className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-border/60 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{slot.title}</p>
                <p className="text-xs text-muted-foreground">{slot.description}</p>
              </div>
              <Badge variant="secondary" appearance="outline" className="shrink-0 text-[10px]">
                {slot.uploadBy === 'school' ? 'École' : 'Candidat'}
              </Badge>
            </div>
          ))}
          {formSlot ? (
            <p className="text-xs text-muted-foreground pt-1">
              Après tampon : uploader le scan dans la conformité dossier ({formSlot.title}).
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
