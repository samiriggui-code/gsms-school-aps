import type { EmargementReportData } from '@/lib/suivi-formations/emargement-report-types';
import { buildCapacityLabel } from '@/lib/suivi-formations/emargement-report-types';

export type ExamPdfParticipantRow = {
  user: {
    name: string | null;
    email: string;
    firstName: string | null;
    lastName: string | null;
    avatar: string | null;
  };
};

export function formatExamParticipantName(user: ExamPdfParticipantRow['user']): string {
  return (
    user.name?.trim() ||
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.email
  );
}

export function buildExamEmargementReportData(row: {
  scheduledAt: Date | null;
  notes: string | null;
  venueRoom: {
    name: string;
    shortCode: string | null;
    floorLabel: string | null;
  } | null;
  session: {
    dateDisplayLabel: string;
    location: string;
    examDate: Date | null;
    traineesMin: number | null;
    traineesMax: number | null;
    trainer: {
      name: string | null;
      firstName: string | null;
      lastName: string | null;
      email: string | null;
    } | null;
    formation: { name: string; duration: string | null } | null;
    participants: ExamPdfParticipantRow[];
  };
}): EmargementReportData {
  const examDate = row.scheduledAt ?? row.session.examDate;
  const attendanceDate = examDate
    ? examDate.toISOString().slice(0, 10)
    : new Date().toISOString().slice(0, 10);

  const trainer =
    row.session.trainer?.name?.trim() ||
    [row.session.trainer?.firstName, row.session.trainer?.lastName].filter(Boolean).join(' ') ||
    row.session.trainer?.email?.trim() ||
    '—';

  const locationParts = [row.session.location.trim()];
  if (row.venueRoom?.name) locationParts.push(row.venueRoom.name);
  const location = locationParts.filter(Boolean).join(' — ');

  const participants = row.session.participants.map((p, idx) => ({
    index: idx + 1,
    name: formatExamParticipantName(p.user),
    email: p.user.email,
    avatarUrl: p.user.avatar,
    statusLabel: null,
  }));

  return {
    formationName: row.session.formation?.name ?? 'Formation',
    sessionLabel: row.session.dateDisplayLabel,
    location,
    roomFloor: row.venueRoom?.floorLabel ?? null,
    trainerName: trainer,
    trainerEmail: row.session.trainer?.email ?? null,
    attendanceDate,
    slotLabel: 'Examen final',
    formationDuration: row.session.formation?.duration ?? null,
    participantCount: participants.length,
    capacityLabel: buildCapacityLabel(row.session.traineesMin, row.session.traineesMax),
    journalNotes: row.notes,
    participants,
  };
}
