import type { PermissionPrincipal } from '@repo/doctype';
import { isSuperAdminRole } from '@/lib/auth/crm-permissions';
import { prisma } from '@/lib/prisma';

export async function principalFromUserId(userId: string): Promise<PermissionPrincipal | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: {
        select: {
          slug: true,
          permissions: { select: { permission: { select: { slug: true } } } },
        },
      },
    },
  });
  if (!user) return null;

  const roleSlug = user.role?.slug ?? null;
  const permissionSlugs = new Set(
    user.role?.permissions.map((row) => row.permission.slug) ?? [],
  );

  return {
    id: user.id,
    roleSlug,
    permissionSlugs,
    isSystemManager: isSuperAdminRole(roleSlug),
  };
}
