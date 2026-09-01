import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { FormationExamOutcome, Prisma } from '@repo/database';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') || 20)));
  const outcome = searchParams.get('outcome');
  const sessionId = (searchParams.get('sessionId') || '').trim();
  const q = (searchParams.get('q') || '').trim();

  const where: Prisma.FormationSessionParticipantWhereInput = {
    candidatureId: { not: null },
    ...(sessionId ? { sessionId } : {}),
    ...(outcome && (Object.values(FormationExamOutcome) as string[]).includes(outcome)
      ? { examOutcome: outcome as FormationExamOutcome }
      : {}),
    ...(q
      ? {
          user: {
            OR: [
              { email: { contains: q, mode: 'insensitive' } },
              { firstName: { contains: q, mode: 'insensitive' } },
              { lastName: { contains: q, mode: 'insensitive' } },
              { name: { contains: q, mode: 'insensitive' } },
            ],
          },
        }
      : {}),
  };

  const [total, items] = await Promise.all([
    prisma.formationSessionParticipant.count({ where }),
    prisma.formationSessionParticipant.findMany({
      where,
      orderBy: [{ examDate: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, firstName: true, lastName: true, email: true },
        },
        candidature: {
          select: { id: true, status: true, formationId: true },
        },
        session: {
          select: {
            id: true,
            dateDisplayLabel: true,
            startDate: true,
            formation: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  return ok({
    items: items.map((row) => ({
      id: row.id,
      examOutcome: row.examOutcome,
      examDate: row.examDate?.toISOString() ?? null,
      certifiedAt: row.certifiedAt?.toISOString() ?? null,
      trainingCompletedAt: row.trainingCompletedAt?.toISOString() ?? null,
      enrollmentStatus: row.enrollmentStatus,
      user: row.user,
      candidature: row.candidature,
      session: row.session,
    })),
    pagination: { page, limit, total },
  });
}
