import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { isAccountAccessAllowed } from '@/lib/auth/account-access';
import { isInstructorRole } from '@/lib/auth/app-routing';
import { prisma } from '@/lib/prisma';

export type InstructorContext = {
  userId: string;
  roleSlug: string;
  user: {
    name: string | null;
    email: string;
    avatar: string | null;
    jobFunction: string | null;
  };
};

export async function getInstructorContext(): Promise<
  { ok: true; ctx: InstructorContext } | { ok: false; message: string; status: number }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, message: 'Unauthorized request', status: 401 };
  }

  const roleSlug = session.user.roleSlug ?? null;
  if (!isInstructorRole(roleSlug)) {
    return { ok: false, message: 'Espace réservé aux formateurs.', status: 403 };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      jobFunction: true,
      status: true,
      isTrashed: true,
    },
  });

  if (!user) {
    return { ok: false, message: 'Utilisateur introuvable.', status: 404 };
  }

  if (!isAccountAccessAllowed(user)) {
    return { ok: false, message: 'Compte formateur suspendu ou archivé.', status: 403 };
  }

  return {
    ok: true,
    ctx: {
      userId: user.id,
      roleSlug,
      user: {
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        jobFunction: user.jobFunction,
      },
    },
  };
}
