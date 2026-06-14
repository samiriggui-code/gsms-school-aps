import type { EquipmentStatus, PrismaClient } from '@repo/database';

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

  const stillReserved = await isEquipmentReservedOnActiveSession(
    prisma,
    equipmentId,
    sessionId,
  );

  if (stillReserved) {
    return { released: true, equipmentStatus: 'IN_USE' };
  }

  const equipment = await prisma.equipment.findUnique({
    where: { id: equipmentId },
    select: { status: true },
  });
  if (!equipment) throw new Error('Équipement introuvable.');

  if (equipment.status === 'IN_USE') {
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
          notes: `Retour stock — désaffectation session ${sessionId}`,
        },
      });
    });
    return { released: true, equipmentStatus: 'AVAILABLE' };
  }

  return { released: true, equipmentStatus: equipment.status };
}

/** Clôture une intervention et remet la pièce en stock si elle était en maintenance. */
export async function completeEquipmentMaintenance(
  prisma: PrismaClient,
  maintenanceId: string,
  notes?: string | null,
) {
  const item = await prisma.equipmentMaintenance.findUnique({
    where: { id: maintenanceId },
    include: { equipment: { select: { id: true, status: true } } },
  });
  if (!item) throw new Error('Intervention introuvable.');
  if (item.status === 'COMPLETED') throw new Error('Intervention déjà clôturée.');

  return prisma.$transaction(async (tx) => {
    const updated = await tx.equipmentMaintenance.update({
      where: { id: maintenanceId },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
        ...(notes !== undefined ? { notes: notes ?? item.notes } : {}),
      },
    });

    if (item.equipment.status === 'MAINTENANCE') {
      await tx.equipment.update({
        where: { id: item.equipmentId },
        data: { status: 'AVAILABLE' },
      });
      await tx.stockMovement.create({
        data: {
          equipmentId: item.equipmentId,
          type: 'IN',
          quantity: 1,
          notes: `Retour stock après maintenance — ${updated.title || 'intervention'}`,
        },
      });
    }

    return updated;
  });
}

export type EndedSessionsReleaseResult = {
  sessionsScanned: number;
  equipmentReleased: number;
};

/** Libère le matériel des sessions catalogue dont la date de fin est passée. */
export async function releaseEndedSessionsEquipment(
  prisma: PrismaClient,
): Promise<EndedSessionsReleaseResult> {
  const today = startOfTodayUtc();
  const sessions = await prisma.formationSession.findMany({
    where: {
      endDate: { not: null, lt: today },
    },
    select: { id: true, reservedEquipmentIds: true },
  });

  let equipmentReleased = 0;
  for (const session of sessions) {
    const ids = parseReservedEquipmentIds(session.reservedEquipmentIds);
    for (const equipmentId of ids) {
      const result = await releaseEquipmentFromSession(prisma, session.id, equipmentId);
      if (result.released) equipmentReleased += 1;
    }
  }

  return { sessionsScanned: sessions.length, equipmentReleased };
}
