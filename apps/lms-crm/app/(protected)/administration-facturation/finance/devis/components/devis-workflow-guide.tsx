'use client';

import { ArrowRight, CheckCircle2, FileText, Send, Wallet } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    icon: FileText,
    title: '1. Demande entrante',
    body: 'Lead landing, formulaire devis ou création manuelle → brouillon dans cette liste.',
  },
  {
    icon: FileText,
    title: '2. Brouillon',
    body: 'Renseignez le client, les lignes (catalogue formations) et le montant TTC.',
  },
  {
    icon: Send,
    title: '3. Envoi au client',
    body: 'PDF brandé, e-mail ou lien page client (plaquette). Le client peut échanger avec l’équipe RH et accepter en ligne.',
  },
  {
    icon: Wallet,
    title: '4. Acceptation → Facture',
    body: 'Devis accepté (client ou CRM) : le dossier passe dans Factures pour émission PDF et encaissement.',
  },
] as const;

export function DevisWorkflowGuide({ className }: { className?: string }) {
  return (
    <Card className={cn('border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent shadow-none', className)}>
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div>
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle2 className="size-4 text-primary" />
              Comment ça marche ?
            </p>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl leading-relaxed">
              Un <strong className="text-foreground font-medium">devis</strong> est une proposition chiffrée envoyée au
              client. Ce n&apos;est pas encore une facture : la facture n&apos;apparaît qu&apos;après{' '}
              <strong className="text-foreground font-medium">acceptation</strong>.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={step.title}
                className="relative rounded-lg border border-border/70 bg-background/80 px-3 py-3 text-xs"
              >
                {i < STEPS.length - 1 ? (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/40 z-10" />
                ) : null}
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="size-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="size-3.5 text-primary" />
                  </div>
                  <p className="font-bold text-foreground">{step.title}</p>
                </div>
                <p className="text-muted-foreground leading-relaxed pl-9">{step.body}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
