import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

/** Assigne ou retire une permission sur un rôle (toggle matrice IAM). */
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
      return NextResponse.json(
        { message: 'Droit insuffisant pour modifier la matrice IAM.' },
        { status: 403 },
      );
    }

    const { id: permissionId } = await params;
    const body = await request.json();
    const { roleId, assigned } = body as { roleId?: string; assigned?: boolean };

    if (!roleId || typeof assigned !== 'boolean') {
      return NextResponse.json({ message: 'Paramètres invalides.' }, { status: 400 });
    }

    const [permission, role] = await Promise.all([
      prisma.userPermission.findUnique({ where: { id: permissionId } }),
      prisma.userRole.findUnique({ where: { id: roleId } }),
    ]);

    if (!permission || !role) {
      return NextResponse.json({ message: 'Permission ou rôle introuvable.' }, { status: 404 });
    }

    if (assigned) {
      await prisma.userRolePermission.upsert({
        where: {
          roleId_permissionId: { roleId, permissionId },
        },
        create: { roleId, permissionId },
        update: {},
      });
    } else {
      await prisma.userRolePermission.deleteMany({
        where: { roleId, permissionId },
      });
    }

    return NextResponse.json({ success: true, roleId, permissionId, assigned });
  } catch {
    return NextResponse.json(
      { message: 'Erreur lors de la mise à jour de la matrice.' },
      { status: 500 },
    );
  }
}
