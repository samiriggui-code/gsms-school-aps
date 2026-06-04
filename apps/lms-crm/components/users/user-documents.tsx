'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, ExternalLink, ShieldCheck, AlertCircle } from "lucide-react";
import { toAbsoluteUrl } from "@/lib/helpers";

export function UserDocuments({ user }: { user: any }) {
  const documents = [
    {
      id: 'cni',
      name: 'Carte Nationale d\'Identité / Passeport',
      file: user.documentCni,
      expiry: user.cniExpiry, // if available
      category: 'Identité'
    },
    {
      id: 'residence',
      name: 'Titre de Séjour',
      file: user.documentResidencePermit,
      expiry: user.residencePermitExpiry,
      category: 'Séjour'
    },
    {
      id: 'carte_pro',
      name: 'Carte Professionnelle',
      file: user.documentCartePro,
      expiry: user.carteProExpiry,
      category: 'Métier'
    },
    {
      id: 'assurance',
      name: 'Attestation d\'Assurance',
      file: user.documentAssurance,
      category: 'Administratif'
    }
  ];

  const availableDocs = documents.filter(doc => !!doc.file);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-2 gap-5">
        {documents.map((doc) => (
          <Card key={doc.id} className="shadow-none border border-border/60 bg-background overflow-hidden">
            <CardHeader className="pb-3 pt-4 px-4 border-b border-border/50 bg-muted/10">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                  <div className="p-1.5 rounded bg-background border border-border">
                    <FileText className="size-3.5 text-muted-foreground" />
                  </div>
                  {doc.category}
                </CardTitle>
                {doc.file ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 uppercase">
                    <ShieldCheck className="size-3" />
                    Disponible
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase">
                    <AlertCircle className="size-3" />
                    Manquant
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-foreground mb-0.5">{doc.name}</h4>
                  {doc.expiry && (
                    <p className="text-[10px] text-muted-foreground uppercase font-medium">
                      Expire le: <span className="text-foreground">{new Date(doc.expiry).toLocaleDateString('fr-FR')}</span>
                    </p>
                  )}
                </div>
                
                {doc.file ? (
                  <div className="flex gap-2 pt-1">
                    <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 font-bold uppercase text-[10px]">
                      <a href={toAbsoluteUrl(doc.file)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3" />
                        Voir
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="h-8 gap-1.5 font-bold uppercase text-[10px]">
                      <a href={toAbsoluteUrl(doc.file)} download>
                        <Download className="size-3" />
                        Télécharger
                      </a>
                    </Button>
                  </div>
                ) : (
                  <Button variant="secondary" size="sm" className="h-8 gap-1.5 font-bold uppercase text-[10px] opacity-60 cursor-not-allowed">
                    En attente de dépôt
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {availableDocs.length === 0 && (
        <Card className="border-dashed border-2 border-border bg-muted/5">
          <CardContent className="flex flex-col items-center justify-center py-10 text-center">
            <div className="size-12 rounded-full bg-background border border-border flex items-center justify-center mb-4 shadow-sm">
                <FileText className="size-6 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-bold text-foreground">Aucun document numérisé</h3>
            <p className="text-xs text-muted-foreground max-w-[300px] mt-1.5">
              Les documents administratifs de cet utilisateur n'ont pas encore été téléchargés dans le système.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
