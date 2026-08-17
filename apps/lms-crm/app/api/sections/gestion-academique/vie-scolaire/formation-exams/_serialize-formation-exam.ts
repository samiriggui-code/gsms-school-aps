import type { Prisma } from '@repo/database';
import { parseJuryMemberNames, parseReservedEquipmentIds } from '@repo/api-core';
import type { FormationExamApiRow } from '@/lib/vie-scolaire/formation-exam-api-types';
export type { FormationExamApiRow };
export { FORMATION_EXAM_OFFICIAL_DOCUMENTS } from '@/lib/vie-scolaire/formation-exam-documents';

export const formationExamDetailInclude = {
  session: {
    select: {
      id: true,
      dateDisplayLabel: true,
      location: true,
      examDate: true,
      sessionKind: true,
      examVenueRoomId: true,
      examReservedEquipmentIds: true,
      examVenueRoom: {
        select: {
          id: true,
          name: true,
          shortCode: true,
          floorLabel: true,
          imageUrl: true,
          capacity: true,
        },
      },
      trainer: {
        select: { id: true, name: true, firstName: true, lastName: true, email: true, avatar: true },
      },
      formation: { select: { id: true, name: true, slug: true } },
      participants: {
        where: { enrollmentStatus: 'CONFIRMED' },
        orderBy: { createdAt: 'asc' as const },
        select: {
          id: true,
          examOutcome: true,
          examDate: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
            },
          },
        },
      },
    },
  },
  venueRoom: {
    select: {
      id: true,
      name: true,
      shortCode: true,
      floorLabel: true,
      imageUrl: true,
      capacity: true,
    },
  },
} satisfies Prisma.FormationExamInclude;

export type FormationExamDetailPayload = Prisma.FormationExamGetPayload<{
  include: typeof formationExamDetailInclude;
}>;

export type ExamVenueRoomSummary = {
  id: string;
  name: string;
  shortCode: string | null;
  floorLabel: string | null;
  imageUrl: string | null;
  capacity: number | null;
};

function countOutcomes(
  participants: FormationExamDetailPayload['session']['participants'],
) {
  const counts = { pending: 0, passed: 0, failed: 0, absent: 0 };
  for (const p of participants) {
    if (p.examOutcome === 'PASSED') counts.passed += 1;
    else if (p.examOutcome === 'FAILED') counts.failed += 1;
    else if (p.examOutcome === 'ABSENT') counts.absent += 1;
    else counts.pending += 1;
  }
  return counts;
}

function resolveExamVenueRoom(row: FormationExamDetailPayload): ExamVenueRoomSummary | null {
  return row.venueRoom ?? row.session.examVenueRoom ?? null;
}

export function serializeFormationExamRow(row: FormationExamDetailPayload): FormationExamApiRow {
  const participants = row.session.participants;
  const outcomeCounts = countOutcomes(participants);
  const examVenueRoom = resolveExamVenueRoom(row);
  const scheduledAt = row.scheduledAt ?? row.session.examDate;

  return {
    id: row.id,
    sessionId: row.sessionId,
    scheduledAt: scheduledAt?.toISOString() ?? null,
    status: row.status,
    juryPresidentName: row.juryPresidentName,
    juryMemberNames: parseJuryMemberNames(row.juryMemberNames),
    notes: row.notes,
    venueRoom: examVenueRoom,
    session: {
      id: row.session.id,
      dateDisplayLabel: row.session.dateDisplayLabel,
      location: row.session.location,
      sessionKind: row.session.sessionKind,
      examDate: row.session.examDate?.toISOString() ?? null,
      formation: row.session.formation,
      trainer: row.session.trainer,
      examVenueRoomId: row.session.examVenueRoomId,
      examReservedEquipmentIds: parseReservedEquipmentIds(row.session.examReservedEquipmentIds),
    },
    participantCount: participants.length,
    outcomeCounts,
    participants: participants.map((p) => ({
      id: p.id,
      examOutcome: p.examOutcome,
      examDate: p.examDate?.toISOString() ?? null,
      user: p.user,
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

