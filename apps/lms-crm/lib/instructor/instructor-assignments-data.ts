import { prisma } from '@/lib/prisma';
import type { FormationVitrineTrack } from '@/app/(protected)/gestion-academique/vie-scolaire/formations/data/formation-vitrine-catalog';
import type {
  InstructorFormationRow,
  InstructorSessionRow,
  InstructorSessionStatus,
} from '@/lib/instructor/instructor-types';

export type { InstructorFormationRow, InstructorSessionRow, InstructorSessionStatus };

const sessionSelect = {
  id: true,
  startDate: true,
  endDate: true,
  dateDisplayLabel: true,
  location: true,
  sessionKind: true,
  formation: {
    select: {
      id: true,
      name: true,
      slug: true,
      tag: true,
      track: true,
      duration: true,
      logoUrl: true,
      deliveryMode: true,
      qualiopiCertified: true,
      cpfEligible: true,
      courseId: true,
      course: { select: { id: true, title: true } },
    },
  },
  _count: { select: { participants: true } },
} as const;

export function sessionStatus(
  startDate: Date | null,
  endDate: Date | null,
  now: Date,
): InstructorSessionStatus {
  if (startDate && startDate > now) return 'upcoming';
  if (endDate && endDate < now) return 'past';
  if (startDate && startDate <= now && (!endDate || endDate >= now)) return 'ongoing';
  if (!startDate && !endDate) return 'unknown';
  return 'ongoing';
}

export async function listInstructorSessions(userId: string): Promise<InstructorSessionRow[]> {
  const now = new Date();
  const rows = await prisma.formationSession.findMany({
    where: { trainerUserId: userId },
    orderBy: [{ startDate: 'asc' }, { sortOrder: 'asc' }],
    select: sessionSelect,
  });

  return rows.map((s) => ({
    id: s.id,
    dateDisplayLabel: s.dateDisplayLabel,
    location: s.location,
    startDate: s.startDate?.toISOString() ?? null,
    endDate: s.endDate?.toISOString() ?? null,
    participantCount: s._count.participants,
    sessionKind: s.sessionKind,
    formation: {
      id: s.formation.id,
      name: s.formation.name,
      slug: s.formation.slug,
      tag: s.formation.tag,
      track: s.formation.track as FormationVitrineTrack,
      duration: s.formation.duration,
      logoUrl: s.formation.logoUrl,
      courseId: s.formation.courseId,
      courseTitle: s.formation.course?.title ?? null,
    },
    status: sessionStatus(s.startDate, s.endDate, now),
  }));
}

/** Formations du catalogue où le formateur intervient (≥1 session assignée). */
export async function listInstructorFormations(userId: string): Promise<InstructorFormationRow[]> {
  const sessions = await listInstructorSessions(userId);
  const byFormation = new Map<string, InstructorFormationRow & { _sessions: InstructorSessionRow[] }>();

  for (const session of sessions) {
    const f = session.formation;
    let row = byFormation.get(f.id);
    if (!row) {
      row = {
        id: f.id,
        name: f.name,
        slug: f.slug,
        tag: f.tag,
        track: f.track,
        duration: f.duration,
        logoUrl: f.logoUrl,
        deliveryMode: null,
        qualiopiCertified: false,
        cpfEligible: false,
        courseId: f.courseId,
        courseTitle: f.courseTitle,
        assignedSessionCount: 0,
        upcomingSessionCount: 0,
        participantCount: 0,
        nextSessionLabel: null,
        nextSessionStartDate: null,
        _sessions: [],
      };
      byFormation.set(f.id, row);
    }

    row._sessions.push(session);
    row.assignedSessionCount += 1;
    row.participantCount += session.participantCount;
    if (session.status === 'upcoming' || session.status === 'ongoing') {
      row.upcomingSessionCount += 1;
    }
  }

  if (byFormation.size === 0) return [];

  const formationMeta = await prisma.formation.findMany({
    where: { id: { in: Array.from(byFormation.keys()) } },
    select: {
      id: true,
      deliveryMode: true,
      qualiopiCertified: true,
      cpfEligible: true,
    },
  });
  for (const meta of formationMeta) {
    const row = byFormation.get(meta.id);
    if (!row) continue;
    row.deliveryMode = meta.deliveryMode;
    row.qualiopiCertified = meta.qualiopiCertified;
    row.cpfEligible = meta.cpfEligible;
  }

  const result: InstructorFormationRow[] = [];

  for (const row of Array.from(byFormation.values())) {
    const upcoming = row._sessions
      .filter((s) => s.status === 'upcoming' || s.status === 'ongoing')
      .sort((a, b) => {
        const ta = a.startDate ? new Date(a.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        const tb = b.startDate ? new Date(b.startDate).getTime() : Number.MAX_SAFE_INTEGER;
        return ta - tb;
      });

    const next = upcoming[0] ?? row._sessions[0] ?? null;

    result.push({
      id: row.id,
      name: row.name,
      slug: row.slug,
      tag: row.tag,
      track: row.track,
      duration: row.duration,
      logoUrl: row.logoUrl,
      deliveryMode: row.deliveryMode,
      qualiopiCertified: row.qualiopiCertified,
      cpfEligible: row.cpfEligible,
      courseId: row.courseId,
      courseTitle: row.courseTitle,
      assignedSessionCount: row.assignedSessionCount,
      upcomingSessionCount: row.upcomingSessionCount,
      participantCount: row.participantCount,
      nextSessionLabel: next?.dateDisplayLabel ?? null,
      nextSessionStartDate: next?.startDate ?? null,
    });
  }

  result.sort((a, b) => {
    const ta = a.nextSessionStartDate ? new Date(a.nextSessionStartDate).getTime() : Number.MAX_SAFE_INTEGER;
    const tb = b.nextSessionStartDate ? new Date(b.nextSessionStartDate).getTime() : Number.MAX_SAFE_INTEGER;
    if (ta !== tb) return ta - tb;
    return a.name.localeCompare(b.name, 'fr');
  });

  return result;
}
