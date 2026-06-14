import { prisma } from '@/lib/prisma';

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function deriveRoomStatus(
  room: { isActive: boolean },
  sessions: Array<{ startDate: Date | null; endDate: Date | null }>,
  today: Date,
): 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE' {
  if (!room.isActive) return 'INACTIVE';
  const active = sessions.some(
    (s) =>
      s.startDate &&
      s.endDate &&
      s.startDate <= today &&
      s.endDate >= today,
  );
  if (active) return 'RESERVED';
  return 'AVAILABLE';
}

export type SerializedVenueRoom = {
  id: string;
  name: string;
  shortCode: string | null;
  capacity: number | null;
  floorLabel: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE';
  upcomingSessionsCount: number;
  activeSessionsCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function serializeVenueRooms(
  includeInactive = true,
): Promise<SerializedVenueRoom[]> {
  const today = startOfTodayUtc();
  const rooms = await prisma.formationVenueRoom.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const sessions = await prisma.formationSession.findMany({
    where: {
      venueRoomId: { in: rooms.map((r) => r.id) },
      startDate: { not: null },
      endDate: { not: null },
    },
    select: {
      venueRoomId: true,
      startDate: true,
      endDate: true,
    },
  });

  const byRoom = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (!s.venueRoomId) continue;
    const list = byRoom.get(s.venueRoomId) ?? [];
    list.push(s);
    byRoom.set(s.venueRoomId, list);
  }

  return rooms.map((room) => {
    const roomSessions = byRoom.get(room.id) ?? [];
    const upcoming = roomSessions.filter((s) => s.endDate && s.endDate >= today).length;
    return {
      id: room.id,
      name: room.name,
      shortCode: room.shortCode,
      capacity: room.capacity,
      floorLabel: room.floorLabel,
      imageUrl: room.imageUrl,
      isActive: room.isActive,
      sortOrder: room.sortOrder,
      status: deriveRoomStatus(room, roomSessions, today),
      upcomingSessionsCount: upcoming,
      activeSessionsCount: roomSessions.filter(
        (s) =>
          s.startDate &&
          s.endDate &&
          s.startDate <= today &&
          s.endDate >= today,
      ).length,
      createdAt: room.createdAt.toISOString(),
      updatedAt: room.updatedAt.toISOString(),
    };
  });
}

export async function serializeVenueRoomById(
  id: string,
): Promise<SerializedVenueRoom | null> {
  const items = await serializeVenueRooms(true);
  return items.find((r) => r.id === id) ?? null;
}
