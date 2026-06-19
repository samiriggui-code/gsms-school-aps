'use client';

import { CheckCircle2, ClipboardCheck, GraduationCap } from 'lucide-react';
import { type SsiapLevel, type SsiapType } from '../../ssiap-details-sheet';
import { useSsiapSheetContent } from '../content';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';

export function SsiapCertificationInfo({ level, type }: { level: SsiapLevel; type: SsiapType }) {
  const content = useSsiapSheetContent(level, type);
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
