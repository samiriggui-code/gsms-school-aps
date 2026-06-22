'use client';

import { IamCompactBadges } from '@/components/iam/iam-compact-badges';
import type { UserRole } from '@/app/models/user';

type Props = {
  role: UserRole;
};

export function RolePermissionsCell({ role }: Props) {
  const permissions = role.permissions ?? [];

  return (
    <IamCompactBadges
      items={permissions.map((p) => ({
        id: p.id,
        label: p.name ?? p.slug ?? '—',
        title: p.slug ?? undefined,
      }))}
      maxVisible={3}
    />
  );
}
