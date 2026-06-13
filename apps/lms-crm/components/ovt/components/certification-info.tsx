'use client';

import { CheckCircle2, ClipboardCheck, Layout } from 'lucide-react';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';
import { useOvtSheetContent } from '../content';

export function OvtCertificationInfo() {
  const content = useOvtSheetContent();
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <Layout className="size-5 text-indigo-500" />
      ) : index === 1 ? (
        <ClipboardCheck className="size-5 text-orange-500" />
      ) : (
        <CheckCircle2 className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
