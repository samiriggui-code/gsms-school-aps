import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@repo/database';
import {
  applySessionEquipmentDiff,
  buildSessionVenueNotificationContext,
  notifyVenueRoomReserved,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { FormationSessionCreateSchema } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/forms/session-crud-schema';
import {
  serializeFormationSessionRows,
  type SessionRowPayload,
} from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_serialize-row';
import { formationSessionRelationInclude } from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_session-include';
import {
  assertVenueRoomAvailableForRange,
  assertVenueRoomIdExists,
} from '@/app/api/sections/gestion-academique/vie-scolaire/sessions/_venue-room-assert';
import { sessionKindDerivedFromFormationParcours } from '@/app/(protected)/gestion-academique/vie-scolaire/sessions/lib/session-parcours-exam';
import { ensureSessionStoragePrefix, provisionStoragePrefixSafe } from '@/lib/entity-storage';
import { ensureSessionChat } from '@/lib/session-chat';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';

function parseDateInput(v: unknown): Date | null {
  if (v === undefined || v === null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Élèves et candidats actifs (parcours CRM catalogue). */
async function assertLearnerUserIds(ids: string[]): Promise<boolean> {
  if (ids.length === 0) return true;
  const roles = await prisma.userRole.findMany({
    where: { slug: { in: ['eleve', 'candidat'] }, isTrashed: false },
    select: { id: true },
  });
  if (!roles.length) return false;
  const roleIds = roles.map((r) => r.id);
  const valid = await prisma.user.count({
    where: {
      id: { in: ids },
      roleId: { in: roleIds },
      status: 'ACTIVE',
      isTrashed: false,
    },
  });
  return valid === ids.length;
}

async function assertTrainerUserId(userId: string | null | undefined): Promise<boolean> {
  if (userId == null || userId === '') return true;
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

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const slug = request.nextUrl.searchParams.get('formationSlug')?.trim();

  try {
    const baseWhere =
      slug != null && slug !== ''
        ? {
            formation: {
              slug,
              catalogOffer: { catalogStatus: 'ACTIVE' as const },
            },
          }
        : { formation: { catalogOffer: { catalogStatus: 'ACTIVE' as const } } };

    const rows = await prisma.formationSession.findMany({
      where: baseWhere,
      include: formationSessionRelationInclude,
      orderBy: [{ formationId: 'asc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    const items = await serializeFormationSessionRows(rows as SessionRowPayload[]);
    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger les sessions.', 500, error);
  }
}

export async function POST(request: NextRequest) {
  const sessionAuth = await getServerSession(authOptions);
  if (!sessionAuth) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(sessionAuth, CRM_PERMISSION.academiqueEdit)) {
    return fail('Accès refusé — permission académique requise.', 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return fail('Corps JSON invalide.', 400);
  }

  const parsed = FormationSessionCreateSchema.safeParse(json);
  if (!parsed.success) {
    return fail('Validation session.', 422, parsed.error.flatten());
  }

  const d = parsed.data;
  const participantIds = d.participantUserIds ?? [];
  const equipmentIds = d.reservedEquipmentIds ?? [];

  try {
    const offer = await prisma.formationCatalogOffer.findUnique({
      where: { formationId: d.formationId },
      include: { formation: { select: { parcoursSpecialite: true } } },
    });
    if (!offer || offer.catalogStatus !== 'ACTIVE' || !offer.formation) {
      return fail('Seules les formations publiées au catalogue peuvent recevoir une session.', 400);
    }

    const sessionKindStored = sessionKindDerivedFromFormationParcours(
      offer.formation.parcoursSpecialite,
    );

    const okLearners = await assertLearnerUserIds(participantIds);
    if (!okLearners)
      return fail('Un ou plusieurs utilisateurs ne sont pas des apprenants actifs (élève ou candidat).', 422);

    const okTrainer = await assertTrainerUserId(d.trainerUserId ?? undefined);
    if (!okTrainer) return fail('Formateur invalide ou compte non actif.', 422);

    const okEquip = await assertEquipmentIds(equipmentIds);
    if (!okEquip) return fail('Un ou plusieurs équipements sont introuvables.', 422);

    const venueRoomId = d.venueRoomId === undefined ? null : d.venueRoomId;
    const okVenue = await assertVenueRoomIdExists(prisma, venueRoomId);
    if (!okVenue) return fail('Salle inconnue ou inactive.', 422);

    const startDateEff = parseDateInput(d.startDate);
    const endDateEff = parseDateInput(d.endDate);
    await assertVenueRoomAvailableForRange(prisma, {
      venueRoomId,
      startDate: startDateEff === undefined ? null : startDateEff,
      endDate: endDateEff === undefined ? null : endDateEff,
    });

    const created = await prisma.$transaction(async (tx) => {
      const jsonEquip = equipmentIds.length > 0 ? equipmentIds : [];
      const row = await tx.formationSession.create({
        data: {
          formationId: d.formationId,
          dateDisplayLabel: d.dateDisplayLabel,
          location: d.location,
          startDate: parseDateInput(d.startDate),
          endDate: parseDateInput(d.endDate),
          registrationClosesAt: parseDateInput(d.registrationClosesAt),
          examDate: parseDateInput(d.examDate),
          traineesMin: d.traineesMin ?? undefined,
          traineesMax: d.traineesMax ?? undefined,
          trainerUserId: d.trainerUserId ?? undefined,
          moderatorUserId: d.moderatorUserId ?? undefined,
          venueRoomId: venueRoomId ?? null,
          reservedEquipmentIds: jsonEquip as unknown as Prisma.InputJsonValue,
          sessionKind: sessionKindStored,
          sessionSubtitle: d.sessionSubtitle ?? undefined,
          venueBrandPrefix: d.venueBrandPrefix ?? undefined,
          bookingEnabled: d.bookingEnabled ?? false,
          bookingUrl: d.bookingUrl ?? undefined,
          sortOrder: d.sortOrder ?? 0,
        },
      });

      if (participantIds.length > 0) {
        await tx.formationSessionParticipant.createMany({
          data: participantIds.map((userId) => ({ sessionId: row.id, userId })),
          skipDuplicates: true,
        });
      }

      return tx.formationSession.findUniqueOrThrow({
        where: { id: row.id },
        include: formationSessionRelationInclude,
      });
    });

    void provisionStoragePrefixSafe(`session:${created.id}`, () =>
      ensureSessionStoragePrefix(created.id),
    );

    void ensureSessionChat(prisma, created.id, {
      moderatorUserId: d.moderatorUserId ?? null,
    });

    const [item] = await serializeFormationSessionRows([created as SessionRowPayload]);

    if (venueRoomId) {
      const ctx = await buildSessionVenueNotificationContext(prisma, created.id);
      if (ctx) {
        await notifyVenueRoomReserved(prisma, {
          ...ctx,
          actorUserId: sessionAuth.user?.id ?? null,
        });
      }
    }

    if (equipmentIds.length > 0) {
      await applySessionEquipmentDiff(prisma, created.id, [], equipmentIds, {
        actorUserId: sessionAuth.user?.id ?? null,
      });
    }

    return ok({ item }, 201);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Salle déjà réservée')) {
      return fail(error.message, 422);
    }
    if (error instanceof Error && (error.message.includes('indisponible') || error.message.includes('déjà affecté'))) {
      return fail(error.message, 422);
    }
    return fail('Impossible de créer la session.', 500, error);
  }
}
