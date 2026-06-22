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
  let created = 0;

  for (const dayDate of dayDates) {
    const existing = await prisma.formationSessionDay.findUnique({
      where: { sessionId_dayDate: { sessionId, dayDate } },
      select: { id: true },
    });
    if (existing) continue;
    await prisma.formationSessionDay.create({ data: { sessionId, dayDate } });
    created += 1;
  }

  return created;
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

export async function summarizeDaySlots(
  sessionId: string,
  dayId: string,
  participantTotal: number,
): Promise<DaySlotSummary[]> {
  const attendances = await prisma.formationSessionEmargement.findMany({
    where: { dayId },
    select: { slot: true, status: true, participantId: true },
  });

  const pdfRows = await prisma.fileAsset.findMany({
    where: {
      module: 'gestion-academique',
      entityType: 'formation_session',
      entityId: sessionId,
      status: 'ACTIVE',
      category: { in: ['emargement-pdf-morning', 'emargement-pdf-evening'] },
    },
    select: { id: true, category: true, metadata: true },
  });

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
    if (asset.category === 'emargement-pdf-morning') pdfBySlot.MORNING = asset.id;
    if (asset.category === 'emargement-pdf-evening') pdfBySlot.EVENING = asset.id;
  }

  return SUIVI_DAY_SLOTS.map((slot) => {
    const slotRows = attendances.filter((a) => a.slot === slot);
    const markedCount = slotRows.length;
    const presentCount = slotRows.filter((a) => a.status === 'PRESENT' || a.status === 'LATE').length;
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
