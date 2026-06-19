'use client';

import { IamCompactBadges } from '@/components/iam/iam-compact-badges';
import type { UserPermission, UserRole } from '@/app/models/user';

type Props = {
  permission: UserPermission & { roles?: UserRole[] };
};

export function PermissionRolesCell({ permission }: Props) {
  const roles = permission.roles ?? [];

  return (
    <IamCompactBadges
      items={roles.map((role) => ({
        id: role.id,
        label: role.name,
        title: role.slug ?? undefined,
      }))}
      maxVisible={3}
    />
  );
}
