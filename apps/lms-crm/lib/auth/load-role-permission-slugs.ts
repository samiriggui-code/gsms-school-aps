import { prisma } from '@/lib/prisma';

/** Charge les slugs de permissions d'un rôle (JWT / session). */
export async function loadRolePermissionSlugs(roleId: string): Promise<string[]> {
  const rows = await prisma.userRolePermission.findMany({
    where: { roleId },
    select: { permission: { select: { slug: true } } },
  });
  return rows.map((row) => row.permission.slug);
}
