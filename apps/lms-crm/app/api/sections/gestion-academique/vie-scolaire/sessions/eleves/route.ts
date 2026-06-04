import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/** Apprenants catalogue : rôles `eleve` ou `candidat` (sessions & affectations). */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const roles = await prisma.userRole.findMany({
      where: { slug: { in: ['eleve', 'candidat'] }, isTrashed: false },
      select: { id: true },
    });
    if (!roles.length) {
      return ok({ items: [] as { id: string; name: string | null; email: string }[] });
    }

    const users = await prisma.user.findMany({
      where: {
        roleId: { in: roles.map((r) => r.id) },
        status: 'ACTIVE',
        isTrashed: false,
      },
      select: { id: true, name: true, email: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      take: 500,
    });

    return ok({ items: users });
  } catch (error) {
    return fail('Impossible de charger les apprenants.', 500, error);
  }
}
