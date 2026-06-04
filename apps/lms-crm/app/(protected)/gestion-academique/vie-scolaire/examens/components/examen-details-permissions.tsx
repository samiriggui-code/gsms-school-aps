'use client';

import { User as Examen } from "@/app/models/user";
import { ExamenAccessStats } from "./details/examen-access-stats";
import { ExamenAccessDetails } from "./details/examen-access-details";
import { ExamenRolesGroups } from "./details/examen-roles-groups";
import { ExamenPermissionsList } from "./details/examen-permissions-list";

export function ExamenDetailsPermissions({ Examen }: { Examen: Examen }) {
  return (
    <div className="space-y-5">
      <ExamenAccessStats Examen={Examen} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <ExamenAccessDetails Examen={Examen} />
        <ExamenRolesGroups Examen={Examen} />  
      </div>  
      <ExamenPermissionsList Examen={Examen} />
    </div>
  );
}


