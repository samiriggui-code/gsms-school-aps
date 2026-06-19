import type { PrismaClient } from '@repo/database';
import { dispatchCrmResourceEvent } from './crm-resource-dispatch';
import {
  classifyVenueRoomUsage,
  venueUsageLabelFr,
  type VenueRoomUsageKind,
} from './venue-room-usage';

export type { VenueRoomUsageKind };
export { classifyVenueRoomUsage, venueUsageLabelFr };

const VENUE_ROOMS_HREF = '/gestion-ressources/equipements/salles';

function sessionHref(sessionId: string) {
  return `/gestion-academique/vie-scolaire/sessions?id=${sessionId}`;
}

function formatDateRangeFr(
  start: Date | null | undefined,
  end: Date | null | undefined,
  label?: string | null,
): string {
  if (label?.trim()) return label.trim();
  const fmt = (d: Date) =>
    d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `à partir du ${fmt(start)}`;
  if (end) return `jusqu'au ${fmt(end)}`;
  return 'dates à préciser';
}

async function dispatchVenueRoomEvent(
  prisma: PrismaClient,
  input: {
    eventType: string;
    title: string;
    body: string;
    href?: string | null;
    dedupeKey?: string;
    payload?: Record<string, unknown>;
    createdById?: string | null;
    severity?: 'INFO' | 'WARNING' | 'CRITICAL';
    detailLines?: string[];
    eyebrow?: string;
  },
) {
  await dispatchCrmResourceEvent(prisma, {
    eventType: input.eventType,
    title: input.title,
    body: input.body,
    href: input.href ?? VENUE_ROOMS_HREF,
    dedupeKey: input.dedupeKey,
    payload: {
      ...(input.payload ?? {}),
      ...(input.createdById ? { actorUserId: input.createdById } : {}),
    },
    createdById: input.createdById,
    severity: input.severity,
    detailLines: input.detailLines,
    eyebrow: input.eyebrow ?? 'Salles de formation',
  });
}

export async function notifyVenueRoomDeactivated(
  prisma: PrismaClient,
  args: {
    roomId: string;
    roomName: string;
    actorUserId?: string | null;
    reason?: 'toggle' | 'linked_sessions' | 'delete_fallback';
  },
) {
  const suffix =
    args.reason === 'linked_sessions' ? ' (sessions encore planifiées)' : '';
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.deactivated',
    title: 'Salle désactivée',
    body: `« ${args.roomName} » n'est plus réservable${suffix}.`,
    dedupeKey: `venue-room:${args.roomId}:deactivated:${Date.now()}`,
    payload: { roomId: args.roomId, reason: args.reason ?? 'toggle' },
    createdById: args.actorUserId,
    severity: 'WARNING',
  });
}

export async function notifyVenueRoomReactivated(
  prisma: PrismaClient,
  args: {
    roomId: string;
    roomName: string;
    actorUserId?: string | null;
  },
) {
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.reactivated',
    title: 'Salle disponible',
    body: `« ${args.roomName} » est à nouveau réservable.`,
    dedupeKey: `venue-room:${args.roomId}:reactivated:${Date.now()}`,
    payload: { roomId: args.roomId },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export type SessionVenueContext = {
  sessionId: string;
  roomId: string;
  roomName: string;
  usageKind: VenueRoomUsageKind;
  sessionLabel: string;
  formationName?: string | null;
  startDate?: Date | null;
  endDate?: Date | null;
  dateDisplayLabel?: string | null;
  actorUserId?: string | null;
};

export async function notifyVenueRoomReserved(
  prisma: PrismaClient,
  args: SessionVenueContext,
) {
  const usage = venueUsageLabelFr(args.usageKind);
  const period = formatDateRangeFr(
    args.startDate,
    args.endDate,
    args.dateDisplayLabel,
  );
  const sessionPart = args.formationName
    ? `« ${args.formationName} »`
    : args.sessionLabel;

  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.reserved',
    title: 'Salle occupée',
    body: `« ${args.roomName} » — ${usage} : ${sessionPart} (${period}).`,
    href: sessionHref(args.sessionId),
    dedupeKey: `venue-room:${args.roomId}:session:${args.sessionId}`,
    payload: {
      roomId: args.roomId,
      sessionId: args.sessionId,
      usageKind: args.usageKind,
    },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export async function notifyVenueRoomReleased(
  prisma: PrismaClient,
  args: {
    roomId: string;
    roomName: string;
    sessionId: string;
    actorUserId?: string | null;
  },
) {
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.released',
    title: 'Salle libérée',
    body: `« ${args.roomName} » est de nouveau disponible (réservation retirée).`,
    href: VENUE_ROOMS_HREF,
    dedupeKey: `venue-room:${args.roomId}:released:${args.sessionId}:${Date.now()}`,
    payload: { roomId: args.roomId, sessionId: args.sessionId },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export async function notifyVenueRoomReservationUpdated(
  prisma: PrismaClient,
  args: SessionVenueContext,
) {
  const usage = venueUsageLabelFr(args.usageKind);
  const period = formatDateRangeFr(
    args.startDate,
    args.endDate,
    args.dateDisplayLabel,
  );
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.reservation_updated',
    title: 'Réservation salle modifiée',
    body: `« ${args.roomName} » — ${usage} mis à jour (${period}).`,
    href: sessionHref(args.sessionId),
    dedupeKey: `venue-room:${args.roomId}:session:${args.sessionId}:updated:${Date.now()}`,
    payload: {
      roomId: args.roomId,
      sessionId: args.sessionId,
      usageKind: args.usageKind,
    },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export async function buildSessionVenueNotificationContext(
  prisma: PrismaClient,
  sessionId: string,
): Promise<SessionVenueContext | null> {
  const row = await prisma.formationSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      dateDisplayLabel: true,
      location: true,
      sessionKind: true,
      sessionSubtitle: true,
      startDate: true,
      endDate: true,
      venueRoomId: true,
      venueRoom: { select: { id: true, name: true } },
      formation: { select: { name: true } },
    },
  });
  if (!row?.venueRoomId || !row.venueRoom) return null;

  const usageKind = classifyVenueRoomUsage({
    sessionKind: row.sessionKind,
    sessionSubtitle: row.sessionSubtitle,
    dateDisplayLabel: row.dateDisplayLabel,
    location: row.location,
    formationName: row.formation?.name ?? null,
  });

  return {
    sessionId: row.id,
    roomId: row.venueRoom.id,
    roomName: row.venueRoom.name,
    usageKind,
    sessionLabel: row.dateDisplayLabel || row.sessionSubtitle || 'Session',
    formationName: row.formation?.name ?? null,
    startDate: row.startDate,
    endDate: row.endDate,
    dateDisplayLabel: row.dateDisplayLabel,
  };
}

export async function notifyVenueRoomStaffBookingCreated(
  prisma: PrismaClient,
  args: {
    bookingId: string;
    roomId: string;
    roomName: string;
    title: string;
    kind: string;
    startAt: Date;
    endAt: Date;
    actorUserId?: string | null;
  },
) {
  const kindLabel =
    args.kind === 'STAFF_MEETING'
      ? 'Réunion du personnel'
      : args.kind === 'INFO_MEETING'
        ? 'Réunion d\'information'
        : 'Réservation ponctuelle';
  const period = formatDateRangeFr(args.startAt, args.endAt);

  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.booking_created',
    title: 'Réservation salle — staff',
    body: `« ${args.roomName} » — ${kindLabel} : ${args.title} (${period}).`,
    href: VENUE_ROOMS_HREF,
    dedupeKey: `venue-room:${args.roomId}:booking:${args.bookingId}`,
    payload: {
      roomId: args.roomId,
      bookingId: args.bookingId,
      kind: args.kind,
    },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export async function notifyVenueRoomStaffBookingCancelled(
  prisma: PrismaClient,
  args: {
    bookingId: string;
    roomId: string;
    roomName: string;
    title: string;
    actorUserId?: string | null;
  },
) {
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.booking_cancelled',
    title: 'Réservation salle annulée',
    body: `« ${args.roomName} » — « ${args.title} » a été annulée.`,
    href: VENUE_ROOMS_HREF,
    dedupeKey: `venue-room:${args.roomId}:booking-cancel:${args.bookingId}:${Date.now()}`,
    payload: { roomId: args.roomId, bookingId: args.bookingId },
    createdById: args.actorUserId,
    severity: 'INFO',
  });
}

export async function notifyVenueRoomSessionEnded(
  prisma: PrismaClient,
  args: {
    sessionId: string;
    roomId: string;
    roomName: string;
    sessionLabel: string;
    formationName?: string | null;
  },
) {
  const label = args.formationName || args.sessionLabel;
  await dispatchVenueRoomEvent(prisma, {
    eventType: 'venue.room.session_ended',
    title: 'Session terminée — salle disponible',
    body: `« ${args.roomName} » est libre après la fin de « ${label} ».`,
    href: VENUE_ROOMS_HREF,
    dedupeKey: `venue-room:${args.roomId}:session-ended:${args.sessionId}`,
    payload: { roomId: args.roomId, sessionId: args.sessionId },
    severity: 'INFO',
    detailLines: [`Session : ${label}`],
    eyebrow: 'Salles — fin de session',
  });
}

/** Compare avant/après PATCH session et émet les alertes salle adaptées. */
export async function emitVenueRoomSessionPatchNotifications(
  prisma: PrismaClient,
  args: {
    sessionId: string;
    actorUserId?: string | null;
    before: {
      venueRoomId: string | null;
      startDate: Date | null;
      endDate: Date | null;
    };
    afterVenueRoomId: string | null;
    afterStart: Date | null;
    afterEnd: Date | null;
    datesOrRoomChanged: boolean;
  },
) {
  const { sessionId, actorUserId, before, afterVenueRoomId, afterStart, afterEnd } =
    args;

  const oldRoomId = before.venueRoomId;
  const newRoomId = afterVenueRoomId;

  if (oldRoomId && oldRoomId !== newRoomId) {
    const oldRoom = await prisma.formationVenueRoom.findUnique({
      where: { id: oldRoomId },
      select: { id: true, name: true },
    });
    if (oldRoom) {
      await notifyVenueRoomReleased(prisma, {
        roomId: oldRoom.id,
        roomName: oldRoom.name,
        sessionId,
        actorUserId,
      });
    }
  }

  if (!newRoomId) return;

  const ctx = await buildSessionVenueNotificationContext(prisma, sessionId);
  if (!ctx) return;

  const enriched = { ...ctx, actorUserId };

  if (!oldRoomId || oldRoomId !== newRoomId) {
    await notifyVenueRoomReserved(prisma, enriched);
    return;
  }

  const datesChanged =
    before.startDate?.getTime() !== afterStart?.getTime() ||
    before.endDate?.getTime() !== afterEnd?.getTime();

  if (datesChanged || args.datesOrRoomChanged) {
    await notifyVenueRoomReservationUpdated(prisma, enriched);
  }
}
