'use client';

import { ShieldCheck } from "lucide-react";
import { type AutresType } from '../../autres-details-sheet';
import { useAutresSheetContent } from '../content';
import { SheetCertificationSteps } from '@/components/sheet-shared/certification-steps';

export function AutresCertificationInfo({ type }: { type: AutresType }) {
  const content = useAutresSheetContent(type);
  const steps = content.certSteps.map((step) => ({
    ...step,
    icon: <ShieldCheck className="size-6 text-green-500" />,
  }));
  return <SheetCertificationSteps steps={steps} />;
}
