'use client';

import { ModuleLandingStaffOverviewTable } from '@/components/common/module-landing-staff-overview-table';

export function AccesOverviewTable() {
  return (
    <ModuleLandingStaffOverviewTable
      title="Éléments récents"
      viewAllHref="/securite-configuration/acces/users"
    />
  );
}
