import type { PrismaClient } from '@repo/database';
import { parseReservedEquipmentIds } from '@repo/api-core';

/** Contexte dispatch global — chargé une fois par requête inventaire. */
export type EquipmentDispatchContext = {
  /** equipmentId → { roomId, roomName, quantity } */
  roomByEquipmentId: Map<string, { roomId: string; roomName: string; quantity: number }>;
  /** equipmentId → sessions qui réservent cette unité */
  sessionsByEquipmentId: Map<
    string,
    Array<{ sessionId: string; label: string; startDate: Date | null }>
  >;
};

export type UnitDispatchState = {
  location: 'AVAILABLE' | 'ROOM_FIXED' | 'SESSION_RESERVED' | 'MAINTENANCE' | 'OUT_OF_SERVICE';
  roomId: string | null;
  roomName: string | null;
  sessionIds: string[];
};

export type CatalogStockStats = {
  unitCount: number;
  availableCount: number;
  roomFixedCount: number;
  sessionReservedCount: number;
  maintenanceCount: number;
  outOfServiceCount: number;
  /** @deprecated alias disponibles */
  currentStock: number;
  /** @deprecated alias salle */
  totalIn: number;
  /** @deprecated alias session */
  totalOut: number;
};

export async function loadEquipmentDispatchContext(
  prisma: PrismaClient,
): Promise<EquipmentDispatchContext> {
  const [roomRows, sessions] = await Promise.all([
    prisma.venueRoomFixedEquipment.findMany({
      include: {
        venueRoom: { select: { id: true, name: true } },
      },
    }),
    prisma.formationSession.findMany({
      where: {
        OR: [{ endDate: null }, { endDate: { gte: new Date() } }],
      },
      select: {
        id: true,
        dateDisplayLabel: true,
        location: true,
        startDate: true,
        reservedEquipmentIds: true,
        formation: { select: { name: true } },
      },
    }),
  ]);

  const roomByEquipmentId = new Map<
    string,
    { roomId: string; roomName: string; quantity: number }
  >();
  for (const row of roomRows) {
    roomByEquipmentId.set(row.equipmentId, {
      roomId: row.venueRoomId,
      roomName: row.venueRoom.name,
      quantity: row.quantity,
    });
  }

  const sessionsByEquipmentId = new Map<
    string,
    Array<{ sessionId: string; label: string; startDate: Date | null }>
  >();
  for (const session of sessions) {
    const ids = parseReservedEquipmentIds(session.reservedEquipmentIds);
    if (ids.length === 0) continue;
    const label =
      [session.formation.name, session.dateDisplayLabel].filter(Boolean).join(' · ') || 'Session';
    for (const equipmentId of ids) {
      const list = sessionsByEquipmentId.get(equipmentId) ?? [];
      list.push({
        sessionId: session.id,
        label,
        startDate: session.startDate,
      });
      sessionsByEquipmentId.set(equipmentId, list);
    }
  }

  return { roomByEquipmentId, sessionsByEquipmentId };
}

export function resolveUnitDispatch(
  unit: { id: string; status: string },
  ctx: EquipmentDispatchContext,
): UnitDispatchState {
  if (unit.status === 'OUT_OF_SERVICE') {
    return {
      location: 'OUT_OF_SERVICE',
      roomId: null,
      roomName: null,
      sessionIds: [],
    };
  }
  if (unit.status === 'MAINTENANCE') {
    return {
      location: 'MAINTENANCE',
      roomId: null,
      roomName: null,
      sessionIds: [],
    };
  }

  const room = ctx.roomByEquipmentId.get(unit.id);
  if (room) {
    return {
      location: 'ROOM_FIXED',
      roomId: room.roomId,
      roomName: room.roomName,
      sessionIds: [],
    };
  }

  const sessions = ctx.sessionsByEquipmentId.get(unit.id) ?? [];
  if (sessions.length > 0) {
    return {
      location: 'SESSION_RESERVED',
      roomId: null,
      roomName: null,
      sessionIds: sessions.map((s) => s.sessionId),
    };
  }

  return {
    location: 'AVAILABLE',
    roomId: null,
    roomName: null,
    sessionIds: [],
  };
}

export function buildCatalogStockStats(
  units: Array<{ id: string; status: string }>,
  ctx: EquipmentDispatchContext,
): CatalogStockStats {
  let availableCount = 0;
  let roomFixedCount = 0;
  let sessionReservedCount = 0;
  let maintenanceCount = 0;
  let outOfServiceCount = 0;

  for (const unit of units) {
    const dispatch = resolveUnitDispatch(unit, ctx);
    switch (dispatch.location) {
      case 'AVAILABLE':
        availableCount += 1;
        break;
      case 'ROOM_FIXED': {
        const room = ctx.roomByEquipmentId.get(unit.id);
        roomFixedCount += room?.quantity ?? 1;
        break;
      }
      case 'SESSION_RESERVED':
        sessionReservedCount += 1;
        break;
      case 'MAINTENANCE':
        maintenanceCount += 1;
        break;
      case 'OUT_OF_SERVICE':
        outOfServiceCount += 1;
        break;
      default:
        break;
    }
  }

  return {
    unitCount: units.length,
    availableCount,
    roomFixedCount,
    sessionReservedCount,
    maintenanceCount,
    outOfServiceCount,
    currentStock: availableCount,
    totalIn: roomFixedCount,
    totalOut: sessionReservedCount,
  };
}
