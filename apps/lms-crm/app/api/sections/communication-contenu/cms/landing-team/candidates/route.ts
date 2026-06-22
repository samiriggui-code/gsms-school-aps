import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { landingTeamUserSelect } from '../_user-select';

/** Candidats éligibles : formateurs ou collaborateurs pas encore dans le catalogue landing. */
export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const existing = await prisma.landingTeamOffer.findMany({ select: { userId: true } });
    const excludeIds = existing.map((r) => r.userId);

    const users = await prisma.user.findMany({
      where: {
        isTrashed: false,
        id: excludeIds.length ? { notIn: excludeIds } : undefined,
        OR: [{ formateurProfile: { isNot: null } }, { collaborateurProfile: { isNot: null } }],
      },
      orderBy: [{ name: 'asc' }, { email: 'asc' }],
      take: 200,
      select: {
        ...landingTeamUserSelect,
        email: true,
      },
    });

    return ok({
      items: users.map((u) => ({
        id: u.id,
        name:
          u.name?.trim() ||
          [u.firstName, u.lastName].filter(Boolean).join(' ').trim() ||
          u.email,
        email: u.email,
        avatar: u.avatar,
        hasFormateur: Boolean(u.formateurProfile),
        hasCollaborateur: Boolean(u.collaborateurProfile),
      })),
    });
  } catch (error) {
    return fail('Impossible de charger les candidats.', 500, error);
  }
}
