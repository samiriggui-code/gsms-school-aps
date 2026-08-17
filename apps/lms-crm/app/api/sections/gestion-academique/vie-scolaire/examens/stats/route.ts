import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome, Prisma } from '@repo/database';
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

  const [pendingExams, passedExams, failedOrAbsent, attestations, completed] = await Promise.all([
    prisma.formationSessionParticipant.count({
      where: { ...participantBase, examOutcome: FormationExamOutcome.PENDING },
    }),
    prisma.formationSessionParticipant.count({
      where: { ...participantBase, examOutcome: FormationExamOutcome.PASSED },
    }),
    prisma.formationSessionParticipant.count({
      where: {
        ...participantBase,
        examOutcome: { in: [FormationExamOutcome.FAILED, FormationExamOutcome.ABSENT] },
      },
    }),
    prisma.formationAttestation.count({
      where: sessionId ? { sessionId } : {},
    }),
    prisma.candidature.count({
      where: {
        status: 'COMPLETED',
        ...(sessionId
          ? { sessionEnrollments: { some: { sessionId } } }
          : {}),
      },
    }),
  ]);

  return ok({ pendingExams, passedExams, failedOrAbsent, attestations, completed });
}
