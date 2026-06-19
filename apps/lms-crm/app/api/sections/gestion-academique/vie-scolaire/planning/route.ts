import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

function parseDateParam(value: string | null, fallback: Date): Date {
  if (!value) return fallback;
  const d = new Date(value.length <= 10 ? `${value}T12:00:00.000Z` : value);
  return Number.isNaN(d.getTime()) ? fallback : d;
}

/** Planning pédagogique : sessions catalogue sur une période (semaine scolaire). */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const url = new URL(request.url);
  const now = new Date();
  const from = parseDateParam(url.searchParams.get('from'), now);
  const to = parseDateParam(
    url.searchParams.get('to'),
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 42),
  );

  try {
    const sessions = await prisma.formationSession.findMany({
      where: {
        startDate: { not: null, lte: to },
        endDate: { not: null, gte: from },
      },
      orderBy: [{ startDate: 'asc' }, { formation: { name: 'asc' } }],
      include: {
        formation: { select: { id: true, name: true, slug: true } },
        trainer: { select: { id: true, firstName: true, lastName: true, name: true } },
        venueRoom: { select: { id: true, name: true, shortCode: true } },
        _count: { select: { participants: true } },
      },
    });

    const items = sessions.map((s) => ({
      id: s.id,
      dateDisplayLabel: s.dateDisplayLabel,
      sessionKind: s.sessionKind,
      sessionSubtitle: s.sessionSubtitle,
      location: s.location,
      startDate: s.startDate?.toISOString() ?? null,
      endDate: s.endDate?.toISOString() ?? null,
      formation: s.formation,
      formationName: s.formation?.name ?? null,
      trainerUserId: s.trainerUserId,
      trainerName:
        [s.trainer?.firstName, s.trainer?.lastName].filter(Boolean).join(' ') ||
        s.trainer?.name ||
        null,
      venueRoomId: s.venueRoomId,
      venueRoomName: s.venueRoom?.name ?? null,
      venueRoomCode: s.venueRoom?.shortCode ?? null,
      participantsCount: s._count.participants,
    }));

    const participantsTotal = items.reduce((sum, row) => sum + row.participantsCount, 0);

    return ok({
      from: from.toISOString(),
      to: to.toISOString(),
      items,
      summary: {
        sessionCount: items.length,
        participantsTotal,
        withoutTrainer: items.filter((r) => !r.trainerUserId).length,
        withoutRoom: items.filter((r) => !r.venueRoomId).length,
      },
    });
  } catch (error) {
    return fail('Impossible de charger le planning pédagogique.', 500, error);
  }
}
