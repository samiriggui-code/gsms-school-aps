import { NextRequest } from 'next/server';
import { Prisma } from '@repo/database';
import {
  notifyVenueRoomDeactivated,
  notifyVenueRoomReactivated,
} from '@repo/api-core';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';
import {
  requireGestionRessourcesEdit,
  requireGestionRessourcesView,
} from '../../../_lib/require-gestion-ressources-auth';
import { serializeVenueRoomById } from '../_lib/serialize-rooms';

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const item = await serializeVenueRoomById(id);
    if (!item) return fail('Salle introuvable.', 404);
    return ok({ item });
  } catch (error) {
    return fail('Impossible de charger la salle.', 500, error);
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const existing = await prisma.formationVenueRoom.findUnique({ where: { id } });
    if (!existing) return fail('Salle introuvable.', 404);

    const data: Prisma.FormationVenueRoomUpdateInput = {};
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const name = formData.get('name');
      const shortCode = formData.get('shortCode');
      const capacity = formData.get('capacity');
      const floorLabel = formData.get('floorLabel');
      const isActive = formData.get('isActive');
      const sortOrder = formData.get('sortOrder');
      const clearImage = formData.get('clearImage');
      const image = formData.get('image');

      if (name !== null) {
        const trimmed = String(name).trim();
        if (!trimmed) return fail('Le nom ne peut pas être vide.', 400);
        data.name = trimmed;
      }
      if (shortCode !== null) {
        data.shortCode = String(shortCode).trim() || null;
      }
      if (capacity !== null) {
        const raw = String(capacity);
        data.capacity = raw === '' ? null : Number(raw);
      }
      if (floorLabel !== null) {
        data.floorLabel = String(floorLabel).trim() || null;
      }
      if (isActive !== null) data.isActive = String(isActive) === 'true';
      if (sortOrder !== null) data.sortOrder = Number(sortOrder) || 0;

      if (clearImage === 'true') {
        data.imageUrl = null;
      } else if (image instanceof File && image.size > 0) {
        const uploaded = await uploadFile({
          file: image,
          module: 'gestion-ressources',
          entityType: 'venue-room',
          entityId: id,
          visibility: 'public',
        });
        data.imageUrl = uploaded.url;
      }
    } else {
      const body = await request.json();

      if (body.name !== undefined) {
        const name = String(body.name).trim();
        if (!name) return fail('Le nom ne peut pas être vide.', 400);
        data.name = name;
      }
      if (body.shortCode !== undefined) {
        data.shortCode = body.shortCode ? String(body.shortCode).trim() : null;
      }
      if (body.capacity !== undefined) {
        data.capacity =
          body.capacity === null || body.capacity === ''
            ? null
            : Number(body.capacity);
      }
      if (body.floorLabel !== undefined) {
        data.floorLabel = body.floorLabel ? String(body.floorLabel).trim() : null;
      }
      if (body.imageUrl !== undefined) {
        data.imageUrl = body.imageUrl ? String(body.imageUrl).trim() : null;
      }
      if (body.isActive !== undefined) data.isActive = Boolean(body.isActive);
      if (body.sortOrder !== undefined) data.sortOrder = Number(body.sortOrder) || 0;
    }

    const isActiveChanging =
      data.isActive !== undefined && data.isActive !== existing.isActive;

    await prisma.formationVenueRoom.update({ where: { id }, data });
    const item = await serializeVenueRoomById(id);

    if (isActiveChanging && item) {
      const actorUserId = auth.session.user?.id ?? null;
      if (item.isActive) {
        await notifyVenueRoomReactivated(prisma, {
          roomId: item.id,
          roomName: item.name,
          actorUserId,
        });
      } else {
        await notifyVenueRoomDeactivated(prisma, {
          roomId: item.id,
          roomName: item.name,
          actorUserId,
          reason: 'toggle',
        });
      }
    }

    return ok({ item });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return fail('Ce code court de salle existe déjà.', 409);
    }
    return fail('Impossible de mettre à jour la salle.', 500, error);
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const auth = await requireGestionRessourcesEdit();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  try {
    const linked = await prisma.formationSession.count({
      where: { venueRoomId: id },
    });
    if (linked > 0) {
      const existing = await prisma.formationVenueRoom.findUnique({
        where: { id },
        select: { isActive: true, name: true },
      });
      const row = await prisma.formationVenueRoom.update({
        where: { id },
        data: { isActive: false },
      });
      if (existing?.isActive !== false) {
        await notifyVenueRoomDeactivated(prisma, {
          roomId: row.id,
          roomName: row.name,
          actorUserId: auth.session.user?.id ?? null,
          reason: 'linked_sessions',
        });
      }
      return ok({
        item: row,
        deactivated: true,
        message: 'Salle désactivée (sessions liées).',
      });
    }

    await prisma.formationVenueRoom.delete({ where: { id } });
    return ok({ deleted: true });
  } catch (error) {
    return fail('Impossible de supprimer la salle.', 500, error);
  }
}
