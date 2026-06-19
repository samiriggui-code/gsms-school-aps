import { prisma } from '@/lib/prisma';

function startOfTodayUtc(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function endOfTodayUtc(): Date {
  const d = startOfTodayUtc();
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function deriveRoomStatus(
  room: { isActive: boolean },
  sessions: Array<{ startDate: Date | null; endDate: Date | null }>,
  bookings: Array<{ startAt: Date; endAt: Date }>,
  today: Date,
  todayEnd: Date,
): 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE' | 'INACTIVE' {
  if (!room.isActive) return 'INACTIVE';
  const activeSession = sessions.some(
    (s) =>
      s.startDate &&
      s.endDate &&
      s.startDate <= todayEnd &&
      s.endDate >= today,
  );
  if (activeSession) return 'RESERVED';

  const activeBooking = bookings.some(
    (b) => b.startAt <= todayEnd && b.endAt >= today,
  );
  if (activeBooking) return 'RESERVED';

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
  activeBookingsCount: number;
  createdAt: string;
  updatedAt: string;
};

export async function serializeVenueRooms(
  includeInactive = true,
): Promise<SerializedVenueRoom[]> {
  const today = startOfTodayUtc();
  const todayEnd = endOfTodayUtc();
  const rooms = await prisma.formationVenueRoom.findMany({
    where: includeInactive ? {} : { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
  });

  const [sessions, bookings] = await Promise.all([
    prisma.formationSession.findMany({
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
    }),
    prisma.venueRoomBooking.findMany({
      where: {
        venueRoomId: { in: rooms.map((r) => r.id) },
        status: 'ACTIVE',
      },
      select: {
        venueRoomId: true,
        startAt: true,
        endAt: true,
      },
    }),
  ]);

  const sessionsByRoom = new Map<string, typeof sessions>();
  for (const s of sessions) {
    if (!s.venueRoomId) continue;
    const list = sessionsByRoom.get(s.venueRoomId) ?? [];
    list.push(s);
    sessionsByRoom.set(s.venueRoomId, list);
  }

  const bookingsByRoom = new Map<string, typeof bookings>();
  for (const b of bookings) {
    const list = bookingsByRoom.get(b.venueRoomId) ?? [];
    list.push(b);
    bookingsByRoom.set(b.venueRoomId, list);
  }

  return rooms.map((room) => {
    const roomSessions = sessionsByRoom.get(room.id) ?? [];
    const roomBookings = bookingsByRoom.get(room.id) ?? [];
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
      status: deriveRoomStatus(room, roomSessions, roomBookings, today, todayEnd),
      upcomingSessionsCount: upcoming,
      activeSessionsCount: roomSessions.filter(
        (s) =>
          s.startDate &&
          s.endDate &&
          s.startDate <= todayEnd &&
          s.endDate >= today,
      ).length,
      activeBookingsCount: roomBookings.filter(
        (b) => b.startAt <= todayEnd && b.endAt >= today,
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
