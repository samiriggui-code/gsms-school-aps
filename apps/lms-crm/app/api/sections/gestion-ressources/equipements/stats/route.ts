import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/app/api/auth/[...nextauth]/auth-options';
import { ok, fail } from '@/app/api/_shared/http/response';
import { prisma } from '@/lib/prisma';
import { StatService } from '@repo/api-core';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return fail('Unauthorized request', 401);

  try {
    const url = new URL(request.url);
    const days = Math.max(1, Math.min(90, Number(url.searchParams.get('days') || 30)));

    const statService = new StatService(prisma);
    const stats = await statService.getEquipementsStats(days);

    return ok(stats);
  } catch (error) {
    return fail('Impossible de recuperer les stats equipements.', 500, error);
  }
}
