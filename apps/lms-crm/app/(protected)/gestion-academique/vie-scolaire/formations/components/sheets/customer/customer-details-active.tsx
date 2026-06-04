'use client';

import type { CertificationStepRow } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/utils/formation-catalog-sheet-view-model';
import { ActivityPage } from './components/activity/activity';

export function CustomerDetailsActivity({
  certificationSteps,
}: {
  certificationSteps: CertificationStepRow[];
}) {
  return <ActivityPage steps={certificationSteps} />;
}