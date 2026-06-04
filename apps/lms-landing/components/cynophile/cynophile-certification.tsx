'use client';

import { BookOpen, ClipboardCheck, Dog } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useCynophileSheetContent } from './content';

export function CynophileCertification() {
  const content = useCynophileSheetContent();
  const certification = content.t(`${content.path}.certification`, { returnObjects: true }) as {
    steps: { title: string; description: string; badge: string }[];
    note?: string;
  };
  const steps = certification.steps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <BookOpen className="size-5 text-violet-500" />
      ) : index === 1 ? (
        <Dog className="size-5 text-amber-600" />
      ) : (
        <ClipboardCheck className="size-5 text-green-600" />
      ),
  }));

  return (
    <div className="space-y-5">
      <SheetCertificationSteps steps={steps} />
      {certification.note ? <p className="text-xs text-muted-foreground px-1">{certification.note}</p> : null}
    </div>
  );
}
