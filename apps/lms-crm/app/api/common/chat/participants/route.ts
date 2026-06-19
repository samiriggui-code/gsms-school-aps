import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { displayUserName } from '@/app/api/_shared/topbar-auth';
import { prisma } from '@/lib/prisma';
import { CHAT_ELIGIBLE_ROLE_SLUGS } from '@/lib/chat-eligible';
import { isCrmRole, isInstructorRole } from '@/lib/auth/app-routing';

/** Utilisateurs invitables dans une discussion (staff CRM / formateurs actifs). */
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return fail('Unauthorized request', 401);

  const roleSlug = session.user?.roleSlug ?? '';
  if (!isCrmRole(roleSlug) && !isInstructorRole(roleSlug)) {
    return fail('Accès chat non autorisé pour ce profil.', 403);
  }

  const users = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      id: { not: userId },
      role: { slug: { in: [...CHAT_ELIGIBLE_ROLE_SLUGS] } },
    },
    orderBy: [{ name: 'asc' }, { email: 'asc' }],
    take: 50,
    select: {
      id: true,
      name: true,
      firstName: true,
      lastName: true,
      email: true,
      avatar: true,
    },
  });

  return ok(
    users.map((u) => ({
      id: u.id,
      name: displayUserName(u),
      email: u.email,
      avatar: u.avatar,
    })),
  );
}
