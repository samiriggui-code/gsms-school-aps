import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { isAccountAccessAllowed } from '@/lib/auth/account-access';
import { isPortalRole } from '@/lib/auth/app-routing';
import {
  buildLearnerAccess,
  getLmsAccessTier,
  resolveSessionStartsAt,
  type LmsAccessTier,
  type LmsLearnerAccess,
} from '@/lib/portal/lms-access';
import { prisma } from '@/lib/prisma';

export type PortalLearnerContext = {
  userId: string;
  roleSlug: string | null;
  tier: LmsAccessTier;
  access: LmsLearnerAccess;
  sessionStartsAt: Date | null;
  candidature: {
    status: string;
    formationId: string | null;
    formation: {
      id: string;
      slug: string;
      name: string;
      courseId: string | null;
    } | null;
    interestedSession: { id: string; startDate: Date | null } | null;
  } | null;
};

export async function getPortalLearnerContext(): Promise<
  { ok: true; ctx: PortalLearnerContext } | { ok: false; message: string; status: number }
> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, message: 'Unauthorized request', status: 401 };
  }

  const roleSlug = session.user.roleSlug ?? null;
  if (!isPortalRole(roleSlug)) {
    return { ok: false, message: 'Espace réservé aux candidats et stagiaires.', status: 403 };
  }

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, status: true, isTrashed: true },
  });
  if (!account || !isAccountAccessAllowed(account)) {
    return {
      ok: false,
      message: 'Compte désactivé ou archivé.',
      status: 403,
    };
  }

  const userId = session.user.id;

  const [candidature, enrolledSession] = await Promise.all([
    prisma.candidature.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        status: true,
        formationId: true,
        formation: {
          select: { id: true, slug: true, name: true, courseId: true },
        },
        interestedSession: {
          select: { id: true, startDate: true },
        },
      },
    }),
    prisma.formationSessionParticipant.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { session: { select: { startDate: true } } },
    }),
  ]);

  const tier = getLmsAccessTier(candidature?.status as never);
  const sessionStartsAt = resolveSessionStartsAt(
    candidature?.interestedSession?.startDate,
    [enrolledSession?.session?.startDate],
  );
  const access = buildLearnerAccess(tier, sessionStartsAt);

  return {
    ok: true,
    ctx: {
      userId,
      roleSlug,
      tier,
      access,
      sessionStartsAt,
      candidature,
    },
  };
}
