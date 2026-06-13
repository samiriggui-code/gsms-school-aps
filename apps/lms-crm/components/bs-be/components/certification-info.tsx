'use client';

import { CheckCircle2, ClipboardCheck, GraduationCap } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useBsBeSheetContent } from '../content';

export function BsBeCertificationInfo() {
  const content = useBsBeSheetContent();
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <ClipboardCheck className="size-5 text-blue-500" />
      ) : index === 1 ? (
        <GraduationCap className="size-5 text-indigo-500" />
      ) : (
        <CheckCircle2 className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
