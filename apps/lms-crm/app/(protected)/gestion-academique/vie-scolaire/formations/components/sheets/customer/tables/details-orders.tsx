'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/accordion';
import type { ProgramModuleAccordionRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

type Props = {
  programModules: ProgramModuleAccordionRow[];
};

export function DetailsOrdersTable({ programModules }: Props) {
  if (!programModules.length) {
    return (
      <p className="text-2sm text-muted-foreground px-1 py-6 text-center">
        Aucun module de programme renseigné pour cette formation.
      </p>
    );
  }

  return (
    <div className="h-[450px] overflow-auto pr-2">
      <Accordion type="single" collapsible className="w-full space-y-2">
        {programModules.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="space-y-0 border border-border rounded-md px-4 bg-accent/30 shadow-none"
          >
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex items-center gap-3">
                <span className="font-bold text-primary min-w-[40px]">{item.id}</span>
                <span className="text-sm font-semibold text-foreground text-left">{item.title}</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 pt-1">
              <ul className="list-disc list-inside space-y-1.5">
                {item.details.map((detail, idx) => (
                  <li key={idx} className="text-2sm text-muted-foreground ml-2 leading-relaxed">
                    {detail}
                  </li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
