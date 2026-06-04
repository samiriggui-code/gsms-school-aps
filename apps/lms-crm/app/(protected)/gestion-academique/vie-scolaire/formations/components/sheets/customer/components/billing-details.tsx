'use client';

import { Card, CardContent } from '@/components/ui/card';
import type { FormationSheetViewModel } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

type Props = {
  fundingBlocks: FormationSheetViewModel['fundingBlocks'];
};

export function BillingDetails({ fundingBlocks }: Props) {
  return (
    <Card className="bg-accent/70 rounded-md shadow-none h-full flex flex-col">
      <CardContent className="p-0 flex flex-col h-full">
        <h3 className="text-sm font-medium text-foreground py-2.5 ps-2">Options de Financement</h3>
        <div className="bg-background rounded-md m-1 mt-0 border border-input py-6 px-3.5 space-y-5 h-full">
          {fundingBlocks.map((row, index) => (
            <div key={`${row.label}-${index}`} className="flex gap-2 lg:gap-10">
              <span className="basis-1/3 text-xs font-normal text-secondary-foreground/80 leading-6">
                {row.label}
              </span>
              <span className="basis-2/3 text-2sm font-normal text-foreground leading-6">{row.info}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}