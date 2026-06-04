'use client';

import { User as Inventaire } from "@/app/models/user";
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

interface InventaireHRInfoProps {
  inventaire: Inventaire;
}

export function InventaireHRInfo({ inventaire }: InventaireHRInfoProps) {
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
          Informations Administratives & Identification
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-8 p-6">
        {/* Origin / Creation */}
        <div className="grid sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Origine</h4>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Date d'acquisition</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(inventaire.birthDate)}</span>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <MapPin className="size-3.5" />
                    <span className="font-medium">Lieu d'origine / Site</span>
                </div>
                <span className="font-semibold text-foreground">{inventaire.birthPlace || "Non renseigné"}</span>
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
                    <span className="font-medium">ID Interne</span>
                </div>
                <code className="bg-background text-foreground font-bold px-2 py-0.5 rounded text-[11px] border border-border">{inventaire.socialSecurityNumber || "Non renseigné"}</code>
              </div>
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <CreditCard className="size-3.5" />
                    <span className="font-medium">N° de série</span>
                </div>
                <span className="font-semibold text-foreground">{inventaire.cniNumber || "Non renseigné"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Technical Sheet / Contract */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Fiche Technique & Garantie</h4>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <FileText className="size-3.5" />
                    <span className="font-medium">Type d'acquisition</span>
                </div>
                {inventaire.contractType ? (
                  <Badge variant="outline" size="sm" className="font-bold text-foreground/80">{inventaire.contractType}</Badge>
                ) : (
                  <span className="font-semibold text-foreground">Non renseigné</span>
                )}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm pb-2 border-b border-dashed border-border/60">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Mise en service</span>
                </div>
                <span className="font-semibold text-foreground">{formatDate(inventaire.contractStartDate)}</span>
              </div>
              {inventaire.contractEndDate && (
                <div className="flex items-center justify-between text-2sm">
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="font-medium">Fin de garantie</span>
                  </div>
                  <span className="font-semibold text-foreground">{formatDate(inventaire.contractEndDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Specs */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Spécifications Techniques</h4>
          </div>
          <div className="grid sm:grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <ShieldCheck className="size-3.5" />
                    <span className="font-medium">Référence Interne</span>
                </div>
                <span className="font-bold text-foreground">{inventaire.carteProNumber || "Non renseigné"}</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-2sm">
                <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="size-3.5" />
                    <span className="font-medium">Dernier Contrôle</span>
                </div>
                <span className="font-bold text-foreground">{formatDate(inventaire.carteProExpiry)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Location */}
        <div className="pt-6 border-t border-border/60">
          <div className="flex items-center gap-2 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-foreground/30" />
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Localisation de stockage</h4>
          </div>
          <div className="flex items-start gap-3 p-4 bg-background rounded-lg border border-border">
            <div className="p-2 rounded-md bg-background border border-border">
                <MapPin className="size-4 text-foreground/70" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">{inventaire.address || "Non renseigné"}</p>
              {(inventaire.postalCode || inventaire.city) && (
                <p className="text-2sm text-muted-foreground font-medium">{inventaire.postalCode} {inventaire.city}</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
