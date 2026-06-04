'use client';

import { User as Certification } from "@/app/models/user";
import { CertificationAccessStats } from "./details/certification-access-stats";
import { CertificationAccessDetails } from "./details/certification-access-details";
import { CertificationRolesGroups } from "./details/certification-roles-groups";
import { CertificationPermissionsList } from "./details/certification-permissions-list";

export function CertificationDetailsPermissions({ Certification }: { Certification: Certification }) {
  return (
    <div className="space-y-5">
      <CertificationAccessStats Certification={Certification} />
      <div className="grid lg:grid-cols-2 gap-5 items-stretch">
        <CertificationAccessDetails Certification={Certification} />
        <CertificationRolesGroups Certification={Certification} />  
      </div>  
      <CertificationPermissionsList Certification={Certification} />
    </div>
  );
}


