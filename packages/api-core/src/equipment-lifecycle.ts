import type { EquipmentStatus, PrismaClient } from '@repo/database';
import {
  notifyAllSessionEquipmentReleased,
  notifyEquipmentBatchReleasedFromSessions,
  notifyEquipmentMaintenanceCompleted,
  notifySessionEquipmentReservationUpdated,
} from './equipment-notifications';

export function parseReservedEquipmentIds(value: unknown): string[] {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((id): id is string => typeof id === 'string' && id.length > 0);
  }
  if (typeof value === 'string') {
    try {
      return parseReservedEquipmentIds(JSON.parse(value));
    } catch {
      return [];
    }
  }
  return [];
}

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function isEquipmentReservedOnActiveSession(
  prisma: PrismaClient,
  equipmentId: string,
  excludeSessionId?: string,
): Promise<boolean> {
  const today = startOfTodayUtc();
  const sessions = await prisma.formationSession.findMany({
    where: {
      ...(excludeSessionId ? { id: { not: excludeSessionId } } : {}),
      endDate: { not: null, gte: today },
    },
    select: { reservedEquipmentIds: true },
  });

  return sessions.some((session) =>
    parseReservedEquipmentIds(session.reservedEquipmentIds).includes(equipmentId),
  );
}

export type ReleaseEquipmentResult = {
  released: boolean;
  equipmentStatus: EquipmentStatus;
};

/** Remet une pièce en stock si elle n’est plus réservée sur une session active. */
export async function releaseEquipmentStatusIfIdle(
  prisma: PrismaClient,
  equipmentId: string,
  excludeSessionId?: string,
): Promise<ReleaseEquipmentResult> {
  const stillReserved = await isEquipmentReservedOnActiveSession(
    prisma,
    equipmentId,
    excludeSessionId,
  );
  if (stillReserved) {
    return { released: false, equipmentStatus: 'IN_USE' };
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      status: true,
      roomFixedAssignment: { select: { id: true } },
    },
  });
  if (!equipment) throw new Error('Équipement introuvable.');

  if (equipment.status === 'IN_USE' && !equipment.roomFixedAssignment) {
    await prisma.$transaction(async (tx) => {
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: 'AVAILABLE' },
      });
      await tx.stockMovement.create({
        data: {
          equipmentId,
          type: 'IN',
          quantity: 1,
          notes: 'Retour stock — fin de réservation session',
        },
      });
    });
    return { released: true, equipmentStatus: 'AVAILABLE' };
  }

  if (equipment.status === 'IN_USE' && equipment.roomFixedAssignment) {
    return { released: true, equipmentStatus: 'IN_USE' };
  }

  return { released: false, equipmentStatus: equipment.status };
}

/** Retire une pièce d’une session et la remet en stock si plus réservée ailleurs. */
export async function releaseEquipmentFromSession(
  prisma: PrismaClient,
  sessionId: string,
  equipmentId: string,
): Promise<ReleaseEquipmentResult> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { id: true, reservedEquipmentIds: true },
  });
  if (!session) throw new Error('Session introuvable.');

  const currentIds = parseReservedEquipmentIds(session.reservedEquipmentIds);
  if (!currentIds.includes(equipmentId)) {
    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { status: true },
    });
    return {
      released: false,
      equipmentStatus: equipment?.status ?? 'AVAILABLE',
    };
  }

  const nextIds = currentIds.filter((id) => id !== equipmentId);
  await prisma.formationSession.update({
    where: { id: sessionId },
    data: { reservedEquipmentIds: nextIds as unknown as object },
  });

  const result = await releaseEquipmentStatusIfIdle(prisma, equipmentId, sessionId);
  return { ...result, released: true };
}

/** Affecte une pièce à une session (statut + mouvement OUT). La session JSON est gérée ailleurs. */
export async function assignEquipmentToSession(
  prisma: PrismaClient,
  sessionId: string,
  equipmentId: string,
): Promise<void> {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: {
      id: true,
      label: true,
      status: true,
      roomFixedAssignment: { select: { id: true, venueRoomId: true } },
    },
  });
  if (!equipment) throw new Error('Équipement introuvable.');

  if (equipment.roomFixedAssignment) {
    throw new Error(
      `« ${equipment.label} » est installé en salle — transférez-le vers l'entrepôt ou une autre salle avant réservation session.`,
    );
  }

  if (equipment.status === 'OUT_OF_SERVICE' || equipment.status === 'MAINTENANCE') {
    throw new Error(
      `« ${equipment.label} » est indisponible (${equipment.status === 'MAINTENANCE' ? 'en maintenance' : 'hors service'}).`,
    );
  }

  if (equipment.status === 'IN_USE') {
    const elsewhere = await isEquipmentReservedOnActiveSession(prisma, equipmentId, sessionId);
    if (elsewhere) {
      throw new Error(`« ${equipment.label} » est déjà affecté à une autre session active.`);
    }
  }

  if (equipment.status === 'AVAILABLE') {
    await prisma.$transaction(async (tx) => {
      await tx.equipment.update({
        where: { id: equipmentId },
        data: { status: 'IN_USE' },
      });
      await tx.stockMovement.create({
        data: {
          equipmentId,
          type: 'OUT',
          quantity: 1,
          notes: `Sortie stock — réservation session ${sessionId}`,
        },
      });
    });
  }
}

/** Applique le diff de réservation matériel après mise à jour JSON session. */
export async function applySessionEquipmentDiff(
  prisma: PrismaClient,
  sessionId: string,
  previousIds: string[],
  nextIds: string[],
  options?: { actorUserId?: string | null },
): Promise<void> {
  const prev = new Set(previousIds);
  const toAdd = nextIds.filter((id) => !prev.has(id));
  const toRemove = previousIds.filter((id) => !nextIds.includes(id));

  for (const equipmentId of toRemove) {
    await releaseEquipmentStatusIfIdle(prisma, equipmentId, sessionId);
  }
  for (const equipmentId of toAdd) {
    await assignEquipmentToSession(prisma, sessionId, equipmentId);
  }

  if (toAdd.length > 0 || toRemove.length > 0) {
    await notifySessionEquipmentReservationUpdated(prisma, {
      sessionId,
      addedIds: toAdd,
      removedIds: toRemove,
      actorUserId: options?.actorUserId,
    });
  }
}

/** Libère tout le matériel d’une session avant suppression. */
export async function releaseAllSessionEquipment(
  prisma: PrismaClient,
  sessionId: string,
  options?: { actorUserId?: string | null },
): Promise<number> {
  const session = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: { reservedEquipmentIds: true },
  });
  if (!session) return 0;

  const ids = parseReservedEquipmentIds(session.reservedEquipmentIds);
  let count = 0;
  for (const equipmentId of ids) {
    const result = await releaseEquipmentStatusIfIdle(prisma, equipmentId, sessionId);
    if (result.released) count += 1;
  }

  if (count > 0) {
    await notifyAllSessionEquipmentReleased(prisma, {
      sessionId,
      count,
      actorUserId: options?.actorUserId,
    });
  }

  return count;
}

export type MaintenanceCompleteOutcome = 'restock' | 'out_of_service';

const OPEN_MAINTENANCE_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'OVERDUE'] as const;

/** Intervention non clôturée pour une pièce (s’il existe). */
export async function findOpenMaintenanceId(
  prisma: PrismaClient,
  equipmentId: string,
): Promise<string | null> {
  const row = await prisma.equipmentMaintenance.findFirst({
    where: {
      equipmentId,
      status: { in: [...OPEN_MAINTENANCE_STATUSES] },
    },
    orderBy: { createdAt: 'desc' },
    select: { id: true },
  });
  return row?.id ?? null;
}

/**
 * Crée une fiche d’intervention si la pièce est en MAINTENANCE sans enregistrement ouvert
 * (ex. passage statut via action groupée inventaire).
 */
export async function ensureOpenMaintenanceRecord(
  prisma: PrismaClient,
  equipmentId: string,
  title = 'Intervention atelier',
) {
  const existingId = await findOpenMaintenanceId(prisma, equipmentId);
  if (existingId) {
    const row = await prisma.equipmentMaintenance.findUnique({ where: { id: existingId } });
    if (row) return row;
  }

  return prisma.equipmentMaintenance.create({
    data: {
      equipmentId,
      title,
      status: 'SCHEDULED',
      notes: 'Intervention ouverte automatiquement (statut maintenance sans fiche).',
    },
  });
}

/** Clôture par pièce : résout ou crée l’intervention ouverte puis applique le sort. */
export async function completeEquipmentMaintenanceForUnit(
  prisma: PrismaClient,
  equipmentId: string,
  options?: {
    notes?: string | null;
    outcome?: MaintenanceCompleteOutcome;
  },
) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { id: true, status: true },
  });
  if (!equipment) throw new Error('Équipement introuvable.');
  if (equipment.status !== 'MAINTENANCE') {
    throw new Error('Cette pièce n’est pas en maintenance.');
  }

  let maintenanceId = await findOpenMaintenanceId(prisma, equipmentId);
  if (!maintenanceId) {
    const created = await ensureOpenMaintenanceRecord(prisma, equipmentId);
    maintenanceId = created.id;
  }

  return completeEquipmentMaintenance(prisma, maintenanceId, options);
}

/** Clôture une intervention : retour stock ou mise hors service (HS). */
export async function completeEquipmentMaintenance(
  prisma: PrismaClient,
  maintenanceId: string,
  options?: {
    notes?: string | null;
    outcome?: MaintenanceCompleteOutcome;
  },
) {
  const outcome = options?.outcome ?? 'restock';
  const item = await prisma.equipmentMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { equipment: { select: { id: true, status: true, label: true } } },
  });
  if (!item) throw new Error('Intervention introuvable.');
  if (item.status === 'COMPLETED') throw new Error('Intervention déjà clôturée.');

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.equipmentMaintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        ...(options?.notes !== undefined ? { notes: options.notes ?? item.notes } : {}),
      },
    });

    if (item.equipment.status !== 'MAINTENANCE') {
      return row;
    }

    if (outcome === 'out_of_service') {
      await tx.equipment.update({
        where: { id: item.equipmentId },
        data: { status: 'OUT_OF_SERVICE' },
      });
      await tx.stockMovement.create({
        data: {
          equipmentId: item.equipmentId,
          type: 'OUT',
          quantity: 1,
          notes: `Hors service — maintenance non réparable : ${row.title || 'intervention'}`,
        },
      });
      return row;
    }

    await tx.equipment.update({
      where: { id: item.equipmentId },
      data: { status: 'AVAILABLE' },
    });
    await tx.stockMovement.create({
      data: {
        equipmentId: item.equipmentId,
        type: 'IN',
        quantity: 1,
        notes: `Retour stock après maintenance — ${row.title || 'intervention'}`,
      },
    });

    return row;
  });

  await notifyEquipmentMaintenanceCompleted(prisma, {
    equipmentId: item.equipmentId,
    maintenanceId,
    outcome,
  });

  return updated;
}

export type EndedSessionsReleaseResult = {
  sessionsScanned: number;
  equipmentReleased: number;
  sessionsCleared: number;
};

/** Libère matériel + vide les réservations JSON des sessions catalogue terminées. */
export async function releaseEndedSessionsEquipment(
  prisma: PrismaClient,
  options?: { notifySource?: 'worker' | 'manual' },
): Promise<EndedSessionsReleaseResult> {
  const today = startOfTodayUtc();
  const sessions = await prisma.formationSession.findMany({
    where: {
      endDate: { not: null, lt: today },
    },
    select: { id: true, reservedEquipmentIds: true },
  });

  let equipmentReleased = 0;
  let sessionsCleared = 0;

  for (const session of sessions) {
    const ids = parseReservedEquipmentIds(session.reservedEquipmentIds);
    if (ids.length === 0) continue;

    for (const equipmentId of ids) {
      const result = await releaseEquipmentStatusIfIdle(prisma, equipmentId, session.id);
      if (result.released) equipmentReleased += 1;
    }

    await prisma.formationSession.update({
      where: { id: session.id },
      data: { reservedEquipmentIds: [] as unknown as object },
    });
    sessionsCleared += 1;
  }

  await notifyEquipmentBatchReleasedFromSessions(prisma, {
    equipmentReleased,
    sessionsCleared,
    source: options?.notifySource ?? 'worker',
  });

  return {
    sessionsScanned: sessions.length,
    equipmentReleased,
    sessionsCleared,
  };
}
