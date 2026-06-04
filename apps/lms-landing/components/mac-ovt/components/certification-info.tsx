'use client';

import { CheckCircle2, ClipboardCheck, History } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useMacOvtSheetContent } from '../content';

export function MacOvtCertificationInfo() {
  const content = useMacOvtSheetContent();
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <History className="size-5 text-blue-500" />
      ) : index === 1 ? (
        <ClipboardCheck className="size-5 text-orange-500" />
      ) : (
        <CheckCircle2 className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
