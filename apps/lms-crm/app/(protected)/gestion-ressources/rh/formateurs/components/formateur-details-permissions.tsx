'use client';

import { User as Formateur } from "@/app/models/user";
import { FormateurAccessStats } from "./details/formateur-access-stats";
import { FormateurAccessDetails } from "./details/formateur-access-details";
import { FormateurRolesGroups } from "./details/formateur-roles-groups";
import { FormateurPermissionsList } from "./details/formateur-permissions-list";

export function FormateurDetailsPermissions({ collaborateur }: { collaborateur: Formateur }) {
  return (
    <div className="space-y-5">
      <FormateurAccessStats collaborateur={collaborateur} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <FormateurAccessDetails collaborateur={collaborateur} />
        <FormateurRolesGroups collaborateur={collaborateur} />
      </div>
      <FormateurPermissionsList collaborateur={collaborateur} />
    </div>
  );
}
