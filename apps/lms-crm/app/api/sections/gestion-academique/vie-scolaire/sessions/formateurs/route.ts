import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


/** Formateurs éligibles pour animer une session (rôle `formateur`). */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  try {
    const role = await prisma.userRole.findFirst({
      where: { slug: 'formateur', isTrashed: false },
    });
    if (!role) {
      return ok({ items: [] as { id: string; name: string | null; email: string; avatar: string | null }[] });
    }

    const users = await prisma.user.findMany({
      where: {
        roleId: role.id,
        status: 'ACTIVE',
        isTrashed: false,
      },
      select: { id: true, name: true, email: true, avatar: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      take: 500,
    });

    return ok({ items: users });
  } catch (error) {
    return fail('Impossible de charger les formateurs.', 500, error);
  }
}
