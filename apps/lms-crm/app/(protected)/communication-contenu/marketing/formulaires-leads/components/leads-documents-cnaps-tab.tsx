'use client';

import { useRef } from 'react';
import { User as Etudiant } from '@/app/models/user';
import { Button } from '@repo/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card';
import { ExternalLink, Printer } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CNAPS_FORMULAIRE_URL =
  'https://www.cnaps.interieur.gouv.fr/contenu/telechargement/5034/42210/file/20260210%20Formulaire%20d%27autorisation%20pr%C3%A9alable%20ou%20provisoire%20d%27entr%C3%A9e%20en%20formation.pdf';

type CompanyProfile = Record<string, unknown> | null;

export function CandidatDocumentsCnapsTab({
  Etudiant,
  formationLabel,
  companyProfile,
}: {
  Etudiant: Etudiant;
  formationLabel: string | null;
  companyProfile: CompanyProfile;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const orgName =
    (companyProfile as { companyProfile?: { companyName?: string } } | null)?.companyProfile?.companyName ||
    (companyProfile as { tenant?: { name?: string } } | null)?.tenant?.name ||
    'Organisme de formation';
  const today = format(new Date(), "d MMMM yyyy", { locale: fr });
  const formation = formationLabel?.trim() || '— (sélectionner une formation catalogue dans le dossier actif)';
  const fullName =
    [Etudiant.firstName, Etudiant.lastName].filter(Boolean).join(' ').trim() || Etudiant.name || '—';

  const handlePrint = () => {
    const el = printRef.current;
    if (!el || typeof window === 'undefined') return;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"/><title>Synthèse autorisation préalable</title>
      <style>
        body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
        h1 { font-size: 16px; text-transform: uppercase; letter-spacing: .05em; }
        table { width:100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
        td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
        td:first-child { width: 36%; font-weight: 600; background: #fafafa; }
      </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    w.print();
    w.close();
  };

  return (
    <div className="space-y-5">
      <Card className="shadow-none border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold uppercase tracking-wider">Autorisation préalable CNAPS — cadre envoi</CardTitle>
          <CardDescription className="text-xs">
            Récap à joindre à la préparation du dossier : le candidat transmet officiellement depuis son mail personnel selon les consignes du téléservice CNAPS ; l’école garantit une
            pré‑inscription / formation attestée figurant ci‑dessous.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-2" asChild>
            <a href={CNAPS_FORMULAIRE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Ouvrir le formulaire officiel CNAPS (PDF)
            </a>
          </Button>
          <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={handlePrint}>
            <Printer className="size-4" />
            Imprimer la synthèse
          </Button>
        </CardContent>
      </Card>

      <div ref={printRef} className="rounded-lg border border-border bg-card p-5 text-sm leading-relaxed">
        <h1 className="text-sm font-bold uppercase tracking-wide text-foreground mb-4">
          Synthèse — désignation formation en vue d&apos;une autorisation préalable
        </h1>
        <p className="text-xs text-muted-foreground mb-4">Document interne préparatoire — {today}</p>
        <table>
          <tbody>
            <tr>
              <td>Organisme attestant la formation projetée</td>
              <td>{orgName}</td>
            </tr>
            <tr>
              <td>Candidat</td>
              <td>{fullName}</td>
            </tr>
            <tr>
              <td>Email de contact dossier</td>
              <td>{Etudiant.email || '—'}</td>
            </tr>
            <tr>
              <td>Formation visée (intitulé catalogue)</td>
              <td>{formation}</td>
            </tr>
            <tr>
              <td>Rappel</td>
              <td>
                L’accord CNAPS prend la forme d’une autorisation préalable ou provisoire ; il autorise à suivre la formation
                et ne vaut pas à lui seul exercice en tant qu’agent de sécurité privée.
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
