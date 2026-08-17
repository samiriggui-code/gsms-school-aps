import { prisma } from '@/lib/prisma';
import type { FormationSessionDaySlot, FormationSessionEmargementStatus } from '@repo/database';

export type SuiviDaySlot = FormationSessionDaySlot;
export type SuiviEmargementStatus = FormationSessionEmargementStatus;

export const SUIVI_DAY_SLOTS: SuiviDaySlot[] = ['MORNING', 'EVENING'];

export function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

export function isoDateOnly(date: Date): string {
  return startOfUtcDay(date).toISOString().slice(0, 10);
}

export function parseIsoDateOnly(value: string): Date {
  const d = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) throw new Error('INVALID_DATE');
  return d;
}

export function eachCalendarDayInclusive(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  let cursor = startOfUtcDay(start);
  const last = startOfUtcDay(end);
  while (cursor.getTime() <= last.getTime()) {
    days.push(new Date(cursor));
    cursor = new Date(cursor.getTime() + 86_400_000);
  }
  return days;
}

export async function syncFormationSessionDays(sessionId: string): Promise<number> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { startDate: true, endDate: true },
  });
  if (!session?.startDate) return 0;

  const end = session.endDate ?? session.startDate;
  const dayDates = eachCalendarDayInclusive(session.startDate, end);

  const existing = await prisma.formationSessionDay.findMany({
    where: { sessionId },
    select: { dayDate: true },
  });
  const existingKeys = new Set(existing.map((r) => isoDateOnly(r.dayDate)));
  const toCreate = dayDates.filter((d) => !existingKeys.has(isoDateOnly(d)));

  if (toCreate.length > 0) {
    await prisma.formationSessionDay.createMany({
      data: toCreate.map((dayDate) => ({ sessionId, dayDate })),
    });
  }

  return toCreate.length;
}

export async function ensureTodaySessionDay(sessionId: string): Promise<string | null> {
  const today = startOfUtcDay(new Date());
  const row = await prisma.formationSessionDay.upsert({
    where: { sessionId_dayDate: { sessionId, dayDate: today } },
    create: { sessionId, dayDate: today },
    update: {},
    select: { id: true },
  });
  return row.id;
}

export async function countConfirmedParticipants(sessionId: string): Promise<number> {
  return prisma.formationSessionParticipant.count({
    where: { sessionId, enrollmentStatus: 'CONFIRMED' },
  });
}

export async function loadDayParticipantIds(sessionId: string): Promise<string[]> {
  const rows = await prisma.formationSessionParticipant.findMany({
    where: { sessionId, enrollmentStatus: 'CONFIRMED' },
    select: { id: true },
    orderBy: { user: { name: 'asc' } },
  });
  return rows.map((r) => r.id);
}

export type DaySlotSummary = {
  slot: SuiviDaySlot;
  presentCount: number;
  markedCount: number;
  participantTotal: number;
  complete: boolean;
  pdfAssetId: string | null;
};

type AttendanceRow = { dayId: string; slot: SuiviDaySlot; status: string; participantId: string };
type PdfAssetRow = { id: string; category: string | null; metadata: unknown };

function buildSlotSummariesForDay(
  dayId: string,
  participantTotal: number,
  attendances: AttendanceRow[],
  pdfRows: PdfAssetRow[],
): DaySlotSummary[] {
  const slotRows = attendances.filter((a) => a.dayId === dayId);

  const pdfBySlot: Record<SuiviDaySlot, string | null> = {
    MORNING: null,
    EVENING: null,
  };

  for (const asset of pdfRows) {
    const meta =
      asset.metadata && typeof asset.metadata === 'object' && !Array.isArray(asset.metadata)
        ? (asset.metadata as Record<string, unknown>)
        : {};
    if (meta.dayId !== dayId) continue;
    if (!asset.category) continue;
    if (asset.category === 'emargement-pdf-morning') pdfBySlot.MORNING = asset.id;
    if (asset.category === 'emargement-pdf-evening') pdfBySlot.EVENING = asset.id;
  }

  return SUIVI_DAY_SLOTS.map((slot) => {
    const rowsForSlot = slotRows.filter((a) => a.slot === slot);
    const markedCount = rowsForSlot.length;
    const presentCount = rowsForSlot.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
    const complete = participantTotal > 0 && markedCount >= participantTotal;
    return {
      slot,
      presentCount,
      markedCount,
      participantTotal,
      complete,
      pdfAssetId: pdfBySlot[slot],
    };
  });
}

/** Une requête présences + une requête PDF pour tout le journal (évite N+1). */
export async function summarizeDaysBatch(
  sessionId: string,
  dayIds: string[],
  participantTotal: number,
): Promise<Map<string, DaySlotSummary[]>> {
  const result = new Map<string, DaySlotSummary[]>();
  if (dayIds.length === 0) return result;

  const [attendances, pdfRows] = await Promise.all([
    prisma.formationSessionEmargement.findMany({
      where: { dayId: { in: dayIds } },
      select: { dayId: true, slot: true, status: true, participantId: true },
    }),
    prisma.fileAsset.findMany({
      where: {
        module: 'gestion-academique',
        entityType: 'formation_session',
        entityId: sessionId,
        status: 'ACTIVE',
        category: { in: ['emargement-pdf-morning', 'emargement-pdf-evening'] },
      },
      select: { id: true, category: true, metadata: true },
    }),
  ]);

  for (const dayId of dayIds) {
    result.set(dayId, buildSlotSummariesForDay(dayId, participantTotal, attendances, pdfRows));
  }
  return result;
}

export async function summarizeDaySlots(
  sessionId: string,
  dayId: string,
  participantTotal: number,
): Promise<DaySlotSummary[]> {
  const map = await summarizeDaysBatch(sessionId, [dayId], participantTotal);
  return map.get(dayId) ?? buildSlotSummariesForDay(dayId, participantTotal, [], []);
}

export async function computeTodaySuiviStats(sessionId: string): Promise<{
  presentToday: number;
  emargementSlotsCompleted: number;
  emargementSlotsTotal: number;
}> {
  const participantTotal = await countConfirmedParticipants(sessionId);
  const todayId = await ensureTodaySessionDay(sessionId);
  if (!todayId) {
    return { presentToday: 0, emargementSlotsCompleted: 0, emargementSlotsTotal: 2 };
  }

  const slots = await summarizeDaySlots(sessionId, todayId, participantTotal);
  const presentIds = new Set<string>();

  const todayMarks = await prisma.formationSessionEmargement.findMany({
    where: { dayId: todayId, status: { in: ['PRESENT', 'LATE'] } },
    select: { participantId: true },
  });
  for (const mark of todayMarks) presentIds.add(mark.participantId);

  return {
    presentToday: presentIds.size,
    emargementSlotsCompleted: slots.filter((s) => s.complete).length,
    emargementSlotsTotal: 2,
  };
}
