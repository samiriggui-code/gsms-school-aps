import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { CRM_PERMISSION, sessionHasPermission } from '@/lib/auth/crm-permissions';


/** Liste des salles réservables (catalogue CRM). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);
  if (!sessionHasPermission(session, CRM_PERMISSION.academiqueView)) {
    return fail('Forbidden', 403);
  }

  try {
    const items = await prisma.formationVenueRoom.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        shortCode: true,
        capacity: true,
        floorLabel: true,
        sortOrder: true,
        imageUrl: true,
      },
    });
    return ok({ items });
  } catch (error) {
    return fail('Impossible de charger les salles.', 500, error);
  }
}
