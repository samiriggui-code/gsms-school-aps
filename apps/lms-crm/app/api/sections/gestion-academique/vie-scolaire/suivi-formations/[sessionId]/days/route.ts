import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import {
  countConfirmedParticipants,
  isoDateOnly,
  parseIsoDateOnly,
  summarizeDaysBatch,
  syncFormationSessionDays,
} from '@/lib/suivi-formations/session-days';
import { buildDaySlotDocumentCountsMap } from '@/lib/suivi-formations/session-slot-documents';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

type Ctx = { params: Promise<{ sessionId: string }> };

export async function GET(_request: NextRequest, context: Ctx) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { sessionId } = await context.params;

  try {
    const formationSession = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      select: { id: true, startDate: true, endDate: true },
    });
    if (!formationSession) return fail('Session introuvable.', 404);

    const participantTotal = await countConfirmedParticipants(sessionId);

    const days = await prisma.formationSessionDay.findMany({
      where: { sessionId },
      orderBy: { dayDate: 'asc' },
      select: {
        id: true,
        dayDate: true,
        journalNotesMorning: true,
        journalNotesEvening: true,
      },
    });

    const dayIds = days.map((d) => d.id);
    const [slotsByDay, docCountsByDay] = await Promise.all([
      summarizeDaysBatch(sessionId, dayIds, participantTotal),
      buildDaySlotDocumentCountsMap(sessionId, dayIds),
    ]);

    const items = days.map((day) => {
      const slots = slotsByDay.get(day.id) ?? [];
      const morning = slots.find((s) => s.slot === 'MORNING')!;
      const evening = slots.find((s) => s.slot === 'EVENING')!;
      const docCounts = docCountsByDay.get(day.id);
      const morningDocs = docCounts?.MORNING;
      const eveningDocs = docCounts?.EVENING;
      return {
          id: day.id,
          dayDate: isoDateOnly(day.dayDate),
          journalNotesMorning: day.journalNotesMorning,
          journalNotesEvening: day.journalNotesEvening,
          participantTotal,
          morningPresent: morning.presentCount,
          eveningPresent: evening.presentCount,
          morningComplete: morning.complete,
          eveningComplete: evening.complete,
          morningPdfAssetId: morning.pdfAssetId,
          eveningPdfAssetId: evening.pdfAssetId,
          morningScanCount: morningDocs?.scanCount ?? 0,
          eveningScanCount: eveningDocs?.scanCount ?? 0,
          morningArchivedTemplates: morningDocs?.archivedTemplates ?? 0,
          eveningArchivedTemplates: eveningDocs?.archivedTemplates ?? 0,
        };
      });

    return ok({
      items,
      session: {
        id: formationSession.id,
        startDate: formationSession.startDate?.toISOString() ?? null,
        endDate: formationSession.endDate?.toISOString() ?? null,
      },
    });
  } catch (error) {
    return fail('Impossible de charger le journal.', 500, error);
  }
}

/** Synchronise les jours depuis startDate/endDate ou ajoute un jour manuel `{ dayDate: "YYYY-MM-DD" }`. */
export async function POST(request: NextRequest, context: Ctx) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  const { sessionId } = await context.params;

  let body: { dayDate?: string; action?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    body = {};
  }

  try {
    const formationSession = await prisma.formationSession.findUnique({
      where: { id: sessionId },
      select: { id: true },
    });
    if (!formationSession) return fail('Session introuvable.', 404);

    if (body.action === 'sync-range' || !body.dayDate) {
      const created = await syncFormationSessionDays(sessionId);
      return ok({ created, action: 'sync-range' });
    }

    const dayDate = parseIsoDateOnly(body.dayDate);
    const row = await prisma.formationSessionDay.upsert({
      where: { sessionId_dayDate: { sessionId, dayDate } },
      create: { sessionId, dayDate },
      update: {},
      select: { id: true, dayDate: true },
    });

    return ok({ id: row.id, dayDate: isoDateOnly(row.dayDate), created: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_DATE') {
      return fail('Date invalide (format YYYY-MM-DD attendu).', 422);
    }
    return fail('Impossible de mettre à jour le journal.', 500, error);
  }
}
