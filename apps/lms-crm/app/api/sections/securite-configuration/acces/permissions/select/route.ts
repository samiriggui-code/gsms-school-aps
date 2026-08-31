import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { schoolPermissionPrismaFilter } from '@/lib/iam/school-permissions';
import { IAM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: 'Unauthorized request' }, { status: 401 });
    }

    if (!sessionHasPermission(session, IAM_PERMISSION.permissionsView)) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const permissions = await prisma.userPermission.findMany({
      where: schoolPermissionPrismaFilter(),      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
      },
      orderBy: { slug: 'asc' },
    });

    return NextResponse.json(permissions);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
