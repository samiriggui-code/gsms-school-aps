'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@repo/ui/accordion';
import type { SheetProgramModule } from '@/lib/sheet-content-types';

type Props = {
  modules: SheetProgramModule[];
  className?: string;
};

export function SheetProgramAccordion({ modules, className = 'h-[450px] overflow-auto pr-2' }: Props) {
  if (modules.length === 0) return null;

  return (
    <div className={className}>
      <Accordion type="single" collapsible className="w-full space-y-2">
        {modules.map((item) => (
          <AccordionItem
            key={item.id}
            value={item.id}
            className="border border-border rounded-md px-4 bg-accent/30 shadow-none"
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
