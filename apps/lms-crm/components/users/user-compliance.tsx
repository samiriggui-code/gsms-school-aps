'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui/card";
import { Badge } from "@repo/ui/badge";
import { ShieldCheck, AlertCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserCompliance({ user }: { user: any }) {
  const now = new Date();
  
  const checkExpiry = (date: Date | string | null | undefined) => {
    if (!date) return 'missing';
    const expiryDate = new Date(date);
    if (expiryDate < now) return 'expired';
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    if (expiryDate < thirtyDaysFromNow) return 'warning';
    return 'valid';
  };

  const checks = [
    {
      name: "Carte Professionnelle",
      status: checkExpiry(user.carteProExpiry),
      value: user.carteProNumber || "Non renseigné",
      date: user.carteProExpiry
    },
    {
      name: "Titre de Séjour",
      status: checkExpiry(user.residencePermitExpiry),
      value: user.residencePermitNumber || "Non renseigné",
      date: user.residencePermitExpiry
    },
    {
      name: "Identité (CNI/Passeport)",
      status: user.documentCni ? 'valid' : 'missing',
      value: user.cniNumber || "Non renseigné",
    },
    {
      name: "Email Vérifié",
      status: user.emailVerifiedAt ? 'valid' : 'warning',
      value: user.emailVerifiedAt ? "Compte vérifié" : "Email non vérifié",
    }
  ];

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'valid': return { label: 'Conforme', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2 };
      case 'warning': return { label: 'Attention', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', icon: Clock };
      case 'expired': return { label: 'Expiré', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: XCircle };
      case 'missing': return { label: 'Manquant', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', icon: AlertCircle };
      default: return { label: 'Inconnu', color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', icon: AlertCircle };
    }
  };

  const isGlobalCompliant = checks.every(c => c.status === 'valid');

  return (
    <div className="space-y-6">
      {/* Global Status Banner */}
      <Card className={cn(
        "shadow-none border-2",
        isGlobalCompliant ? "border-emerald-200 bg-emerald-50/30" : "border-amber-200 bg-amber-50/30"
      )}>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className={cn(
                "size-12 rounded-full flex items-center justify-center shadow-sm",
                isGlobalCompliant ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
            )}>
              {isGlobalCompliant ? <ShieldCheck className="size-6" /> : <AlertCircle className="size-6" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {isGlobalCompliant ? "Profil 100% Conforme" : "Conformité à finaliser"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isGlobalCompliant 
                    ? "Toutes les pièces administratives et validations sont à jour." 
                    : "Certains documents sont manquants ou arrivent à expiration prochainement."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-border/60 bg-background overflow-hidden">
        <CardHeader className="pb-4 pt-6 px-6 border-b border-border/50">
            <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-background border border-border">
                    <ShieldCheck className="size-4 text-foreground/70" />
                </div>
                Points de contrôle réglementaires
            </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border/50">
            {checks.map((check, index) => {
              const info = getStatusInfo(check.status);
              const Icon = info.icon;
              return (
                <div key={index} className="flex items-center justify-between p-4 px-6 hover:bg-muted/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={cn("size-8 rounded-full flex items-center justify-center", info.bg, info.color)}>
                        <Icon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-bold text-foreground leading-none">{check.name}</span>
                      <span className="text-xs text-muted-foreground font-medium">{check.value}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <Badge variant="outline" className={cn("font-bold uppercase text-[10px] tracking-widest border-none px-2.5", info.bg, info.color)}>
                      {info.label}
                    </Badge>
                    {check.date && (
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                            Exp. {new Date(check.date).toLocaleDateString('fr-FR')}
                        </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
