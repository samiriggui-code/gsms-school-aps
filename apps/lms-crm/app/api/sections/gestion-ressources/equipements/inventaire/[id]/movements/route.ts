import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  const resolvedParams = await params;
  const id = resolvedParams?.id;
  if (!id) return fail('ID manquant', 400);
  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get('page') || 1));
  const limit = Math.max(1, Number(url.searchParams.get('limit') || 10));
  const skip = (page - 1) * limit;

  try {
    const [movements, totalCount] = await Promise.all([
      prisma.$queryRaw<any[]>`
        SELECT * FROM "StockMovement"
        WHERE "equipmentId" = ${id}
        ORDER BY "movementDate" DESC
        LIMIT ${limit} OFFSET ${skip}
      `,
      prisma.$queryRaw<any[]>`
        SELECT COUNT(*) as count FROM "StockMovement"
        WHERE "equipmentId" = ${id}
      `
    ]);

    const total = Number(totalCount[0]?.count || 0);

    return ok({
      items: movements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return fail('Impossible de récupérer les mouvements.', 500, error);
  }
}
