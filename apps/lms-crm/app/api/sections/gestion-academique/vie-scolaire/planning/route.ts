import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from');
  const to = searchParams.get('to');

  const start = from ? new Date(from) : new Date();
  if (!from) start.setHours(0, 0, 0, 0);

  const end = to ? new Date(to) : new Date(start);
  if (!to) end.setDate(end.getDate() + 42);

  const sessions = await prisma.formationSession.findMany({
    where: {
      OR: [
        { startDate: { gte: start, lte: end } },
        { endDate: { gte: start, lte: end } },
      ],
    },
    orderBy: { startDate: 'asc' },
    include: {
      formation: { select: { id: true, name: true, slug: true } },
      _count: { select: { participants: true } },
    },
  });

  return ok({
    range: { from: start.toISOString(), to: end.toISOString() },
    items: sessions.map((s) => ({
      id: s.id,
      dateDisplayLabel: s.dateDisplayLabel,
      startDate: s.startDate?.toISOString() ?? null,
      endDate: s.endDate?.toISOString() ?? null,
      formation: s.formation,
      participantsCount: s._count.participants,
    })),
  });
}
