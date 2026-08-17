import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { CandidatureStatus, FormationExamOutcome, Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const sessionId = (request.nextUrl.searchParams.get('sessionId') || '').trim();

  const participantBase: Prisma.FormationSessionParticipantWhereInput = {
    candidatureId: { not: null },
    ...(sessionId ? { sessionId } : {}),
  };

  const [totalAttestations, passedWithoutAttestation, readyToClose, validated, completed] =
    await Promise.all([
    prisma.formationAttestation.count({
      where: sessionId ? { sessionId } : {},
    }),
    prisma.formationSessionParticipant.count({
      where: {
        ...participantBase,
        examOutcome: FormationExamOutcome.PASSED,
        candidature: {
          attestations: { none: {} },
        },
      },
    }),
    prisma.candidature.count({
      where: {
        status: CandidatureStatus.VALIDATED,
        attestations: { some: {} },
        sessionEnrollments: {
          some: {
            examOutcome: FormationExamOutcome.PASSED,
            ...(sessionId ? { sessionId } : {}),
          },
        },
      },
    }),
    prisma.candidature.count({
      where: {
        status: CandidatureStatus.VALIDATED,
        ...(sessionId
          ? { sessionEnrollments: { some: { sessionId } } }
          : {}),
      },
    }),
    prisma.candidature.count({
      where: {
        status: CandidatureStatus.COMPLETED,
        ...(sessionId
          ? { sessionEnrollments: { some: { sessionId } } }
          : {}),
      },
    }),
  ]);

  return ok({
    totalAttestations,
    passedWithoutAttestation,
    readyToClose,
    validated,
    completed,
  });
}
