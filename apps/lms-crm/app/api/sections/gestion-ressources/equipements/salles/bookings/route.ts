import { NextRequest } from 'next/server';
import type { VenueRoomBookingKind } from '@repo/database';
import { assertVenueRoomSlotAvailable, notifyVenueRoomStaffBookingCreated } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';

const BOOKING_KINDS: VenueRoomBookingKind[] = ['STAFF_MEETING', 'INFO_MEETING', 'OTHER'];

function parseKind(value: unknown): VenueRoomBookingKind {
  const raw = String(value ?? 'STAFF_MEETING').toUpperCase();
  return BOOKING_KINDS.includes(raw as VenueRoomBookingKind)
    ? (raw as VenueRoomBookingKind)
    : 'STAFF_MEETING';
}

function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function serializeBooking(row: {
  id: string;
  venueRoomId: string;
  title: string;
  kind: string;
  status: string;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  organizerUserId: string | null;
  venueRoom: { id: string; name: string; shortCode: string | null };
  organizer: {
    firstName: string | null;
    lastName: string | null;
    name: string | null;
    email: string;
  } | null;
}) {
  return {
    id: row.id,
    venueRoomId: row.venueRoomId,
    roomName: row.venueRoom.name,
    roomShortCode: row.venueRoom.shortCode,
    title: row.title,
    kind: row.kind,
    status: row.status,
    startAt: row.startAt.toISOString(),
    endAt: row.endAt.toISOString(),
    notes: row.notes,
    organizerUserId: row.organizerUserId,
    organizerName:
      [row.organizer?.firstName, row.organizer?.lastName].filter(Boolean).join(' ').trim() ||
      row.organizer?.name ||
      row.organizer?.email ||
      null,
  };
}

/** Réservations ponctuelles de salles (réunions staff, etc.). */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const from = parseDate(url.searchParams.get('from'));
  const to = parseDate(url.searchParams.get('to'));
  const roomId = url.searchParams.get('roomId');

  try {
    const rows = await prisma.venueRoomBooking.findMany({
      where: {
        status: 'ACTIVE',
        ...(roomId ? { venueRoomId: roomId } : {}),
        ...(from && to
          ? { startAt: { lte: to }, endAt: { gte: from } }
          : {}),
      },
      include: {
        venueRoom: { select: { id: true, name: true, shortCode: true } },
        organizer: {
          select: { firstName: true, lastName: true, name: true, email: true },
        },
      },
      orderBy: { startAt: 'asc' },
    });
    return ok(rows.map(serializeBooking));
  } catch (error) {
    return fail('Impossible de charger les réservations.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const venueRoomId = String(body.venueRoomId ?? '').trim();
    const title = String(body.title ?? '').trim();
    const startAt = parseDate(body.startAt);
    const endAt = parseDate(body.endAt);

    if (!venueRoomId) return fail('Salle requise.', 400);
    if (title.length < 2) return fail('Titre requis.', 400);
    if (!startAt || !endAt) return fail('Dates de début et fin requises.', 400);

    const room = await prisma.formationVenueRoom.findFirst({
      where: { id: venueRoomId, isActive: true },
    });
    if (!room) return fail('Salle inconnue ou inactive.', 404);

    await assertVenueRoomSlotAvailable(prisma, {
      venueRoomId,
      start: startAt,
      end: endAt,
    });

    const row = await prisma.venueRoomBooking.create({
      data: {
        venueRoomId,
        title,
        kind: parseKind(body.kind),
        startAt,
        endAt,
        notes: body.notes ? String(body.notes).trim() : null,
        organizerUserId: body.organizerUserId
          ? String(body.organizerUserId).trim()
          : auth.userId ?? null,
      },
      include: {
        venueRoom: { select: { id: true, name: true, shortCode: true } },
        organizer: {
          select: { firstName: true, lastName: true, name: true, email: true },
        },
      },
    });

    await notifyVenueRoomStaffBookingCreated(prisma, {
      bookingId: row.id,
      roomId: row.venueRoomId,
      roomName: row.venueRoom.name,
      title: row.title,
      kind: row.kind,
      startAt: row.startAt,
      endAt: row.endAt,
      actorUserId: auth.userId ?? null,
    });

    return ok(serializeBooking(row), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Création impossible.';
    return fail(message, message.includes('réservée') ? 422 : 500, error);
  }
}
