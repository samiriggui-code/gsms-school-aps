'use client';

import { User as Collaborateur } from "@/app/models/user";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { agrementUiLabels } from '@/lib/rh-agrement';

interface FormateurHRInfoProps {
  collaborateur: Collaborateur;
}

export function FormateurHRInfo({ collaborateur }: FormateurHRInfoProps) {
  const agr = agrementUiLabels('formateur');
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "Non renseigné";
    try {
      return format(new Date(date), "dd MMMM yyyy", { locale: fr });
    } catch (e) {
      return "Format invalide";
    }
  };

  return (
    <Card className="shadow-none border border-border/60 bg-background">
      <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50 bg-background">
        <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5 text-foreground">
          <div className="p-2 rounded-lg bg-background border border-border">
            <Fingerprint className="size-4 text-foreground/70" />
          </div>
          Informations RH & Administratives
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        {/* Civil Status */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">État Civil</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date de naissance</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(collaborateur.birthDate)}</span>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="font-medium">Lieu de naissance</span>
                </div>
                <span className="font-semibold text-foreground">{collaborateur.birthPlace || "Non renseigné"}</span>
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <UserIcon className="size-3.5" />
                    <span className="font-medium">Nationalité</span>
                </div>
                <span className="font-semibold text-foreground">{collaborateur.nationality || "Non renseigné"}</span>
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
                <code className="bg-background text-foreground font-bold px-2 py-0.5 rounded text-[11px] border border-border">{collaborateur.socialSecurityNumber || "Non renseigné"}</code>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span className="font-medium">CNI / Passeport</span>
                </div>
                <span className="font-semibold text-foreground">{collaborateur.cniNumber || "Non renseigné"}</span>
              </div>
              {collaborateur.residencePermitNumber && (
                <div className="flex items-center justify-between text-2sm p-3 bg-background rounded-lg border border-border mt-1">
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2 text-foreground/70">
                        <ShieldCheck className="size-3.5" />
                        <span className="font-bold text-[10px] uppercase">TITRE DE SÉJOUR</span>
                    </div>
                    <span className="text-xs font-semibold text-foreground">N° {collaborateur.residencePermitNumber}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-muted-foreground font-medium">Expire le</div>
                    <div className="text-xs font-bold text-foreground">{formatDate(collaborateur.residencePermitExpiry)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {(collaborateur.teachingSpecialties?.length ?? 0) > 0 && (
          <div className="pt-6 border-t border-border/60">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
                Domaines dispensés
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {collaborateur.teachingSpecialties!.map((s) => (
                <Badge key={s} variant="outline" size="sm" className="font-semibold">
                  {s}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Contract Information */}
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
                {collaborateur.contractType ? (
                  <Badge variant="outline" size="sm" className="font-bold text-foreground/80">{collaborateur.contractType}</Badge>
                ) : (
                  <span className="font-semibold text-foreground">Non renseigné</span>
                )}
              </div>
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className="font-medium">Temps de travail</span>
                </div>
                <span className="font-semibold text-foreground">{collaborateur.workTimeType === 'FULL_TIME' ? 'Temps Plein' : collaborateur.workTimeType === 'PART_TIME' ? 'Temps Partiel' : 'Non renseigné'}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date d'entrée</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(collaborateur.contractStartDate)}</span>
              </div>
              {collaborateur.contractEndDate && (
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="font-medium">Date de fin</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatDate(collaborateur.contractEndDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Agrément formateur */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">{agr.sectionTitle}</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mb-4">{agr.sectionHint}</p>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">{agr.numberLabel}</span>
                </div>
                <span className="font-bold text-foreground">{collaborateur.carteProNumber || "Non renseigné"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">{agr.expiryLabel}</span>
                </div>
                <span className="font-bold text-foreground">{formatDate(collaborateur.carteProExpiry)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Adresse Résidentielle</h4>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
            <div className="p-2 rounded-md bg-background border border-border">
                <MapPin className="size-4 text-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{collaborateur.address || "Non renseigné"}</p>
              {(collaborateur.postalCode || collaborateur.city) && (
                <p className="text-2sm text-muted-foreground font-medium">{collaborateur.postalCode} {collaborateur.city}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
