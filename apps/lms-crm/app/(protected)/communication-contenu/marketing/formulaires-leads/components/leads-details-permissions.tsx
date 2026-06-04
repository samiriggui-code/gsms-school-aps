'use client';

import { User as Etudiant } from "@/app/models/user";
import { EtudiantAccessStats } from "./details/leads-access-stats";
import { EtudiantAccessDetails } from "./details/leads-access-details";
import { EtudiantRolesGroups } from "./details/leads-roles-groups";
import { EtudiantPermissionsList } from "./details/leads-permissions-list";

export function EtudiantDetailsPermissions({ Etudiant }: { Etudiant: Etudiant }) {
  return (
    <div className="space-y-5">
      <EtudiantAccessStats Etudiant={Etudiant} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <EtudiantAccessDetails Etudiant={Etudiant} />
        <EtudiantRolesGroups Etudiant={Etudiant} />  
      </div>  
      <EtudiantPermissionsList Etudiant={Etudiant} />
    </div>
  );
}



