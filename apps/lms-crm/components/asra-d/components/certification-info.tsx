'use client';

import { CheckCircle2, ClipboardCheck, Target } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useAsraSheetContent } from '../content';

export function AsraCertificationInfo() {
  const content = useAsraSheetContent();
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <Target className="size-5 text-red-500" />
      ) : index === 1 ? (
        <ClipboardCheck className="size-5 text-indigo-500" />
      ) : (
        <CheckCircle2 className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
