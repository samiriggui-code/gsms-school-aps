import type { FormationSessionDaySlot } from '@repo/database';
import { getAvatarUrl } from '@/lib/helpers';
import { loadReportDocumentBrand } from '@/lib/reports/document-brand';
import { loadSuiviSessionContext } from '@/lib/suivi-formations/session-suivi-context';
import {
  buildCapacityLabel,
  emargementStatusLabel,
  formatEmargementShortDateFr,
  type EmargementReportData,
} from '@/lib/suivi-formations/emargement-report-types';
import { loadDayDetail } from '@/lib/suivi-formations/session-emargement-service';
import { isoDateOnly } from '@/lib/suivi-formations/session-days';
import {
  resolveFormationSessionLocation,
  SUIVI_DAY_SLOT_LABELS,
} from '@/lib/suivi-formations/session-location';

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

/** Construit le payload rapport (aperçu + PDF) à partir du jour et du créneau. */
export async function loadEmargementReportPayload(
  dayId: string,
  slot: FormationSessionDaySlot,
  origin?: string,
): Promise<EmargementReportData | null> {
  const detail = await loadDayDetail(dayId);
  if (!detail) return null;

  const { day, participants, marks } = detail;
  const slotMarks = marks.filter((m) => m.slot === slot);
  const markByParticipant = new Map(slotMarks.map((m) => [m.participantId, m.status]));

  const [sessionContext, brand] = await Promise.all([
    loadSuiviSessionContext(day.sessionId),
    loadReportDocumentBrand(origin),
  ]);

  const trainerName =
    day.session.trainer?.name?.trim() ||
    day.session.trainer?.email ||
    sessionContext?.trainerName ||
    'Formateur référent';

  const locationLabel = resolveFormationSessionLocation({
    location: day.session.location,
    venueRoom: day.session.venueRoom,
  });

  const dayDateIso = isoDateOnly(day.dayDate);
  const journalNotes =
    slot === 'MORNING' ? day.journalNotesMorning : day.journalNotesEvening;

  return {
    brand: {
      companyName: brand.companyName,
      tagline: brand.tagline,
      logoUrl: brand.logoUrl,
      qualiopiLogoUrl: brand.qualiopiLogoUrl,
      addressLine: brand.addressLine,
      legalLine: brand.legalLine,
      contactLine: brand.contactLine,
    },
    formationName: day.session.formation.name,
    sessionLabel: day.session.dateDisplayLabel,
    sessionSubtitle: sessionContext?.sessionSubtitle ?? null,
    location: locationLabel,
    roomFloor: sessionContext?.venueRoom?.floorLabel ?? null,
    trainerName,
    trainerEmail: sessionContext?.trainerEmail ?? day.session.trainer?.email ?? null,
    attendanceDate: dayDateIso,
    slotLabel: SUIVI_DAY_SLOT_LABELS[slot],
    formationDuration: sessionContext?.formationDuration ?? null,
    participantCount: sessionContext?.participantCount ?? participants.length,
    capacityLabel: sessionContext
      ? buildCapacityLabel(sessionContext.traineesMin, sessionContext.traineesMax)
      : null,
    sessionStartLabel: formatEmargementShortDateFr(sessionContext?.startDate ?? null),
    sessionEndLabel: formatEmargementShortDateFr(sessionContext?.endDate ?? null),
    journalNotes: journalNotes?.trim() || null,
    participants: participants.map((p, i) => ({
      index: i + 1,
      name: participantDisplayName(p.user),
      email: p.user.email,
      avatarUrl: getAvatarUrl(p.user.avatar),
      statusLabel: markByParticipant.has(p.id)
        ? emargementStatusLabel(markByParticipant.get(p.id))
        : null,
    })),
  };
}
