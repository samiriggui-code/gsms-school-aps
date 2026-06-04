import { getServerSession } from 'next-auth/next';
import { CandidatureStatus, Prisma } from '@repo/database';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const baseWhere: Prisma.UserWhereInput = {
    isTrashed: false,
    role: { slug: { in: ['candidat', 'eleve'] }, isTrashed: false },
  };
  const terminal = [
    CandidatureStatus.VALIDATED,
    CandidatureStatus.COMPLETED,
    CandidatureStatus.ARCHIVED,
    CandidatureStatus.REJECTED,
  ];

  const [total, avecSession, dossierValide, dossierEnAttente, sansDossier] = await Promise.all([
    prisma.user.count({ where: baseWhere }),
    prisma.user.count({
      where: { ...baseWhere, formationSessionParticipants: { some: {} } },
    }),
    prisma.user.count({
      where: { ...baseWhere, candidatures: { some: { status: CandidatureStatus.VALIDATED } } },
    }),
    prisma.user.count({
      where: {
        ...baseWhere,
        candidatures: { some: { status: { notIn: terminal } } },
      },
    }),
    prisma.user.count({
      where: { ...baseWhere, candidatures: { none: {} } },
    }),
  ]);

  return ok({
    total,
    avecSession,
    dossierValide,
    dossierEnAttente,
    sansDossier,
  });
}
