import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

/**
 * Liste des enquêtes satisfaction (HOT/COLD) — hub OF-08 Docs & circuits.
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status')?.trim() || '';
  const take = Math.min(Math.max(Number(searchParams.get('take') ?? 50) || 50, 1), 100);

  try {
    const items = await prisma.satisfactionSurvey.findMany({
      where: status ? { status: status as 'PENDING' | 'SENT' | 'COMPLETED' | 'EXPIRED' } : undefined,
      orderBy: { createdAt: 'desc' },
      take,
      select: {
        id: true,
        timing: true,
        status: true,
        sentAt: true,
        respondedAt: true,
        createdAt: true,
        session: {
          select: {
            id: true,
            dateDisplayLabel: true,
            formation: { select: { name: true } },
          },
        },
        participant: {
          select: {
            id: true,
            user: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    return ok({
      items: items.map((row) => ({
        id: row.id,
        timing: row.timing,
        status: row.status,
        sentAt: row.sentAt?.toISOString() ?? null,
        respondedAt: row.respondedAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        sessionId: row.session.id,
        sessionLabel: row.session.dateDisplayLabel,
        formationName: row.session.formation.name,
        participantName: [row.participant.user?.firstName, row.participant.user?.lastName]
          .filter(Boolean)
          .join(' ')
          .trim() || row.participant.user?.email || '—',
      })),
    });
  } catch (e) {
    return fail('Lecture enquêtes impossible.', 500, e);
  }
}
