import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import {
  emitVenueRoomSessionPatchNotifications,
  notifyVenueRoomReleased,
  applySessionEquipmentDiff,
  parseReservedEquipmentIds,
  releaseAllSessionEquipment,
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
import { ensureSessionChat, pruneStaleSessionChatParticipants } from '@/lib/session-chat';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';
import { invalidateCatalogSessionsCacheForFormationId } from '@/lib/catalog-public-cache';
import { assertSessionParticipantUserIds } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_eligible-session-learners';

function parseDateInput(v: unknown): Date | null | undefined {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
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
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

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
      const current = await prisma.formationSession.findUnique({
        where: { id: id.trim() },
        select: { formationId: true },
      });
      if (!current) return fail('Session introuvable.', 404);

      const okLearners = await assertSessionParticipantUserIds(
        current.formationId,
        d.participantUserIds,
        { sessionId: id.trim() },
      );
      if (!okLearners.ok) {
        return fail(okLearners.message, 422);
      }
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
        formationId: true,
        startDate: true,
        endDate: true,
        venueRoomId: true,
        reservedEquipmentIds: true,
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

    const previousEquipmentIds = parseReservedEquipmentIds(current.reservedEquipmentIds);

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
        d.moderatorUserId !== undefined ||
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
          ...(d.moderatorUserId !== undefined
            ? { moderatorUserId: d.moderatorUserId === '' ? null : d.moderatorUserId }
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
        const nextIds = new Set(d.participantUserIds);
        const existing = await tx.formationSessionParticipant.findMany({
          where: { sessionId: id.trim() },
          select: { id: true, userId: true },
        });

        for (const row of existing) {
          if (!nextIds.has(row.userId)) {
            await tx.formationSessionParticipant.delete({ where: { id: row.id } });
          }
        }

        for (const userId of d.participantUserIds) {
          await tx.formationSessionParticipant.upsert({
            where: { sessionId_userId: { sessionId: id.trim(), userId } },
            create: { sessionId: id.trim(), userId },
            update: {},
          });
        }
      }

      return tx.formationSession.findUniqueOrThrow({
        where: { id: id.trim() },
        include: formationSessionRelationInclude,
      });
    });

    const item = await serializeFormationSessionRow(updated as SessionRowPayload);

    const sideEffectWarnings: string[] = [];

    if (d.reservedEquipmentIds !== undefined) {
      try {
        await applySessionEquipmentDiff(
          prisma,
          id.trim(),
          previousEquipmentIds,
          d.reservedEquipmentIds,
          { actorUserId: session.user?.id ?? null },
        );
      } catch (equipmentError) {
        console.error('[session PATCH] equipment diff failed', equipmentError);
        const msg =
          equipmentError instanceof Error
            ? equipmentError.message
            : 'Réservation matériel impossible.';
        if (
          equipmentError instanceof Error &&
          (msg.includes('indisponible') ||
            msg.includes('déjà affecté') ||
            msg.includes('introuvable'))
        ) {
          return fail(msg, 422);
        }
        sideEffectWarnings.push(msg);
      }
    }

    const chatOptions =
      d.moderatorUserId !== undefined
        ? { moderatorUserId: d.moderatorUserId === '' ? null : d.moderatorUserId }
        : undefined;

    try {
      await ensureSessionChat(prisma, id.trim(), chatOptions);
      if (d.participantUserIds !== undefined || d.trainerUserId !== undefined) {
        await pruneStaleSessionChatParticipants(prisma, id.trim());
      }
    } catch (chatError) {
      console.error('[session PATCH] chat/team sync failed', chatError);
      sideEffectWarnings.push(
        chatError instanceof Error
          ? chatError.message
          : 'Synchronisation chat / équipe impossible.',
      );
    }

    const venuePatchRequested =
      d.venueRoomId !== undefined || d.startDate !== undefined || d.endDate !== undefined;

    if (venuePatchRequested) {
      try {
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
      } catch (notifyError) {
        console.error('[session PATCH] venue notifications failed', notifyError);
        sideEffectWarnings.push(
          notifyError instanceof Error
            ? notifyError.message
            : 'Notification salle impossible.',
        );
      }
    }

    void invalidateCatalogSessionsCacheForFormationId(prisma, current.formationId).catch((e) => {
      console.error('[session PATCH] cache invalidation', e);
    });

    return ok(sideEffectWarnings.length > 0 ? { item, warnings: sideEffectWarnings } : { item });
  } catch (error) {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? (error as { code?: string }).code
        : '';
    if (code === 'P2025') return fail('Session introuvable.', 404);
    if (error instanceof Error && error.message.includes('Salle déjà réservée')) {
      return fail(error.message, 422);
    }
    if (error instanceof Error && (error.message.includes('indisponible') || error.message.includes('déjà affecté') || error.message.includes('réservée pour'))) {
      return fail(error.message, 422);
    }
    console.error('[session PATCH] unexpected error', error);
    const devMessage =
      process.env.NODE_ENV === 'development' && error instanceof Error
        ? error.message
        : 'Impossible de mettre à jour la session.';
    return fail(devMessage, 500, error);
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
        formationId: true,
        venueRoomId: true,
        reservedEquipmentIds: true,
        venueRoom: { select: { id: true, name: true } },
      },
    });
    if (!existing) return fail('Session introuvable ou formation hors catalogue actif.', 404);

    await releaseAllSessionEquipment(prisma, id.trim(), {
      actorUserId: session.user?.id ?? null,
    });

    await prisma.formationSession.delete({ where: { id: id.trim() } });

    void invalidateCatalogSessionsCacheForFormationId(prisma, existing.formationId).catch((e) => {
      console.error('[session DELETE] cache invalidation', e);
    });

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
