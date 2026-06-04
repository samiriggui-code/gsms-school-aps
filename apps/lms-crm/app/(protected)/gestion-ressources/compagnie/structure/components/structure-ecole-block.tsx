'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function StructureEcoleBlock() {
  return (
    <Card className="border border-border/70 shadow-none overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between md:p-6">
          <div className="flex gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10">
              <Building2 className="size-6 text-primary/80" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Fiche établissement
              </p>
              <p className="text-base font-semibold text-foreground md:text-lg">
                Raison sociale, logo, coordonnées
              </p>
              <p className="max-w-2xl text-sm text-muted-foreground leading-relaxed">
                Identité légale et contacts affichés côté public : menu <span className="font-medium text-foreground">Mon organisation</span>, puis{' '}
                <span className="font-medium text-foreground">Profil compagnie</span> (même espace, autre entrée de menu).
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
