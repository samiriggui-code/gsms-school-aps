'use client';

import { Award, FileCheck, ShieldCheck } from 'lucide-react';
import { type EntrepriseType } from '../../entreprise-details-sheet';
import { useEntrepriseSheetContent } from '../content';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';

export function EntrepriseCertificationInfo({ type }: { type: EntrepriseType }) {
  const content = useEntrepriseSheetContent(type);
  const steps = content.certSteps.map((step, index) => ({
    ...step,
    icon:
      index === 0 ? (
        <Award className="size-5 text-primary" />
      ) : index === 1 ? (
        <FileCheck className="size-5 text-primary" />
      ) : (
        <ShieldCheck className="size-5 text-green-500" />
      ),
  }));

  return <SheetCertificationSteps steps={steps} />;
}
