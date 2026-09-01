import type { PrismaClient, SessionReadinessStatus } from '@repo/database';

export type SessionReadinessCheck = {
  id: string;
  label: string;
  passed: boolean;
  weight: number;
};

export type SessionReadinessScanResult = {
  sessionId: string;
  sessionLabel: string;
  readinessStatus: SessionReadinessStatus;
  participantCount: number;
  confirmedParticipantCount: number;
  readinessScore: number;
  checks: SessionReadinessCheck[];
  blockers: string[];
  scannedAt: string;
  taskId: string;
};

const STATUS_WEIGHT: Partial<Record<SessionReadinessStatus, number>> = {
  DRAFT: 0,
  PLANNED: 15,
  CONFIRMED: 35,
  READY: 55,
  RUNNING: 75,
  COMPLETED: 90,
  CLOSED: 95,
  ARCHIVED: 100,
};

function isNonEmptyJsonArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function addCheck(
  checks: SessionReadinessCheck[],
  id: string,
  label: string,
  passed: boolean,
  weight = 1,
): void {
  checks.push({ id, label, passed, weight });
}

/**
 * Score readiness déterministe (0–100) pour EVE proactif — checklist sur données réelles.
 * Pas de hard-block WF-11/12 : signale les manques, n'empêche pas l'avancement manuel.
 */
export async function scanSessionReadiness(
  prisma: PrismaClient,
  sessionId: string,
  taskId: string,
): Promise<SessionReadinessScanResult> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      startDate: true,
      endDate: true,
      location: true,
      readinessStatus: true,
      trainerUserId: true,
      moderatorUserId: true,
      venueRoomId: true,
      pedagogicalOutline: true,
      reservedEquipmentIds: true,
      participants: {
        select: { id: true, enrollmentStatus: true },
      },
      suiviDays: { select: { id: true }, take: 1 },
      fundingCases: {
        where: { status: { not: 'REJECTED' } },
        select: { id: true },
        take: 1,
      },
    },
  });
  if (!session) throw new Error('Session introuvable.');

  const checks: SessionReadinessCheck[] = [];
  const confirmed = session.participants.filter((p) => p.enrollmentStatus === 'CONFIRMED');

  addCheck(checks, 'trainer', 'Formateur référent assigné', Boolean(session.trainerUserId));
  addCheck(checks, 'start_date', 'Date de début renseignée', session.startDate != null);
  addCheck(checks, 'location', 'Lieu de formation renseigné', Boolean(session.location?.trim()));
  addCheck(checks, 'venue', 'Salle allouée', Boolean(session.venueRoomId));
  addCheck(
    checks,
    'participants',
    'Au moins un participant confirmé',
    confirmed.length > 0,
    2,
  );
  addCheck(
    checks,
    'pedagogical_outline',
    'Déroulé pédagogique renseigné',
    isNonEmptyJsonArray(session.pedagogicalOutline),
  );
  addCheck(
    checks,
    'schedule',
    'Planning journalier saisi',
    session.suiviDays.length > 0,
  );
  addCheck(
    checks,
    'funding',
    'Dossier financeur lié',
    session.fundingCases.length > 0,
  );
  addCheck(
    checks,
    'readiness_status',
    'Statut readiness ≥ CONFIRMED',
    ['CONFIRMED', 'READY', 'RUNNING', 'COMPLETED', 'CLOSED', 'ARCHIVED'].includes(
      session.readinessStatus,
    ),
    2,
  );

  const totalWeight = checks.reduce((sum, c) => sum + c.weight, 0);
  const passedWeight = checks.filter((c) => c.passed).reduce((sum, c) => sum + c.weight, 0);
  const checklistScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  const statusFloor = STATUS_WEIGHT[session.readinessStatus] ?? 0;
  const readinessScore = Math.min(100, Math.max(checklistScore, statusFloor));

  const blockers = checks.filter((c) => !c.passed).map((c) => c.label);

  return {
    sessionId: session.id,
    sessionLabel: session.dateDisplayLabel,
    readinessStatus: session.readinessStatus,
    participantCount: session.participants.length,
    confirmedParticipantCount: confirmed.length,
    readinessScore,
    checks,
    blockers,
    scannedAt: new Date().toISOString(),
    taskId,
  };
}
