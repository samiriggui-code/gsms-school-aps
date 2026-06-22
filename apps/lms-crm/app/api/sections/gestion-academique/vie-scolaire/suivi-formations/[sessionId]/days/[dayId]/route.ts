import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { loadDayDetail } from '@/lib/suivi-formations/session-emargement-service';
import {
  countConfirmedParticipants,
  isoDateOnly,
  summarizeDaySlots,
} from '@/lib/suivi-formations/session-days';

type Ctx = { params: Promise<{ sessionId: string; dayId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId, dayId } = await context.params;

  try {
    const detail = await loadDayDetail(dayId);
    if (!detail || detail.day.sessionId !== sessionId) {
      return fail('Jour introuvable.', 404);
    }

    const participantTotal = await countConfirmedParticipants(sessionId);
    const slots = await summarizeDaySlots(sessionId, dayId, participantTotal);

    const marksByKey = new Map<string, (typeof detail.marks)[number]>();
    for (const mark of detail.marks) {
      marksByKey.set(`${mark.participantId}:${mark.slot}`, mark);
    }

    const participants = detail.participants.map((p) => ({
      participantId: p.id,
      userId: p.userId,
      name:
        p.user.name?.trim() ||
        [p.user.firstName, p.user.lastName].filter(Boolean).join(' ') ||
        p.user.email,
      email: p.user.email,
      avatar: p.user.avatar,
      morning: marksByKey.get(`${p.id}:MORNING`) ?? null,
      evening: marksByKey.get(`${p.id}:EVENING`) ?? null,
    }));

    return ok({
      id: detail.day.id,
      dayDate: isoDateOnly(detail.day.dayDate),
      journalNotesMorning: detail.day.journalNotesMorning,
      journalNotesEvening: detail.day.journalNotesEvening,
      session: detail.day.session,
      participantTotal,
      slots,
      participants,
    });
  } catch (error) {
    return fail('Impossible de charger le détail journal.', 500, error);
  }
}
