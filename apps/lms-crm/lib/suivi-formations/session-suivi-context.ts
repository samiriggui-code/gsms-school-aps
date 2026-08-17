import { prisma } from '@/lib/prisma';
import { resolveFormationSessionLocation } from '@/lib/suivi-formations/session-location';
import { resolveSuiviSessionPhase } from '@/lib/suivi-formations/session-progress';
import type { SuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context-types';

export type { SuiviSessionContext, SuiviSessionPhase } from '@/lib/suivi-formations/session-suivi-context-types';

export async function loadSuiviSessionContext(sessionId: string): Promise<SuiviSessionContext | null> {
  const row = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      sessionSubtitle: true,
      sessionKind: true,
      location: true,
      startDate: true,
      endDate: true,
      registrationClosesAt: true,
      examDate: true,
      traineesMin: true,
      traineesMax: true,
      trainer: { select: { name: true, email: true, avatar: true } },
      venueRoom: {
        select: {
          id: true,
          name: true,
          shortCode: true,
          imageUrl: true,
          capacity: true,
          floorLabel: true,
        },
      },
      formation: { select: { name: true, slug: true, duration: true } },
      _count: {
        select: {
          participants: { where: { enrollmentStatus: 'CONFIRMED' } },
        },
      },
    },
  });
  if (!row) return null;

  const trainerName =
    row.trainer?.name?.trim() || row.trainer?.email?.trim() || null;

  return {
    id: row.id,
    formationName: row.formation.name,
    formationSlug: row.formation.slug,
    formationDuration: row.formation.duration?.trim() || null,
    dateDisplayLabel: row.dateDisplayLabel,
    sessionSubtitle: row.sessionSubtitle,
    sessionKind: row.sessionKind,
    locationDisplay: resolveFormationSessionLocation({
      location: row.location,
      venueRoom: row.venueRoom,
    }),
    startDate: row.startDate?.toISOString() ?? null,
    endDate: row.endDate?.toISOString() ?? null,
    registrationClosesAt: row.registrationClosesAt?.toISOString() ?? null,
    examDate: row.examDate?.toISOString() ?? null,
    traineesMin: row.traineesMin,
    traineesMax: row.traineesMax,
    participantCount: row._count.participants,
    trainerName,
    trainerEmail: row.trainer?.email ?? null,
    trainerAvatar: row.trainer?.avatar ?? null,
    venueRoom: row.venueRoom,
    phase: resolveSuiviSessionPhase(row.startDate, row.endDate),
  };
}
