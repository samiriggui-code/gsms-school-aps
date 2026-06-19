import type { PrismaClient } from '@repo/database';
import { dispatchCrmResourceEvent } from './crm-resource-dispatch';

const EQUIPMENT_HREF = '/gestion-ressources/equipements';
const SESSIONS_HREF = '/gestion-academique/vie-scolaire/sessions';

function sessionHref(sessionId: string) {
  return `${SESSIONS_HREF}?id=${sessionId}`;
}

async function loadSessionContext(prisma: PrismaClient, sessionId: string) {
  return prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      formation: { select: { name: true } },
    },
  });
}

async function loadEquipmentLabels(prisma: PrismaClient, ids: string[]) {
  if (ids.length === 0) return [];
  const rows = await prisma.equipment.findMany({
    where: { id: { in: ids } },
    select: { id: true, label: true, serialNumber: true },
  });
  return rows.map((r) => `${r.label} (${r.serialNumber})`);
}

export async function notifySessionEquipmentReservationUpdated(
  prisma: PrismaClient,
  args: {
    sessionId: string;
    addedIds: string[];
    removedIds: string[];
    actorUserId?: string | null;
  },
) {
  const session = await loadSessionContext(prisma, args.sessionId);
  const sessionLabel =
    session?.formation?.name || session?.dateDisplayLabel || args.sessionId;

  if (args.addedIds.length > 0) {
    const labels = await loadEquipmentLabels(prisma, args.addedIds);
    await dispatchCrmResourceEvent(prisma, {
      eventType: 'equipment.assigned',
      title: 'Matériel réservé pour session',
      body: `${args.addedIds.length} pièce(s) affectée(s) à « ${sessionLabel} ».`,
      href: sessionHref(args.sessionId),
      dedupeKey: `equipment:session:${args.sessionId}:assign:${args.addedIds.sort().join(',')}`,
      detailLines: labels,
      createdById: args.actorUserId,
      eyebrow: 'Équipements — réservation session',
      payload: { sessionId: args.sessionId, equipmentIds: args.addedIds },
    });
  }

  if (args.removedIds.length > 0) {
    const labels = await loadEquipmentLabels(prisma, args.removedIds);
    await dispatchCrmResourceEvent(prisma, {
      eventType: 'equipment.released',
      title: 'Matériel libéré de session',
      body: `${args.removedIds.length} pièce(s) retirée(s) de « ${sessionLabel} » et remise(s) en stock si possible.`,
      href: sessionHref(args.sessionId),
      dedupeKey: `equipment:session:${args.sessionId}:release:${args.removedIds.sort().join(',')}:${Date.now()}`,
      detailLines: labels,
      createdById: args.actorUserId,
      eyebrow: 'Équipements — libération session',
      payload: { sessionId: args.sessionId, equipmentIds: args.removedIds },
    });
  }
}

export async function notifyEquipmentMaintenanceStarted(
  prisma: PrismaClient,
  args: {
    equipmentId: string;
    maintenanceId: string;
    title: string;
    actorUserId?: string | null;
  },
) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: args.equipmentId },
    select: { label: true, serialNumber: true },
  });
  if (!equipment) return;

  await dispatchCrmResourceEvent(prisma, {
    eventType: 'equipment.maintenance.started',
    title: 'Pièce entrée en maintenance',
    body: `« ${equipment.label} » (${equipment.serialNumber}) — intervention « ${args.title} ».`,
    href: `${EQUIPMENT_HREF}/maintenance`,
    dedupeKey: `equipment:maintenance:${args.maintenanceId}:started`,
    detailLines: [`Intervention : ${args.title}`],
    createdById: args.actorUserId,
    eyebrow: 'Atelier — départ maintenance',
    severity: 'WARNING',
    payload: { equipmentId: args.equipmentId, maintenanceId: args.maintenanceId },
  });
}

export async function notifyEquipmentMaintenanceCompleted(
  prisma: PrismaClient,
  args: {
    equipmentId: string;
    maintenanceId: string;
    outcome: 'restock' | 'out_of_service';
    actorUserId?: string | null;
  },
) {
  const equipment = await prisma.equipment.findUnique({
    where: { id: args.equipmentId },
    select: { label: true, serialNumber: true },
  });
  if (!equipment) return;

  const isHs = args.outcome === 'out_of_service';
  await dispatchCrmResourceEvent(prisma, {
    eventType: isHs ? 'equipment.maintenance.out_of_service' : 'equipment.maintenance.completed',
    title: isHs ? 'Pièce classée hors service' : 'Maintenance terminée — retour stock',
    body: isHs
      ? `« ${equipment.label} » (${equipment.serialNumber}) est HS non réparable (conservée à flo).`
      : `« ${equipment.label} » (${equipment.serialNumber}) est de nouveau disponible en stock.`,
    href: isHs ? `${EQUIPMENT_HREF}/inventaire` : `${EQUIPMENT_HREF}/maintenance`,
    dedupeKey: `equipment:maintenance:${args.maintenanceId}:done:${args.outcome}`,
    createdById: args.actorUserId,
    eyebrow: isHs ? 'Atelier — hors service' : 'Atelier — retour stock',
    severity: isHs ? 'WARNING' : 'INFO',
    payload: {
      equipmentId: args.equipmentId,
      maintenanceId: args.maintenanceId,
      outcome: args.outcome,
    },
  });
}

export async function notifyEquipmentBatchReleasedFromSessions(
  prisma: PrismaClient,
  args: {
    equipmentReleased: number;
    sessionsCleared: number;
    source?: 'worker' | 'manual';
  },
) {
  if (args.equipmentReleased <= 0 && args.sessionsCleared <= 0) return;

  await dispatchCrmResourceEvent(prisma, {
    eventType: 'equipment.batch_released',
    title: 'Sessions terminées — matériel libéré',
    body: `${args.equipmentReleased} pièce(s) remise(s) en stock sur ${args.sessionsCleared} session(s) clôturée(s).`,
    href: `${EQUIPMENT_HREF}/affectations`,
    dedupeKey: `equipment:batch-release:${new Date().toISOString().slice(0, 13)}`,
    detailLines: [
      `Source : ${args.source === 'worker' ? 'traitement automatique' : 'action manuelle'}`,
    ],
    eyebrow: 'Équipements — fin de session',
    payload: { ...args },
  });
}

export async function notifyAllSessionEquipmentReleased(
  prisma: PrismaClient,
  args: { sessionId: string; count: number; actorUserId?: string | null },
) {
  if (args.count <= 0) return;
  const session = await loadSessionContext(prisma, args.sessionId);
  const sessionLabel =
    session?.formation?.name || session?.dateDisplayLabel || args.sessionId;

  await dispatchCrmResourceEvent(prisma, {
    eventType: 'equipment.released',
    title: 'Session supprimée — matériel libéré',
    body: `${args.count} pièce(s) libérée(s) avant suppression de « ${sessionLabel} ».`,
    href: sessionHref(args.sessionId),
    dedupeKey: `equipment:session:${args.sessionId}:delete-release:${Date.now()}`,
    createdById: args.actorUserId,
    eyebrow: 'Équipements — libération session',
    payload: { sessionId: args.sessionId, count: args.count },
  });
}
