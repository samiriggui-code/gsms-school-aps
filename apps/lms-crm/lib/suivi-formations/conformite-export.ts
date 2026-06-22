import { prisma } from '@/lib/prisma';
import {
  computeProgressForUsers,
  loadSessionCourseBundle,
} from '@/lib/suivi-formations/session-progress';
import { resolveParticipantFunding } from '@/lib/suivi-formations/resolve-participant-funding';
import { isoDateOnly } from '@/lib/suivi-formations/session-days';

export type ConformiteExportVariant = 'cpf' | 'france-travail' | 'all';

function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? '' : String(value);
  if (/[",;\n\r]/.test(raw)) return `"${raw.replace(/"/g, '""')}"`;
  return raw;
}

function csvLine(cells: Array<string | number | null | undefined>): string {
  return cells.map(csvEscape).join(';');
}

function variantMatchesFunding(variant: ConformiteExportVariant, fundingMode: string | null): boolean {
  if (variant === 'all') return true;
  if (!fundingMode) return false;
  if (variant === 'cpf') return fundingMode === 'cpf' || fundingMode === 'transition';
  if (variant === 'france-travail') {
    return fundingMode === 'franceTravail' || fundingMode === 'apprenticeship';
  }
  return true;
}

export async function buildSessionConformiteExportCsv(input: {
  sessionId: string;
  variant: ConformiteExportVariant;
}): Promise<{ buffer: Buffer; filename: string; rowCount: number }> {
  const session = await prisma.formationSession.findUnique({
    where: { id: input.sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      startDate: true,
      endDate: true,
      location: true,
      formation: { select: { name: true, slug: true, cpfEligible: true } },
    },
  });
  if (!session) throw new Error('SESSION_NOT_FOUND');

  const participants = await prisma.formationSessionParticipant.findMany({
    where: { sessionId: input.sessionId, enrollmentStatus: 'CONFIRMED' },
    orderBy: { user: { name: 'asc' } },
    select: {
      id: true,
      userId: true,
      examOutcome: true,
      fundingMode: true,
      fundingReference: true,
      fundingNotes: true,
      user: {
        select: {
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          birthDate: true,
        },
      },
      candidature: { select: { notes: true, metadata: true } },
    },
  });

  const userIds = participants.map((p) => p.userId);
  const { bundle } = await loadSessionCourseBundle(input.sessionId);
  const progressMap = await computeProgressForUsers(userIds, bundle);

  const presenceRows = await prisma.formationSessionEmargement.findMany({
    where: {
      participantId: { in: participants.map((p) => p.id) },
      status: { in: ['PRESENT', 'LATE'] },
    },
    select: { participantId: true, slot: true },
  });
  const presenceCount = new Map<string, number>();
  for (const row of presenceRows) {
    presenceCount.set(row.participantId, (presenceCount.get(row.participantId) ?? 0) + 1);
  }

  const dayCount = await prisma.formationSessionDay.count({
    where: { sessionId: input.sessionId },
  });

  const headers =
    input.variant === 'france-travail'
      ? [
          'Nom',
          'Prénom',
          'Email',
          'Téléphone',
          'Financeur',
          'Référence dossier',
          'Formation',
          'Session',
          'Lieu',
          'Date début',
          'Date fin',
          'Jours ouvrés session',
          'Créneaux présents',
          'Progression e-learning %',
          'UV complétées',
          'Quiz validés',
          'Résultat examen',
          'Notes financeur',
        ]
      : [
          'Nom',
          'Prénom',
          'Email',
          'Financeur',
          'Référence CPF/dossier',
          'Formation',
          'Session',
          'Éligible CPF',
          'Progression e-learning %',
          'UV complétées',
          'Quiz validés',
          'Créneaux présents',
          'Résultat examen',
          'Notes financeur',
        ];

  const lines = [csvLine(headers)];

  for (const p of participants) {
    const funding = resolveParticipantFunding(p);
    if (!variantMatchesFunding(input.variant, funding.fundingMode)) continue;

    const prog = progressMap.get(p.userId);
    const lastName = p.user.lastName?.trim() || '';
    const firstName =
      p.user.firstName?.trim() ||
      p.user.name?.trim()?.split(' ')[0] ||
      '';
    const displayName = p.user.name?.trim() || `${firstName} ${lastName}`.trim();
    const resolvedLast = lastName || displayName.split(' ').slice(-1)[0] || '';
    const resolvedFirst =
      firstName || displayName.split(' ').slice(0, -1).join(' ') || displayName;

    if (input.variant === 'france-travail') {
      lines.push(
        csvLine([
          resolvedLast,
          resolvedFirst,
          p.user.email,
          p.user.phone,
          funding.fundingModeLabel,
          funding.fundingReference,
          session.formation.name,
          session.dateDisplayLabel,
          session.location,
          session.startDate ? isoDateOnly(session.startDate) : '',
          session.endDate ? isoDateOnly(session.endDate) : '',
          dayCount,
          presenceCount.get(p.id) ?? 0,
          prog?.progressPercent ?? 0,
          `${prog?.completedChapters ?? 0}/${prog?.totalChapters ?? 0}`,
          `${prog?.quizPassed ?? 0}/${prog?.quizTotal ?? 0}`,
          p.examOutcome,
          funding.fundingNotes,
        ]),
      );
    } else {
      lines.push(
        csvLine([
          resolvedLast,
          resolvedFirst,
          p.user.email,
          funding.fundingModeLabel,
          funding.fundingReference,
          session.formation.name,
          session.dateDisplayLabel,
          session.formation.cpfEligible ? 'OUI' : 'NON',
          prog?.progressPercent ?? 0,
          `${prog?.completedChapters ?? 0}/${prog?.totalChapters ?? 0}`,
          `${prog?.quizPassed ?? 0}/${prog?.quizTotal ?? 0}`,
          presenceCount.get(p.id) ?? 0,
          p.examOutcome,
          funding.fundingNotes,
        ]),
      );
    }
  }

  const ymd = new Date().toISOString().slice(0, 10);
  const slug = session.formation.slug.slice(0, 24);
  const suffix =
    input.variant === 'all' ? 'complet' : input.variant === 'cpf' ? 'cpf' : 'france-travail';
  const filename = `export-conformite-${suffix}_${slug}_${ymd}.csv`;
  const buffer = Buffer.from(`\uFEFF${lines.join('\n')}`, 'utf-8');

  return { buffer, filename, rowCount: Math.max(0, lines.length - 1) };
}

export function conformiteExportLabel(variant: ConformiteExportVariant): string {
  if (variant === 'cpf') return 'Export CPF / transition pro';
  if (variant === 'france-travail') return 'Export France Travail / AIF';
  return 'Export conformité complet';
}

export function fundingStatsFromParticipants(
  participants: Array<{
    fundingMode: string | null;
    fundingReference: string | null;
    fundingNotes: string | null;
    candidature: { notes: string | null; metadata: unknown } | null;
  }>,
): Record<string, number> {
  const counts: Record<string, number> = { unset: 0 };
  for (const p of participants) {
    const resolved = resolveParticipantFunding(p);
    const key = resolved.fundingMode ?? 'unset';
    counts[key] = (counts[key] ?? 0) + 1;
  }
  return counts;
}
