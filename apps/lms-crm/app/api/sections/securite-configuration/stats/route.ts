import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { prisma } from '@/lib/prisma';
import { ok, fail } from '@/app/api/_shared/http/response';
import { StatService } from '@repo/api-core';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const statService = new StatService(prisma);
    const stats = await statService.getSecurityStats();
    return ok(stats);
  } catch (error) {
    return fail('Impossible de charger les statistiques sécurité.', 500, error);
  }
}
