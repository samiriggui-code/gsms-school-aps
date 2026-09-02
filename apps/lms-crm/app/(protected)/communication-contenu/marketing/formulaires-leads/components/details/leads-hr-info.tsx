'use client';

import { User as Etudiant } from "@/app/models/user";
import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { 
  Calendar, 
  MapPin, 
  CreditCard, 
  FileText, 
  Clock, 
  Fingerprint,
  User as UserIcon,
  ShieldCheck,
  Hash
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { LeadsHubListRow } from "../leads-hub-list";

interface EtudiantHRInfoProps {
  Etudiant: Etudiant;
  leadRow?: LeadsHubListRow | null;
  /** Masque la carte pro (parcours « candidat » avant obtention CAR). */
  hideMetierCartePro?: boolean;
  /** Masque contrat / poste (sans contrat avant embauche). */
  hideContratPoste?: boolean;
  /** Titre du bloc carte (par défaut : RH administratif). */
  cardTitle?: string;
}

export function EtudiantHRInfo({
  Etudiant,
  leadRow = null,
  hideMetierCartePro = false,
  hideContratPoste = false,
  cardTitle = 'Informations RH & Administratives',
}: EtudiantHRInfoProps) {
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Non renseigné';
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return "Format invalide";
    }
  };

  if (leadRow) {
    const source = leadRow.source ?? '';
    const isPreinscription = source.toLowerCase().includes('preinscription');
    const lines = (leadRow.raw.notes ?? '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
    const parsed = Object.fromEntries(
      lines
        .filter((l) => l.includes(':'))
        .map((l) => {
          const i = l.indexOf(':');
          return [l.slice(0, i).trim().toLowerCase(), l.slice(i + 1).trim()];
        }),
    );

    const getField = (...keys: string[]) => {
      for (const k of keys) {
        const v = parsed[k.toLowerCase()];
        if (v) return v;
      }
      return 'Non renseigné';
    };
    const desiredFormation =
      leadRow.raw.formation?.name ??
      (getField('formation visée', 'formation demandée', 'libellé') !== 'Non renseigné'
        ? getField('formation visée', 'formation demandée', 'libellé')
        : 'Non renseignée');

    return (
      <Card className="shadow-none border border-border/60 bg-background">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-background">
          <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground">
            <div className="p-2 rounded-lg bg-background border border-border">
              <Fingerprint className="size-4 text-foreground/70" />
            </div>
            {isPreinscription ? 'Informations formulaire préinscription' : 'Informations demande de devis'}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-8 p-6">
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  {isPreinscription ? 'Profil candidat' : 'Contact entreprise'}
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <span className="font-medium text-muted-foreground">Téléphone</span>
                  <span className="font-semibold text-foreground">{leadRow.phone ?? 'Non renseigné'}</span>
                </div>
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <span className="font-medium text-muted-foreground">
                    {isPreinscription ? 'Date de naissance' : 'Raison sociale'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {isPreinscription
                      ? getField('date de naissance')
                      : getField('raison sociale', 'company')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-2sm">
                  <span className="font-medium text-muted-foreground">
                    {isPreinscription ? 'Nationalité' : 'SIRET / SIREN'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {isPreinscription ? getField('nationalité') : getField('siret / siren', 'companysiret')}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                  Projet formation
                </h4>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <span className="font-medium text-muted-foreground">Formation</span>
                  <span className="font-semibold text-foreground">{desiredFormation}</span>
                </div>
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <span className="font-medium text-muted-foreground">
                    {isPreinscription ? 'Financement' : 'Stagiaires estimés'}
                  </span>
                  <span className="font-semibold text-foreground">
                    {isPreinscription ? getField('mode de financement souhaité') : getField('nombre de stagiaires (estimation)', 'traineesexpected')}
                  </span>
                </div>
                <div className="flex items-center justify-between text-2sm">
                  <span className="font-medium text-muted-foreground">
                    {isPreinscription ? 'Session visée' : 'Période souhaitée'}
                  </span>
                  <span className="font-semibold text-foreground text-right max-w-[65%]">
                    {isPreinscription ? getField('session visée') : getField('période ou dates souhaitées', 'preferreddates')}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Notes formulaire
              </h4>
            </div>
            <div className="rounded-lg border border-border bg-background p-4">
              <p className="text-2sm text-foreground whitespace-pre-wrap">
                {leadRow.raw.notes || 'Aucune note formulaire.'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-background">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground">
          <div className="p-2 rounded-lg bg-background border border-border">
            <Fingerprint className="size-4 text-foreground/70" />
          </div>
          {cardTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        {/* Civil Status */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">État civil</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date de naissance</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(Etudiant.birthDate)}</span>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="font-medium">Lieu de naissance</span>
                </div>
                <span className="font-semibold text-foreground">{Etudiant.birthPlace || 'Non renseigné'}</span>
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <UserIcon className="size-3.5" />
                    <span className="font-medium">Nationalité</span>
                </div>
                <span className="font-semibold text-foreground">{Etudiant.nationality || 'Non renseigné'}</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Identification</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Hash className="size-3.5" />
                    <span className="font-medium">NIR (Secu)</span>
                </div>
                <code className="bg-background text-foreground font-bold px-2 py-0.5 rounded text-[11px] border border-border">{Etudiant.socialSecurityNumber || 'Non renseigné'}</code>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span className="font-medium">CNI / Passeport</span>
                </div>
                <span className="font-semibold text-foreground">{Etudiant.cniNumber || 'Non renseigné'}</span>
              </div>
              {Etudiant.residencePermitNumber && (
                <div className="flex items-center justify-between text-2sm p-3 bg-background rounded-lg border border-border mt-1">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-foreground/70">
                        <ShieldCheck className="size-3.5" />
                        <span className="font-bold text-[10px] uppercase">Titre de séjour</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">N° {Etudiant.residencePermitNumber}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">Expire le</div>
                    <div className="text-xs font-bold text-foreground">{formatDate(Etudiant.residencePermitExpiry)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {!hideContratPoste && (
          <div className="pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Contrat & Poste</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="font-medium">Type de contrat</span>
                  </div>
                  {Etudiant.contractType ?
                    <Badge variant="outline" size="sm" className="font-bold text-foreground/80">{Etudiant.contractType}</Badge>
                  : <span className="font-semibold text-foreground">Non renseigné</span>}
                </div>
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className="font-medium">Temps de travail</span>
                  </div>
                  <span className="font-semibold text-foreground">{Etudiant.workTimeType === 'FULL_TIME' ? 'Temps Plein' : Etudiant.workTimeType === 'PART_TIME' ? 'Temps Partiel' : 'Non renseigné'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date d&apos;entrée</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatDate(Etudiant.contractStartDate)}</span>
                </div>
                {Etudiant.contractEndDate && (
                  <div className="flex items-center justify-between text-2sm">
                    <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="font-medium">Date de fin</span>
                    </div>
                    <span className="font-semibold text-foreground">{formatDate(Etudiant.contractEndDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {!hideMetierCartePro && (
          <div className="pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Sécurité métier</h4>
            </div>
            <div className="grid sm:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">N° carte professionnelle</span>
                  </div>
                  <span className="font-bold text-foreground">{Etudiant.carteProNumber || 'Non renseigné'}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Expiration Carte Pro</span>
                  </div>
                  <span className="font-bold text-foreground">{formatDate(Etudiant.carteProExpiry)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Adresse résidentielle</h4>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
            <div className="p-2 rounded-md bg-background border border-border">
                <MapPin className="size-4 text-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{Etudiant.address || 'Non renseigné'}</p>
              {(Etudiant.postalCode || Etudiant.city) && (
                <p className="text-2sm text-muted-foreground font-medium">{Etudiant.postalCode} {Etudiant.city}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}


