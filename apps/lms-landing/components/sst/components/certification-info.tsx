'use client';

import { CheckCircle2, ClipboardCheck, GraduationCap } from 'lucide-react';
import { type SstType } from '../../sst-details-sheet';
import { useSstSheetContent } from '../content';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';

export function SstCertificationInfo({ type }: { type: SstType }) {
  const content = useSstSheetContent(type);
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
