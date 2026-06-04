'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, TrendingUp } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import Link from 'next/link';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

const DEFAULT_PRESENTATION: FormationSheetViewModel['presentation'] = {
  title: 'Formation',
  body: '',
  bullets: [],
  cpfEligible: false,
  rncpUrl: null,
};

type Props = {
  presentation?: FormationSheetViewModel['presentation'] | null;
};

export function RecentOrders({ presentation }: Props) {
  const { title, body, bullets, cpfEligible, rncpUrl } = presentation ?? DEFAULT_PRESENTATION;

  return (
    <TooltipProvider>
      <Card className="bg-accent/50 rounded-md shadow-none">
        <CardContent className="p-0 flex flex-col h-full">
          <h3 className="text-sm font-medium text-foreground py-2.5 ps-2 bg-accent/70 rounded-t-md border-b border-input">
            Présentation de la formation
          </h3>
          <div className="bg-background rounded-md m-1 mt-0 border border-input py-5 px-3.5 flex flex-col justify-between h-full">
            <div className="space-y-4 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center rounded-md bg-background border border-border size-[36px] shrink-0">
                  <div className="flex items-center justify-center bg-accent/50 rounded-md size-[30px]">
                    <ShoppingCart className="w-5 h-5 fill-indigo-600 text-indigo-600" />
                  </div>
                </div>
                <span className="text-base font-semibold text-foreground">{title}</span>
              </div>
              {body ? (
                <p className="text-sm text-muted-foreground whitespace-pre-line">{body}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Description détaillée à compléter sur la fiche formation en base.
                </p>
              )}
              {bullets.length > 0 ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {bullets.map((line, i) => (
                    <p key={i}>{line}</p>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              {cpfEligible ? (
                <Badge variant="success" size="sm" appearance="light">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Éligible CPF
                </Badge>
              ) : (
                <span className="text-2sm text-muted-foreground">Financement selon référentiel</span>
              )}
              <Separator className="my-3.5" />
              {rncpUrl ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={rncpUrl} target="_blank" rel="noopener noreferrer">
                    Voir la fiche RNCP
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Fiche RNCP non renseignée
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
