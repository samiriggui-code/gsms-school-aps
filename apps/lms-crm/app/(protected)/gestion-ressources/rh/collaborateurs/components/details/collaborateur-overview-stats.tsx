'use client';

import { User as Collaborateur } from '@/app/models/user';
import { RhStaffOverviewStats } from '@/components/rh/rh-staff-overview-stats';

export function CollaborateurOverviewStats({ collaborateur }: { collaborateur: Collaborateur }) {
  return <RhStaffOverviewStats collaborateur={collaborateur} />;
}
