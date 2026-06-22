import { parseReservedEquipmentIds } from '@repo/api-core';
import { Prisma, type PrismaClient } from '@repo/database';

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function assertNotOnActiveSession(
  prisma: PrismaClient,
  equipmentIds: string[],
): Promise<void> {
  const today = startOfTodayUtc();
  const sessions = await prisma.formationSession.findMany({
    where: { endDate: { not: null, gte: today } },
    select: { id: true, reservedEquipmentIds: true },
  });

  for (const equipmentId of equipmentIds) {
    const conflict = sessions.find((s) =>
      parseReservedEquipmentIds(s.reservedEquipmentIds).includes(equipmentId),
    );
    if (conflict) {
      throw new Error(
        'Impossible de supprimer : au moins une pièce est encore réservée sur une session active.',
      );
    }
  }
}

async function scrubEquipmentFromSessions(
  prisma: PrismaClient,
  equipmentIds: string[],
): Promise<void> {
  const idSet = new Set(equipmentIds);
  const sessions = await prisma.formationSession.findMany({
    where: { reservedEquipmentIds: { not: Prisma.DbNull } },
    select: { id: true, reservedEquipmentIds: true },
  });

  for (const session of sessions) {
    const ids = parseReservedEquipmentIds(session.reservedEquipmentIds);
    const next = ids.filter((id) => !idSet.has(id));
    if (next.length !== ids.length) {
      await prisma.formationSession.update({
        where: { id: session.id },
        data: { reservedEquipmentIds: next as unknown as object },
      });
    }
  }
}

export async function deleteEquipmentById(
  prisma: PrismaClient,
  id: string,
): Promise<void> {
  await assertNotOnActiveSession(prisma, [id]);
  await scrubEquipmentFromSessions(prisma, [id]);
  await prisma.equipment.delete({ where: { id } });
}

export async function deleteCatalogByLabel(
  prisma: PrismaClient,
  label: string,
): Promise<{ deletedCount: number }> {
  const trimmed = label.trim();
  if (!trimmed) throw new Error('Libellé catalogue requis.');

  const units = await prisma.equipment.findMany({
    where: { label: trimmed },
    select: { id: true },
  });
  if (units.length === 0) throw new Error('Catégorie introuvable.');

  const ids = units.map((u) => u.id);
  await assertNotOnActiveSession(prisma, ids);
  await scrubEquipmentFromSessions(prisma, ids);
  const result = await prisma.equipment.deleteMany({ where: { label: trimmed } });
  return { deletedCount: result.count };
}
