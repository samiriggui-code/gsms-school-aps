'use client';

import { User as Formation } from "@/app/models/user";
import { FormationAccessStats } from "./details/formation-access-stats";
import { FormationAccessDetails } from "./details/formation-access-details";
import { FormationRolesGroups } from "./details/formation-roles-groups";
import { FormationPermissionsList } from "./details/formation-permissions-list";

export function FormationDetailsPermissions({ Formation }: { Formation: Formation }) {
  return (
    <div className="space-y-5">
      <FormationAccessStats Formation={Formation} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <FormationAccessDetails Formation={Formation} />
        <FormationRolesGroups Formation={Formation} />  
      </div>  
      <FormationPermissionsList Formation={Formation} />
    </div>
  );
}


