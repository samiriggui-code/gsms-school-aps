'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { SheetCertStep } from '@/lib/sheet-content-types';
import type { ReactNode } from 'react';

type Step = SheetCertStep & { icon: ReactNode };

type Props = {
  steps: Step[];
};

export function SheetCertificationSteps({ steps }: Props) {
  return (
    <div className="space-y-5">
      {steps.map((step, index) => (
        <Card key={index} className="bg-accent/50 rounded-md shadow-none border border-border">
          <CardContent className="p-4 flex items-start gap-4">
            <div className="flex items-center justify-center rounded-md bg-background border border-border size-12 shrink-0">
              {step.icon}
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <Badge variant="outline" size="sm" className="bg-background">
                  {step.badge}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
