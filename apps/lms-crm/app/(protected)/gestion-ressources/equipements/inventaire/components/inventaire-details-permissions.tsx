'use client';

import { User as Inventaire } from "@/app/models/user";
import { InventaireAccessStats } from "./details/inventaire-access-stats";
import { InventaireAccessDetails } from "./details/inventaire-access-details";
import { InventaireRolesGroups } from "./details/inventaire-roles-groups";
import { InventairePermissionsList } from "./details/inventaire-permissions-list";

export function InventaireDetailsPermissions({ inventaire }: { inventaire: Inventaire }) {
  return (
    <div className="space-y-5">
      <InventaireAccessStats inventaire={inventaire} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <InventaireAccessDetails inventaire={inventaire} />
        <InventaireRolesGroups inventaire={inventaire} />  
      </div>  
      <InventairePermissionsList inventaire={inventaire} />
    </div>
  );
}
