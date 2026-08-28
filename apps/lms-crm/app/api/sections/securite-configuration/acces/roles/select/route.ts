import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { SCHOOL_IAM_ROLE_SLUGS } from '@/lib/rh-iam-roles';
import {
  CRM_PERMISSION,
  IAM_PERMISSION,
  sessionHasAnyPermission,
} from '@/lib/auth/crm-permissions';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    if (
      !sessionHasAnyPermission(session, [
        IAM_PERMISSION.rolesView,
        IAM_PERMISSION.usersView,
        CRM_PERMISSION.ressourcesView,
      ])
    ) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const scope = new URL(request.url).searchParams.get('scope');
    const schoolOnly = scope === 'school' || scope === 'rh';

    const roles = await prisma.userRole.findMany({
      where: {
        isTrashed: false,
        ...(schoolOnly ? { slug: { in: [...SCHOOL_IAM_ROLE_SLUGS] } } : {}),
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(roles);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
