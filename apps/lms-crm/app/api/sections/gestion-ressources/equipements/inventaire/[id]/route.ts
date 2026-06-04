import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@repo/storage';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id },
      include: {
        assignedSite: true,
        _count: {
          select: {
            maintenanceItems: true,
            stockMovements: true,
            sessions: true,
          },
        },
      },
    });

    if (!equipment) return fail('Équipement non trouvé', 404);

    // Calculer les stats globales pour ce modèle (même libellé)
    const statusStats = await prisma.equipment.findMany({
      where: { label: equipment.label },
      select: { status: true }
    });

    const stats = {
      currentStock: statusStats.filter(s => s.status === 'AVAILABLE').length,
      totalIn: statusStats.filter(s => s.status === 'IN_USE').length,
      totalOut: statusStats.filter(s => s.status === 'MAINTENANCE').length,
    };

    // Merge avatar back from metadata for the response
    if (equipment.metadata && (equipment.metadata as any).avatar) {
      (equipment as any).avatar = (equipment.metadata as any).avatar;
    }

    return ok({
      ...equipment,
      stockStats: stats
    });
  } catch (error) {
    return fail('Impossible de récupérer l’équipement.', 500, error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return fail('ID manquant', 400);

  try {
    const currentEquipment = await prisma.equipment.findUnique({
      where: { id },
      select: { metadata: true }
    });

    if (!currentEquipment) return fail('Équipement non trouvé', 404);

    const contentType = request.headers.get('content-type') || '';
    let updateData: any = {};
    let finalMetadata = { ...(currentEquipment.metadata as any || {}) };

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const label = formData.get('label');
      const type = formData.get('type');
      const status = formData.get('status');
      const assignedSiteId = formData.get('assignedSiteId');
      const metadataStr = formData.get('metadata');
      const avatar = formData.get('avatar');

      if (label !== null) updateData.label = label as string;
      if (type !== null) updateData.type = type as string;
      if (status !== null) updateData.status = status as any;
      
      if (assignedSiteId !== null) {
        if (assignedSiteId === 'null' || !assignedSiteId) {
          updateData.assignedSite = { disconnect: true };
        } else {
          updateData.assignedSite = { connect: { id: assignedSiteId as string } };
        }
      }

      if (metadataStr) {
        try {
          const sentMetadata = JSON.parse(metadataStr as string);
          finalMetadata = { ...finalMetadata, ...sentMetadata };
        } catch {
          // Ignore
        }
      }

      if (avatar && avatar instanceof File) {
        try {
          const uploaded = await uploadFile({
            file: avatar,
            module: 'gestion-ressources',
            entityType: 'equipment',
            entityId: id,
            visibility: 'public',
          });
          finalMetadata.avatar = uploaded.url;
        } catch (uploadError) {
          console.error('[AVATAR_UPLOAD_ERROR]', uploadError);
          // Continue without avatar update if storage fails
        }
      }
    } else {
      const body = await request.json();
      const { label, type, status, assignedSiteId, metadata, avatar } = body;

      if (label !== undefined) updateData.label = label;
      if (type !== undefined) updateData.type = type;
      if (status !== undefined) updateData.status = status;
      
      if (assignedSiteId !== undefined) {
        if (assignedSiteId === 'null' || !assignedSiteId) {
          updateData.assignedSite = { disconnect: true };
        } else {
          updateData.assignedSite = { connect: { id: assignedSiteId } };
        }
      }

      if (metadata !== undefined) {
        finalMetadata = { ...finalMetadata, ...metadata };
      }
      
      if (avatar !== undefined) {
        finalMetadata.avatar = avatar;
      }
    }

    updateData.metadata = finalMetadata;

    const prismaData = { ...updateData };
    delete (prismaData as any).avatar;

    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: prismaData,
      include: { assignedSite: true },
    });

    // Merge avatar back from metadata for the response
    if (updatedEquipment.metadata && (updatedEquipment.metadata as any).avatar) {
      (updatedEquipment as any).avatar = (updatedEquipment.metadata as any).avatar;
    }

    return ok(updatedEquipment);
  } catch (error) {
    return fail('Impossible de mettre à jour l’équipement.', 500, error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const { id } = await params;

  try {
    await prisma.equipment.delete({
      where: { id },
    });

    return ok({ message: 'Équipement supprimé avec succès' });
  } catch (error) {
    return fail('Impossible de supprimer l’équipement.', 500, error);
  }
}
