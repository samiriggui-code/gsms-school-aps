import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import {
  emitVenueRoomSessionPatchNotifications,
  notifyVenueRoomReleased,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FormationSessionPatchSchema } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/forms/session-crud-schema';
import {
  serializeFormationSessionRow,
  type SessionRowPayload,
} from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_serialize-row';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import {
  assertVenueRoomAvailableForRange,
  assertVenueRoomIdExists,
} from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_venue-room-assert';
import { sessionKindDerivedFromFormationParcours } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';

function parseDateInput(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function assertEleveUserIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const role = await prisma.userRole.findFirst({
    where: { slug: 'eleve', isTrashed: false },
  });
  if (!role) return false;
  const valid = await prisma.user.count({
    where: {
      id: { in: ids },
      roleId: role.id,
      status: 'ACTIVE',
      isTrashed: false,
    },
  });
  return valid === ids.length;
}

async function assertTrainerUserId(userId: string | null | undefined): Promise<boolean> {
  if (userId === undefined) return true;
  if (userId === null || userId === '') return true;
  const role = await prisma.userRole.findFirst({
    where: { slug: 'formateur', isTrashed: false },
  });
  if (!role) return false;
  const n = await prisma.user.count({
    where: {
      id: userId,
      roleId: role.id,
      status: 'ACTIVE',
      isTrashed: false,
    },
  });
  return n === 1;
}

async function assertEquipmentIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const n = await prisma.equipment.count({
    where: { id: { in: ids } },
  });
  return n === ids.length;
}

async function sessionInActiveCatalog(sessionId: string) {
  return prisma.formationSession.findFirst({
    where: {
      id: sessionId,
      formation: { catalogOffer: { catalogStatus: 'ACTIVE' } },
    },
    select: { id: true },
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  if (!id?.trim()) return fail('Identifiant session manquant.', 400);

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = FormationSessionPatchSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation session.', 422, parsed.error.flatten());
  }

  const d = parsed.data;

  try {
    const exists = await sessionInActiveCatalog(id.trim());
    if (!exists) return fail('Session introuvable ou formation hors catalogue actif.', 404);

    if (d.participantUserIds !== undefined) {
      const okEleves = await assertEleveUserIds(d.participantUserIds);
      if (!okEleves) return fail('Un ou plusieurs utilisateurs ne sont pas des élèves actifs.', 422);
    }

    const normalizedTrainer =
      d.trainerUserId === ''
        ? null
        : d.trainerUserId === undefined
          ? undefined
          : d.trainerUserId;

    if (normalizedTrainer !== undefined && normalizedTrainer !== null) {
      const okTrainer = await assertTrainerUserId(normalizedTrainer);
      if (!okTrainer) return fail('Formateur invalide ou compte non actif.', 422);
    }

    if (d.reservedEquipmentIds !== undefined) {
      const okEquip = await assertEquipmentIds(d.reservedEquipmentIds);
      if (!okEquip) return fail('Un ou plusieurs équipements sont introuvables.', 422);
    }

    const current = await prisma.formationSession.findUnique({
      where: { id: id.trim() },
      select: {
        startDate: true,
        endDate: true,
        venueRoomId: true,
        venueRoom: { select: { id: true, name: true } },
      },
    });
    if (!current) return fail('Session introuvable.', 404);

    const nextVenueRoomId =
      d.venueRoomId !== undefined ? d.venueRoomId : current.venueRoomId;
    const nextStart =
      d.startDate !== undefined ? parseDateInput(d.startDate) ?? null : current.startDate;
    const nextEnd = d.endDate !== undefined ? parseDateInput(d.endDate) ?? null : current.endDate;

    if (nextVenueRoomId != null && nextVenueRoomId !== '') {
      const okVenue = await assertVenueRoomIdExists(prisma, nextVenueRoomId);
      if (!okVenue) return fail('Salle inconnue ou inactive.', 422);
    }

    try {
      await assertVenueRoomAvailableForRange(prisma, {
        venueRoomId: nextVenueRoomId,
        startDate: nextStart,
        endDate: nextEnd,
        excludeSessionId: id.trim(),
      });
    } catch (e) {
      if (e instanceof Error) return fail(e.message, 422);
      throw e;
    }

    const updated = await prisma.$transaction(async (tx) => {
      const hasScalarPatch =
        d.dateDisplayLabel !== undefined ||
        d.location !== undefined ||
        d.startDate !== undefined ||
        d.endDate !== undefined ||
        d.registrationClosesAt !== undefined ||
        d.examDate !== undefined ||
        d.traineesMin !== undefined ||
        d.traineesMax !== undefined ||
        d.trainerUserId !== undefined ||
        d.reservedEquipmentIds !== undefined ||
        d.venueRoomId !== undefined ||
        d.sessionSubtitle !== undefined ||
        d.venueBrandPrefix !== undefined ||
        d.bookingEnabled !== undefined ||
        d.bookingUrl !== undefined ||
        d.sortOrder !== undefined;

      if (hasScalarPatch) {
        const linked = await tx.formationSession.findUnique({
          where: { id: id.trim() },
          select: { sessionKind: true, formation: { select: { parcoursSpecialite: true } } },
        });
        if (!linked) throw new Error('Session introuvable.');
        const sessionKindCoerced =
          linked.sessionKind === 'OTHER'
            ? ('OTHER' as const)
            : sessionKindDerivedFromFormationParcours(linked.formation.parcoursSpecialite);

        const patchData: Prisma.FormationSessionUpdateInput = {
          ...(d.dateDisplayLabel !== undefined ? { dateDisplayLabel: d.dateDisplayLabel } : {}),
          ...(d.location !== undefined ? { location: d.location } : {}),
          ...(d.startDate !== undefined ? { startDate: parseDateInput(d.startDate) } : {}),
          ...(d.endDate !== undefined ? { endDate: parseDateInput(d.endDate) } : {}),
          ...(d.registrationClosesAt !== undefined
            ? { registrationClosesAt: parseDateInput(d.registrationClosesAt) }
            : {}),
          ...(d.examDate !== undefined ? { examDate: parseDateInput(d.examDate) } : {}),
          ...(d.traineesMin !== undefined ? { traineesMin: d.traineesMin } : {}),
          ...(d.traineesMax !== undefined ? { traineesMax: d.traineesMax } : {}),
          ...(normalizedTrainer !== undefined
            ? { trainerUserId: normalizedTrainer === null ? null : normalizedTrainer }
            : {}),
          ...(d.reservedEquipmentIds !== undefined
            ? {
                reservedEquipmentIds: d.reservedEquipmentIds as unknown as Prisma.InputJsonValue,
              }
            : {}),
          ...(d.venueRoomId !== undefined ? { venueRoomId: d.venueRoomId } : {}),
          sessionKind: sessionKindCoerced,
          ...(d.sessionSubtitle !== undefined ? { sessionSubtitle: d.sessionSubtitle } : {}),
          ...(d.venueBrandPrefix !== undefined ? { venueBrandPrefix: d.venueBrandPrefix } : {}),
          ...(d.bookingEnabled !== undefined ? { bookingEnabled: d.bookingEnabled } : {}),
          ...(d.bookingUrl !== undefined ? { bookingUrl: d.bookingUrl } : {}),
          ...(d.sortOrder !== undefined ? { sortOrder: d.sortOrder } : {}),
        };
        await tx.formationSession.update({
          where: { id: id.trim() },
          data: patchData,
        });
      }

      if (d.participantUserIds !== undefined) {
        await tx.formationSessionParticipant.deleteMany({
          where: { sessionId: id.trim() },
        });
        if (d.participantUserIds.length > 0) {
          await tx.formationSessionParticipant.createMany({
            data: d.participantUserIds.map((userId) => ({
              sessionId: id.trim(),
              userId,
            })),
          });
        }
      }

      return tx.formationSession.findUniqueOrThrow({
        where: { id: id.trim() },
        include: formationSessionRelationInclude,
      });
    });

    const item = await serializeFormationSessionRow(updated as SessionRowPayload);

    const venuePatchRequested =
      d.venueRoomId !== undefined || d.startDate !== undefined || d.endDate !== undefined;

    if (venuePatchRequested) {
      const afterVenueRoomId =
        nextVenueRoomId === '' || nextVenueRoomId === undefined
          ? null
          : nextVenueRoomId;
      await emitVenueRoomSessionPatchNotifications(prisma, {
        sessionId: id.trim(),
        actorUserId: session.user?.id ?? null,
        before: {
          venueRoomId: current.venueRoomId,
          startDate: current.startDate,
          endDate: current.endDate,
        },
        afterVenueRoomId,
        afterStart: nextStart,
        afterEnd: nextEnd,
        datesOrRoomChanged: venuePatchRequested,
      });
    }

    return ok({ item });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Session introuvable.', 404);
    if (error instanceof Error && error.message.includes('Salle déjà réservée')) {
      return fail(error.message, 422);
    }
    return fail('Impossible de mettre à jour la session.', 500, error);
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await context.params;
  if (!id?.trim()) return fail('Identifiant session manquant.', 400);

  try {
    const existing = await prisma.formationSession.findFirst({
      where: {
        id: id.trim(),
        formation: { catalogOffer: { catalogStatus: 'ACTIVE' } },
      },
      select: {
        id: true,
        venueRoomId: true,
        venueRoom: { select: { id: true, name: true } },
      },
    });
    if (!existing) return fail('Session introuvable ou formation hors catalogue actif.', 404);

    await prisma.formationSession.delete({ where: { id: id.trim() } });

    if (existing.venueRoomId && existing.venueRoom) {
      await notifyVenueRoomReleased(prisma, {
        roomId: existing.venueRoom.id,
        roomName: existing.venueRoom.name,
        sessionId: existing.id,
        actorUserId: session.user?.id ?? null,
      });
    }

    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de supprimer la session.', 500, error);
  }
}
