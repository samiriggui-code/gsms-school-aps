'use client';

import { ModuleLandingStaffOverviewTable } from '@/components/common/module-landing-staff-overview-table';

export function MarketingOverviewTable() {
  return (
    <ModuleLandingStaffOverviewTable
      title="Collaborateurs récents"
      viewAllHref="/gestion-ressources/rh/collaborateurs"
    />
  );
}
