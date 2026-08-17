import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { createWorkflowEngine } from '@repo/api-core';

/** Toggle une permission sur un rôle (depuis la datagrid). */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    const slugs = session.user.permissionSlugs ?? [];
    if (!slugs.includes('iam.roles.edit') && !slugs.includes('crm.securite.edit')) {
      return NextResponse.json({ message: 'Droit insuffisant.' }, { status: 403 });
    }

    const { id: roleId } = await params;
    const body = await request.json();
    const { permissionId, assigned } = body as { permissionId?: string; assigned?: boolean };

    if (!permissionId || typeof assigned !== 'boolean') {
      return NextResponse.json({ message: 'Paramètres invalides.' }, { status: 400 });
    }

    const role = await prisma.userRole.findUnique({ where: { id: roleId } });
    if (!role) {
      return NextResponse.json({ message: 'Rôle introuvable.' }, { status: 404 });
    }

    if (assigned) {
      await prisma.userRolePermission.upsert({
        where: { roleId_permissionId: { roleId, permissionId } },
        create: { roleId, permissionId },
        update: {},
      });
    } else {
      await prisma.userRolePermission.deleteMany({ where: { roleId, permissionId } });
    }

    const permission = await prisma.userPermission.findUnique({
      where: { id: permissionId },
      select: { slug: true },
    });

    try {
      const workflows = createWorkflowEngine(prisma);
      await workflows.emit(
        'crm.security.role.permissions_changed',
        {
          roleId,
          roleName: role.name,
          roleSlug: role.slug,
          permissionId,
          permissionSlug: permission?.slug ?? permissionId,
          assigned,
        },
        { dedupeKey: `iam-role:${roleId}:perm:${permissionId}:${assigned ? 'on' : 'off'}` },
      );
    } catch (e) {
      console.error('[acces/roles/permissions] workflow', e);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ message: 'Erreur matrice IAM.' }, { status: 500 });
  }
}
