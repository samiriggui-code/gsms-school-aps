import { NextRequest } from 'next/server';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized', 401);

  try {
    const sites = await prisma.clientSite.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    
    return ok({
      items: sites,
      pagination: {
        total: sites.length,
        page: 1,
        limit: sites.length,
      }
    });
  } catch (error) {
    return fail('Impossible de récupérer les sites.', 500, error);
  }
}
