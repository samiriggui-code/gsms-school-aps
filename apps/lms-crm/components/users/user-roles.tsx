'use client';

import { UserRolesGroups } from './components/user-roles-groups';

export function UserRoles({ user }: { user: any }) {
  return (
    <div className="space-y-5">
      <UserRolesGroups user={user} />
    </div>
  );
}
