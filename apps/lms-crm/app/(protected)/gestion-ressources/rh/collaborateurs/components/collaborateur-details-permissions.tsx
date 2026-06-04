'use client';

import { User as Collaborateur } from "@/app/models/user";
import { CollaborateurAccessStats } from "./details/collaborateur-access-stats";
import { CollaborateurAccessDetails } from "./details/collaborateur-access-details";
import { CollaborateurRolesGroups } from "./details/collaborateur-roles-groups";
import { CollaborateurPermissionsList } from "./details/collaborateur-permissions-list";

export function CollaborateurDetailsPermissions({ collaborateur }: { collaborateur: Collaborateur }) {
  return (
    <div className="space-y-5">
      <CollaborateurAccessStats collaborateur={collaborateur} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <CollaborateurAccessDetails collaborateur={collaborateur} />
        <CollaborateurRolesGroups collaborateur={collaborateur} />  
      </div>  
      <CollaborateurPermissionsList collaborateur={collaborateur} />
    </div>
  );
}
