'use client';

import { User as Etudiant } from "@/app/models/user";
import { EtudiantAccessStats } from "./details/etudiant-access-stats";
import { EtudiantAccessDetails } from "./details/etudiant-access-details";
import { EtudiantRolesGroups } from "./details/etudiant-roles-groups";
import { EtudiantPermissionsList } from "./details/etudiant-permissions-list";

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



