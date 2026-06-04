'use client';

import { User as Planning } from "@/app/models/user";
import { PlanningAccessStats } from "./details/planning-access-stats";
import { PlanningAccessDetails } from "./details/planning-access-details";
import { PlanningRolesGroups } from "./details/planning-roles-groups";
import { PlanningPermissionsList } from "./details/planning-permissions-list";

export function PlanningDetailsPermissions({ Planning }: { Planning: Planning }) {
  return (
    <div className="space-y-5">
      <PlanningAccessStats Planning={Planning} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <PlanningAccessDetails Planning={Planning} />
        <PlanningRolesGroups Planning={Planning} />  
      </div>  
      <PlanningPermissionsList Planning={Planning} />
    </div>
  );
}


