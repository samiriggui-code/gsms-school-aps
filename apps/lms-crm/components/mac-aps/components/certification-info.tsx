'use client';

import { CheckCircle2, ClipboardCheck, History } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useMacApsSheetContent } from '../content';

export function MacApsCertificationInfo() {
  const content = useMacApsSheetContent();
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <History className="size-5 text-indigo-500" />
      ) : index === 1 ? (
        <ClipboardCheck className="size-5 text-green-500" />
      ) : (
        <CheckCircle2 className="size-5 text-purple-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
