import { prisma } from '@/lib/prisma';
import type { FormationSessionDaySlot, FormationSessionEmargementStatus } from '@repo/database';
import { getAvatarUrl } from '@/lib/helpers';
import {
  buildEmargementReportPdfBuffer,
} from '@/lib/instructor/session-attendance-pdf';
import { storeEmargementPdfForSlot } from '@/lib/suivi-formations/session-document-store';
import { isoDateOnly, loadDayParticipantIds } from '@/lib/suivi-formations/session-days';
import { loadEmargementReportPayload } from '@/lib/suivi-formations/emargement-report-payload';

async function fetchAvatarBuffer(avatar: string | null | undefined): Promise<Buffer | null> {
  if (!avatar?.trim()) return null;
  try {
    const path = getAvatarUrl(avatar);
    const base =
      process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
      'http://localhost:3001';
    const url = /^https?:\/\//i.test(path) ? path : `${base}${path.startsWith('/') ? path : `/${path}`}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

export type EmargementMarkInput = {
  participantId: string;
  status: FormationSessionEmargementStatus;
  notes?: string | null;
};

export async function loadDayDetail(dayId: string) {
  const day = await prisma.formationSessionDay.findUnique({
    where: { id: dayId },
    include: {
      session: {
        select: {
          id: true,
          dateDisplayLabel: true,
          location: true,
          trainerUserId: true,
          trainer: { select: { name: true, email: true } },
          venueRoom: { select: { name: true, shortCode: true } },
          formation: { select: { id: true, name: true, slug: true } },
        },
      },
    },
  });
  if (!day) return null;

  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId: day.sessionId, enrollmentStatus: 'CONFIRMED' },
    orderBy: { user: { name: 'asc' } },
    select: {
      id: true,
      userId: true,
      user: { select: { name: true, firstName: true, lastName: true, email: true, avatar: true } },
    },
  });

  const marks = await prisma.formationSessionEmargement.findMany({
    where: { dayId },
    select: {
      id: true,
      participantId: true,
      slot: true,
      status: true,
      notes: true,
      markedAt: true,
      markedByUserId: true,
    },
  });

  return { day, participants, marks };
}

export async function saveEmargementMarks(input: {
  dayId: string;
  slot: FormationSessionDaySlot;
  marks: EmargementMarkInput[];
  markedByUserId: string;
  journalNotes?: string | null;
}) {
  const day = await prisma.formationSessionDay.findUnique({
    where: { id: input.dayId },
    select: { id: true, sessionId: true },
  });
  if (!day) throw new Error('DAY_NOT_FOUND');

  const participantIds = new Set(await loadDayParticipantIds(day.sessionId));
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    if (input.journalNotes !== undefined) {
      await tx.formationSessionDay.update({
        where: { id: input.dayId },
        data:
          input.slot === 'MORNING'
            ? { journalNotesMorning: input.journalNotes }
            : { journalNotesEvening: input.journalNotes },
      });
    }

    for (const mark of input.marks) {
      if (!participantIds.has(mark.participantId)) continue;
      await tx.formationSessionEmargement.upsert({
        where: {
          dayId_participantId_slot: {
            dayId: input.dayId,
            participantId: mark.participantId,
            slot: input.slot,
          },
        },
        create: {
          dayId: input.dayId,
          participantId: mark.participantId,
          slot: input.slot,
          status: mark.status,
          notes: mark.notes?.trim() || null,
          markedAt: now,
          markedByUserId: input.markedByUserId,
          justificationStatus: mark.status === 'ABSENT' ? 'UNJUSTIFIED' : null,
        },
        update: {
          status: mark.status,
          notes: mark.notes?.trim() || null,
          markedAt: now,
          markedByUserId: input.markedByUserId,
          ...(mark.status === 'ABSENT'
            ? {
                justificationStatus: 'UNJUSTIFIED' as const,
                justificationRequestedAt: null,
                justificationResolvedAt: null,
              }
            : {
                justificationStatus: null,
                justificationRequestedAt: null,
                justificationNote: null,
                justificationResolvedAt: null,
              }),
        },
      });
    }
  });
}

function participantDisplayName(user: {
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
}): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ') ||
    user.email
  );
}

export async function generateEmargementPdfForSlot(input: {
  dayId: string;
  slot: FormationSessionDaySlot;
  createdById: string;
}) {
  const detail = await loadDayDetail(input.dayId);
  if (!detail) throw new Error('DAY_NOT_FOUND');

  const { day, participants, marks } = detail;
  const slotMarks = marks.filter((m) => m.slot === input.slot);
  const markByParticipant = new Map(slotMarks.map((m) => [m.participantId, m.status]));
  const dayDateIso = isoDateOnly(day.dayDate);

  const baseUrl =
    process.env.NEXTAUTH_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
    'http://localhost:3001';

  const payload = await loadEmargementReportPayload(input.dayId, input.slot, baseUrl);
  if (!payload) throw new Error('DAY_NOT_FOUND');

  const avatarBuffers = await Promise.all(participants.map((p) => fetchAvatarBuffer(p.user.avatar)));

  const { buffer, filename } = await buildEmargementReportPdfBuffer(payload, avatarBuffers);

  const asset = await storeEmargementPdfForSlot({
    sessionId: day.sessionId,
    dayId: day.id,
    dayDateIso,
    slot: input.slot,
    buffer,
    createdById: input.createdById,
  });

  return {
    asset: {
      id: asset.id,
      url: asset.url,
      originalName: asset.originalName,
      filename,
    },
    markedCount: slotMarks.length,
    presentCount: slotMarks.filter((m) => m.status === 'PRESENT' || m.status === 'LATE').length,
    participantTotal: participants.length,
    markByParticipant: Object.fromEntries(markByParticipant),
  };
}

export async function loadParticipantPresenceHistory(
  sessionId: string,
  participantId: string,
) {
  const rows = await prisma.formationSessionEmargement.findMany({
    where: {
      participantId,
      day: { sessionId },
    },
    orderBy: [{ day: { dayDate: 'desc' } }, { slot: 'asc' }],
    select: {
      slot: true,
      status: true,
      markedAt: true,
      day: { select: { id: true, dayDate: true } },
    },
  });

  return rows.map((r) => ({
    dayId: r.day.id,
    dayDate: isoDateOnly(r.day.dayDate),
    slot: r.slot,
    status: r.status,
    markedAt: r.markedAt?.toISOString() ?? null,
  }));
}
