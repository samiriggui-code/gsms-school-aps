'use client';

import { User as Conformite } from "@/app/models/user";
import { ConformiteAccessStats } from "./details/conformite-access-stats";
import { ConformiteAccessDetails } from "./details/conformite-access-details";
import { ConformiteRolesGroups } from "./details/conformite-roles-groups";
import { ConformitePermissionsList } from "./details/conformite-permissions-list";

export function ConformiteDetailsPermissions({ conformite }: { conformite: Conformite }) {
  return (
    <div className="space-y-5">
      <ConformiteAccessStats conformite={conformite} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <ConformiteAccessDetails conformite={conformite} />
        <ConformiteRolesGroups conformite={conformite} />  
      </div>  
      <ConformitePermissionsList conformite={conformite} />
    </div>
  );
}
