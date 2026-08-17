'use client';

import { User as Etudiant } from '@/app/models/user';
import { EtudiantAccessStats } from './details/etudiant-access-stats';
import { EtudiantAccessDetails } from './details/etudiant-access-details';
import { EtudiantRolesGroups } from './details/etudiant-roles-groups';
import { EtudiantPermissionsList } from './details/etudiant-permissions-list';
import type { LmsAccessTier } from '@/lib/portal/lms-access-shared';

export function EtudiantDetailsPermissions({
  Etudiant,
  lmsAccessTier = 'none',
}: {
  Etudiant: Etudiant;
  lmsAccessTier?: LmsAccessTier;
}) {
  return (
    <div className="space-y-5">
      <EtudiantAccessStats Etudiant={Etudiant} lmsAccessTier={lmsAccessTier} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch min-w-0">
        <EtudiantAccessDetails Etudiant={Etudiant} />
        <EtudiantRolesGroups Etudiant={Etudiant} />
      </div>
      <EtudiantPermissionsList Etudiant={Etudiant} />
    </div>
  );
}
