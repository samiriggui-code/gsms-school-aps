import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(_request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const [pendingExams, passedExams, attestations, completed] = await Promise.all([
    prisma.formationSessionParticipant.count({
      where: { candidatureId: { not: null }, examOutcome: FormationExamOutcome.PENDING },
    }),
    prisma.formationSessionParticipant.count({
      where: { candidatureId: { not: null }, examOutcome: FormationExamOutcome.PASSED },
    }),
    prisma.formationAttestation.count(),
    prisma.candidature.count({ where: { status: 'COMPLETED' } }),
  ]);

  return ok({ pendingExams, passedExams, attestations, completed });
}
