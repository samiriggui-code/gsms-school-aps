import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome, Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/** Inscrits session avec examen réussi — éligibles à une attestation parcours. */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const q = (request.nextUrl.searchParams.get('q') || '').trim();
  const sessionId = (request.nextUrl.searchParams.get('sessionId') || '').trim();
  const limit = Math.min(50, Math.max(1, Number(request.nextUrl.searchParams.get('limit') || 30)));

  const where: Prisma.FormationSessionParticipantWhereInput = {
    candidatureId: { not: null },
    examOutcome: FormationExamOutcome.PASSED,
    ...(sessionId ? { sessionId } : {}),
    ...(q
      ? {
          user: {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const rows = await prisma.formationSessionParticipant.findMany({
    where,
    orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: {
      user: { select: { id: true, name: true, email: true } },
      candidature: {
        select: {
          id: true,
          status: true,
          formationId: true,
          formation: { select: { id: true, name: true } },
          _count: { select: { attestations: true } },
        },
      },
      session: {
        select: {
          id: true,
          dateDisplayLabel: true,
          formation: { select: { id: true, name: true } },
        },
      },
    },
  });

  return ok({
    items: rows
      .filter((row) => row.candidature?.formationId)
      .map((row) => {
        const formationName =
          row.candidature?.formation?.name ?? row.session.formation?.name ?? 'Formation';
        const sessionLabel = row.session.dateDisplayLabel;
        return {
          participantId: row.id,
          candidatureId: row.candidature!.id,
          sessionId: row.session.id,
          userId: row.user.id,
          userName: row.user.name,
          userEmail: row.user.email,
          formationName,
          sessionLabel,
          candidatureStatus: row.candidature!.status,
          attestationCount: row.candidature!._count.attestations,
          suggestedTitle: `Attestation ${formationName} — ${sessionLabel}`,
          hasAttestation: row.candidature!._count.attestations > 0,
        };
      }),
  });
}
