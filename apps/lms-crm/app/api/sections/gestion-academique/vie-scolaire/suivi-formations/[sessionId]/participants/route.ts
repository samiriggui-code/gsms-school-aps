import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  computeProgressForUsers,
  loadSessionCourseBundle,
} from '@/lib/suivi-formations/session-progress';
import { resolveParticipantFunding } from '@/lib/suivi-formations/resolve-participant-funding';

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId } = await context.params;
  const page = Math.max(1, Number(request.nextUrl.searchParams.get('page') ?? '1') || 1);
  const limit = Math.min(100, Math.max(1, Number(request.nextUrl.searchParams.get('limit') ?? '10') || 10));
  const query = request.nextUrl.searchParams.get('query')?.trim() ?? '';

  try {
    const formationSession = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!formationSession) return fail('Session introuvable.', 404);

    const where = {
      sessionId,
      ...(query
        ? {
            OR: [
              { user: { name: { contains: query, mode: 'insensitive' as const } } },
              { user: { email: { contains: query, mode: 'insensitive' as const } } },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      prisma.formationSessionParticipant.count({ where }),
      prisma.formationSessionParticipant.findMany({
        where,
        orderBy: [{ user: { name: 'asc' } }, { createdAt: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          userId: true,
          enrollmentStatus: true,
          examOutcome: true,
          candidatureId: true,
          fundingMode: true,
          fundingReference: true,
          fundingNotes: true,
          user: {
            select: {
              name: true,
              email: true,
              phone: true,
              avatar: true,
            },
          },
          candidature: {
            select: { notes: true, metadata: true },
          },
        },
      }),
    ]);

    const userIds = rows.map((r) => r.userId);
    const { bundle } = await loadSessionCourseBundle(sessionId);
    const progressMap = await computeProgressForUsers(userIds, bundle);

    const items = rows.map((row) => {
      const prog = progressMap.get(row.userId) ?? {
        progressPercent: 0,
        completedChapters: 0,
        totalChapters: bundle?.chapterIds.length ?? 0,
        quizPassed: 0,
        quizTotal: bundle?.quizActivityIds.length ?? 0,
        lastActivityAt: null,
      };

      const funding = resolveParticipantFunding(row);

      return {
        participantId: row.id,
        userId: row.userId,
        candidatureId: row.candidatureId,
        name: row.user.name,
        email: row.user.email,
        phone: row.user.phone,
        avatar: row.user.avatar,
        enrollmentStatus: row.enrollmentStatus,
        examOutcome: row.examOutcome,
        fundingMode: funding.fundingMode,
        fundingReference: funding.fundingReference,
        fundingNotes: funding.fundingNotes,
        fundingModeLabel: funding.fundingModeLabel,
        fundingSource: funding.source,
        progressPercent: prog.progressPercent,
        completedChapters: prog.completedChapters,
        totalChapters: prog.totalChapters,
        quizPassed: prog.quizPassed,
        quizTotal: prog.quizTotal,
        lastActivityAt: prog.lastActivityAt?.toISOString() ?? null,
      };
    });

    return ok({
      items,
      pagination: { total, page, limit },
    });
  } catch (error) {
    return fail('Impossible de charger les stagiaires.', 500, error);
  }
}
