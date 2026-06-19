'use client';

import { User as Conformite } from '@/app/models/user';
import { CollaborateurRolesGroups } from '../../../collaborateurs/components/details/collaborateur-roles-groups';

export function ConformiteRolesGroups({ conformite }: { conformite: Conformite }) {
  return <CollaborateurRolesGroups collaborateur={conformite} />;
}
