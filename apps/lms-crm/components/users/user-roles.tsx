'use client';

import { UserAccessStats } from "./components/user-access-stats";
import { UserAccessDetails } from "./components/user-access-details";
import { UserRolesGroups } from "./components/user-roles-groups";

export function UserRoles({ user }: { user: any }) {
  return (
    <div className="space-y-5">
      <UserAccessStats user={user} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <UserAccessDetails user={user} />
        <UserRolesGroups user={user} />
      </div>
    </div>
  );
}
