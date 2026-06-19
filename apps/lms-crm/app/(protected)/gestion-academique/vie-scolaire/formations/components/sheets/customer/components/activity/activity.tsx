'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, ClipboardCheck, GraduationCap, ListTodo } from 'lucide-react';
import type { CertificationStepRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';

function stepIcon(iconKey?: string) {
  const k = iconKey?.toLowerCase() ?? '';
  if (k.includes('graduation') || k.includes('diploma') || k.includes('certif')) {
    return <GraduationCap className="size-5 text-purple-500" />;
  }
  if (k.includes('check')) {
    return <CheckCircle2 className="size-5 text-green-500" />;
  }
  if (k.includes('clipboard')) {
    return <ClipboardCheck className="size-5 text-indigo-500" />;
  }
  return <ListTodo className="size-5 text-muted-foreground" />;
}

type Props = {
  steps: CertificationStepRow[];
};

export function ActivityPage({ steps }: Props) {
  return (
    <div className="space-y-5">
      {steps.map((step, index) => (
        <Card key={`${step.title}-${index}`} className="bg-accent/50 rounded-md shadow-none border border-border">
          <CardContent className="p-4 flex items-start gap-4">
            <div className="flex items-center justify-center rounded-md bg-background border border-border size-12 shrink-0">
              {stepIcon(step.iconKey)}
            </div>
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold text-foreground">{step.title}</h4>
                <Badge variant="outline" size="sm" className="bg-background">
                  {step.badge}
                </Badge>
              </div>
              {step.description ? (
                <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
