import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { requireGestionAcademiqueView } from '../../_lib/require-gestion-academique-auth';

/**
 * Liste des enquêtes satisfaction (HOT/COLD + COMPANY/TRAINER/FUNDER) — Suivi formations.
 */
export async function GET(request: NextRequest) {
  const auth = await requireGestionAcademiqueView();
  if (!auth.ok) return auth.response;

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
        recipientName: true,
        scoreAverage: true,
        scoreAlert: true,
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
      items: items.map((row) => {
        const fromParticipant = row.participant?.user
          ? [row.participant.user.firstName, row.participant.user.lastName]
              .filter(Boolean)
              .join(' ')
              .trim() || row.participant.user.email || null
          : null;
        return {
          id: row.id,
          timing: row.timing,
          status: row.status,
          sentAt: row.sentAt?.toISOString() ?? null,
          respondedAt: row.respondedAt?.toISOString() ?? null,
          createdAt: row.createdAt.toISOString(),
          sessionId: row.session.id,
          sessionLabel: row.session.dateDisplayLabel,
          formationName: row.session.formation.name,
          participantName: fromParticipant || row.recipientName || '—',
          scoreAverage: row.scoreAverage,
          scoreAlert: row.scoreAlert,
        };
      }),
    });
  } catch (e) {
    return fail('Lecture enquêtes impossible.', 500, e);
  }
}
