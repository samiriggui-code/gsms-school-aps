import { NextRequest } from 'next/server';
import { parseReservedEquipmentIds } from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { getEquipmentCatalogKey } from '@/lib/equipment-catalog-taxonomy';
import {
  buildSessionAndExamMobileRequirements,
  dispatchGuideSummary,
  evaluateDispatchLines,
} from '@/lib/equipment-dispatch-guide';
import { requireGestionRessourcesView } from '@/app/api/sections/gestion-ressources/_lib/require-gestion-ressources-auth';

/** Guide matériel mobile session (réservation avec dates début/fin). */
export async function GET(request: NextRequest) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const formationId = url.searchParams.get('formationId')?.trim();
  const venueRoomId = url.searchParams.get('venueRoomId')?.trim() || null;
  const traineesMax = Number(url.searchParams.get('traineesMax') || 0) || null;
  const sessionKind = url.searchParams.get('sessionKind')?.trim() || null;
  const hasExamDate = url.searchParams.get('hasExamDate') === '1';
  const examVenueRoomId = url.searchParams.get('examVenueRoomId')?.trim() || null;
  const startAt = url.searchParams.get('startAt')?.trim();
  const endAt = url.searchParams.get('endAt')?.trim();
  const selectedIdsRaw = url.searchParams.get('selectedEquipmentIds');
  const selectedIds = selectedIdsRaw
    ? selectedIdsRaw.split(',').map((s) => s.trim()).filter(Boolean)
    : [];

  if (!formationId) return fail('formationId requis.', 400);

  try {
    const formation = await prisma.formation.findUnique({
      where: { id: formationId },
      select: { id: true, name: true, track: true },
    });
    if (!formation) return fail('Formation introuvable.', 404);

    const equipment =
      selectedIds.length > 0
        ? await prisma.equipment.findMany({
            where: { id: { in: selectedIds } },
            select: { id: true, label: true, metadata: true, status: true },
          })
        : [];

    const assignedByCatalogKey = new Map<string, number>();
    for (const eq of equipment) {
      const key = getEquipmentCatalogKey(eq.metadata, eq.label);
      assignedByCatalogKey.set(key, (assignedByCatalogKey.get(key) ?? 0) + 1);
    }

    const allAvailable = await prisma.equipment.findMany({
      where: {
        status: 'AVAILABLE',
        roomFixedAssignment: null,
      },
      select: { metadata: true, label: true, id: true },
    });

    let availableGlobalByCatalogKey = new Map<string, number>();
    for (const eq of allAvailable) {
      const key = getEquipmentCatalogKey(eq.metadata, eq.label);
      availableGlobalByCatalogKey.set(key, (availableGlobalByCatalogKey.get(key) ?? 0) + 1);
    }

    if (startAt && endAt) {
      const rangeStart = new Date(startAt);
      const rangeEnd = new Date(endAt);
      if (!Number.isNaN(rangeStart.getTime()) && !Number.isNaN(rangeEnd.getTime())) {
        const sessions = await prisma.formationSession.findMany({
          where: {
            OR: [{ endDate: null }, { endDate: { gte: rangeStart } }],
          },
          select: { reservedEquipmentIds: true, startDate: true, endDate: true },
        });

        const reservedInRange = new Set<string>();
        for (const s of sessions) {
          if (!s.startDate || !s.endDate) continue;
          if (s.startDate > rangeEnd || s.endDate < rangeStart) continue;
          for (const id of parseReservedEquipmentIds(s.reservedEquipmentIds)) {
            reservedInRange.add(id);
          }
        }

        availableGlobalByCatalogKey = new Map();
        for (const eq of allAvailable) {
          if (reservedInRange.has(eq.id)) continue;
          const key = getEquipmentCatalogKey(eq.metadata, eq.label);
          availableGlobalByCatalogKey.set(key, (availableGlobalByCatalogKey.get(key) ?? 0) + 1);
        }
      }
    }

    const requirements = buildSessionAndExamMobileRequirements({
      track: formation.track,
      traineesMax,
      sessionKind,
      hasVenueRoom: Boolean(venueRoomId),
      hasExamDate,
    });

    const lines = evaluateDispatchLines(requirements, assignedByCatalogKey, availableGlobalByCatalogKey);
    const summary = dispatchGuideSummary(lines);

    let roomName: string | null = null;
    if (venueRoomId) {
      const r = await prisma.formationVenueRoom.findUnique({
        where: { id: venueRoomId },
        select: { name: true },
      });
      roomName = r?.name ?? null;
    }

    let examRoomName: string | null = null;
    if (examVenueRoomId) {
      const er = await prisma.formationVenueRoom.findUnique({
        where: { id: examVenueRoomId },
        select: { name: true },
      });
      examRoomName = er?.name ?? null;
    }

    const periodLabel =
      startAt && endAt
        ? `Réservation mobile du ${new Date(startAt).toLocaleDateString('fr-FR')} au ${new Date(endAt).toLocaleDateString('fr-FR')}`
        : 'Renseignez les dates de session pour vérifier les conflits de stock.';

    const examHint =
      hasExamDate || sessionKind === 'WITH_EXAM'
        ? examRoomName
          ? `Examen en salle « ${examRoomName} » — le PCS / plateau fixe est couvert par l'inventaire salle. Ci-dessous : matériel mobile (magnétomètre, fumigènes…).`
          : 'Examen prévu — assignez une salle PCS (Orion), plateau (Phoenix) ou parcours (Atlas) pour le matériel fixe.'
        : null;

    return ok({
      context: 'SESSION_MOBILE',
      formation: { id: formation.id, name: formation.name, track: formation.track },
      venueRoomId,
      roomName,
      examVenueRoomId,
      examRoomName,
      periodLabel,
      summary,
      lines,
      helpText: [examHint, roomName
        ? `Cours en salle « ${roomName} » — mobilier fixe de la salle de formation.`
        : 'Sans salle assignée, prévoyez aussi le mobilier nécessaire ou assignez une salle équipée.']
        .filter(Boolean)
        .join(' '),
    });
  } catch (error) {
    return fail('Impossible de charger le guide session.', 500, error);
  }
}
