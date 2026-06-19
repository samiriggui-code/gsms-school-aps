type RolePermissionJoin = {
  permission?: {
    id: string;
    slug: string;
    name: string;
    description?: string | null;
  } | null;
};

type RoleWithPermissions = {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  isProtected?: boolean;
  permissions?: RolePermissionJoin[] | null;
};

export type IamPermissionRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
};

/** Aplatit `UserRolePermission[]` → permissions catalogue pour l'UI IAM. */
export function flattenRolePermissions(
  role: RoleWithPermissions | null | undefined,
): IamPermissionRow[] {
  if (!role?.permissions?.length) return [];
  const rows: IamPermissionRow[] = [];
  for (const rp of role.permissions) {
    const p = rp.permission;
    if (!p?.id) continue;
    rows.push({
      id: p.id,
      slug: p.slug,
      name: p.name,
      description: p.description ?? null,
    });
  }
  return rows.sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

/** Gère permissions déjà aplaties (API IAM) ou jointures Prisma brutes. */
export function resolveRolePermissionRows(
  role: RoleWithPermissions | { permissions?: unknown[] } | null | undefined,
): IamPermissionRow[] {
  if (!role?.permissions?.length) return [];
  const first = role.permissions[0] as Record<string, unknown> | undefined;
  if (
    first &&
    typeof first === 'object' &&
    typeof first.slug === 'string' &&
    !('permission' in first)
  ) {
    return [...(role.permissions as IamPermissionRow[])].sort((a, b) =>
      a.name.localeCompare(b.name, 'fr'),
    );
  }
  return flattenRolePermissions(role as RoleWithPermissions);
}

export function serializeUserRoleForIam<T extends RoleWithPermissions>(role: T | null | undefined) {
  if (!role) return null;
  return {
    ...role,
    permissions: flattenRolePermissions(role),
  };
}
