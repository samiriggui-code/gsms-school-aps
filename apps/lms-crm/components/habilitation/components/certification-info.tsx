'use client';

import { CheckCircle2, ClipboardCheck, GraduationCap } from 'lucide-react';
import { type HabType } from '../../habilitation-details-sheet';
import { useHabSheetContent } from '../content';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';

export function HabCertificationInfo({ type }: { type: HabType }) {
  const content = useHabSheetContent(type);
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <ClipboardCheck className="size-5 text-indigo-500" />
      ) : index === 1 ? (
        <GraduationCap className="size-5 text-indigo-500" />
      ) : (
        <CheckCircle2 className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
