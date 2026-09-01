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
import { resolveFormationSessionLocation } from '@/lib/suivi-formations/session-location';
import { summarizeSlotDocumentsForDay } from '@/lib/suivi-formations/session-slot-documents';
import { loadSuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


type Ctx = { params: Promise<{ sessionId: string; dayId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  const { sessionId, dayId } = await context.params;

  try {
    const detail = await loadDayDetail(dayId);
    if (!detail || detail.day.sessionId !== sessionId) {
      return fail('Jour introuvable.', 404);
    }

    const participantTotal = await countConfirmedParticipants(sessionId);
    const [slots, slotDocuments, sessionContext] = await Promise.all([
      summarizeDaySlots(sessionId, dayId, participantTotal),
      summarizeSlotDocumentsForDay(sessionId, dayId),
      loadSuiviSessionContext(sessionId),
    ]);

    const slotsWithDocuments = slots.map((s) => ({
      ...s,
      documents: slotDocuments[s.slot],
    }));

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
      morning: marksByKey.get(`${p.id}:MORNING`)
        ? {
            status: marksByKey.get(`${p.id}:MORNING`)!.status,
            notes: marksByKey.get(`${p.id}:MORNING`)!.notes,
          }
        : null,
      evening: marksByKey.get(`${p.id}:EVENING`)
        ? {
            status: marksByKey.get(`${p.id}:EVENING`)!.status,
            notes: marksByKey.get(`${p.id}:EVENING`)!.notes,
          }
        : null,
    }));

    const sessionRow = detail.day.session;
    const trainerName =
      sessionRow.trainer?.name?.trim() ||
      sessionRow.trainer?.email ||
      'Formateur référent';
    const locationDisplay = resolveFormationSessionLocation({
      location: sessionRow.location,
      venueRoom: sessionRow.venueRoom,
    });

    return ok({
      id: detail.day.id,
      dayDate: isoDateOnly(detail.day.dayDate),
      journalNotesMorning: detail.day.journalNotesMorning,
      journalNotesEvening: detail.day.journalNotesEvening,
      session: {
        dateDisplayLabel: sessionRow.dateDisplayLabel,
        location: locationDisplay,
        locationDisplay,
        trainerName,
        venueRoom: sessionRow.venueRoom,
        formation: sessionRow.formation,
      },
      sessionContext,
      participantTotal,
      slots: slotsWithDocuments,
      participants,
    });
  } catch (error) {
    return fail('Impossible de charger le détail journal.', 500, error);
  }
}
