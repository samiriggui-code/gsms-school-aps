import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import {
  CRM_PERMISSION,
  IAM_PERMISSION,
  sessionHasAnyPermission,
} from '@/lib/auth/crm-permissions';

/**
 * Dropdown utilisateurs (RH / académique / IAM).
 * Fail-closed : session + au moins une permission métier liée aux consommateurs.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get('query') || '';

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { message: 'Unauthorized request' },
        { status: 401 },
      );
    }

    // IAM (skill §2) + ressources/académique car 8 dropdowns RH/vie scolaire consomment cette route.
    if (
      !sessionHasAnyPermission(session, [
        IAM_PERMISSION.usersView,
        CRM_PERMISSION.ressourcesView,
        CRM_PERMISSION.academiqueView,
      ])
    ) {
      return NextResponse.json(
        { message: 'Accès refusé — permission requise.' },
        { status: 403 },
      );
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        status: true,
        userCategory: true,
        city: true,
        createdAt: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json(users);
  } catch {
    return NextResponse.json(
      { message: 'Oops! Something went wrong. Please try again in a moment.' },
      { status: 500 },
    );
  }
}
