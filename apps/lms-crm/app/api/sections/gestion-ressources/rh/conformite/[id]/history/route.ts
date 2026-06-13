import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { requireGestionRessourcesView } from '../../../../_lib/require-gestion-ressources-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireGestionRessourcesView();
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const url = new URL(request.url);
  const limit = Math.max(1, Math.min(100, Number(url.searchParams.get('limit') || 20)));

  try {
    const logs = await prisma.systemLog.findMany({
      where: {
        entityType: 'User',
        entityId: id,
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const entries = logs.map((log) => ({
      id: log.id,
      action: log.event || 'ACTION',
      label: log.event || 'Action',
      description: log.description || '',
      metadata: log.meta ? JSON.parse(log.meta) : null,
      createdAt: log.createdAt.toISOString(),
      ipAddress: log.ipAddress || null,
      actor: log.user
        ? {
            id: log.user.id,
            name: log.user.name || 'Utilisateur',
            email: log.user.email,
            avatar: log.user.avatar,
          }
        : null,
    }));

    const createCount = logs.filter((l) => l.event === 'CREATE').length;
    const updateCount = logs.filter((l) => l.event === 'UPDATE').length;
    const deleteCount = logs.filter((l) => l.event === 'DELETE').length;

    const summary = {
      total: entries.length,
      createCount,
      updateCount,
      deleteCount,
    };

    return ok({ data: entries, summary });
  } catch (error) {
    return fail('Impossible de récupérer l’historique.', 500, error);
  }
}
